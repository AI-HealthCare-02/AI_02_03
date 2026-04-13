from datetime import date, datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dtos.challenges import (
    ChallengeCompleteResponse,
    ChallengeJoinResponse,
    ChallengeLogResponse,
    ChallengeResponse,
    UserChallengeResponse,
)
from app.models.users import User
from app.repositories.challenge_repository import (
    ChallengeLogRepository,
    ChallengeRepository,
    UserChallengeRepository,
)
from app.repositories.health_survey_repository import HealthSurveyRepository
from app.repositories.prediction_repository import PredictionRepository

_MOTIVATION_MESSAGES = [
    "잘 하고 있어요! 계속 유지하세요.",
    "오늘도 한 걸음 더 나아갔어요!",
    "꾸준함이 건강을 만들어요.",
    "작은 습관이 큰 변화를 만들어요!",
]

_IMPROVEMENT_MESSAGES = {
    "운동": "규칙적인 운동은 지방간 위험을 최대 30% 줄여줄 수 있어요.",
    "식단": "균형 잡힌 식단은 간 건강 개선에 직접적으로 도움이 돼요.",
    "금주": "금주는 간 지방 축적을 빠르게 줄여줄 수 있어요.",
}

# 금주 유지 연속 일수 → 회복률 매핑
_RECOVERY_TIERS = [
    (30, 1.0),  # 30일 이상: 100% 회복
    (21, 0.75),  # 21일 이상: 75%
    (14, 0.5),  # 14일 이상: 50%
    (7, 0.3),  # 7일 이상: 30%
]


def _calc_grade(score: float) -> str:
    if score >= 80:
        return "정상"
    elif score >= 55:
        return "경미"
    elif score >= 35:
        return "중등도"
    else:
        return "중증"


def _get_recommended_challenge_types(improvement_factors: list) -> list[str]:
    """개선 요인에서 챌린지 type 목록 반환"""
    return [f["challenge_type"] for f in improvement_factors] if improvement_factors else []


def _calc_recovery_rate(consecutive_days: int) -> float:
    """연속 금주 일수 → 회복률"""
    for threshold, rate in _RECOVERY_TIERS:
        if consecutive_days >= threshold:
            return rate
    return 0.0


class ChallengeService:
    def __init__(self, session: AsyncSession):
        self._session = session
        self.repo = ChallengeRepository(session)
        self.uc_repo = UserChallengeRepository(session)
        self.log_repo = ChallengeLogRepository(session)
        self.prediction_repo = PredictionRepository(session)
        self.survey_repo = HealthSurveyRepository(session)

    async def get_challenges(self, user: User) -> list[ChallengeResponse]:
        challenges = await self.repo.get_all()

        # 최근 예측의 개선 요인으로 추천 챌린지 판단
        latest = await self.prediction_repo.get_latest_by_user_id(user.id)
        recommended_types = _get_recommended_challenge_types(latest.shap_factors if latest else [])

        result = []
        for c in challenges:
            is_recommended = c.type in recommended_types
            resp = ChallengeResponse.model_validate(c)
            resp.is_recommended = is_recommended
            result.append(resp)

        return result

    async def join_challenge(self, user: User, challenge_id: int) -> ChallengeJoinResponse:
        challenge = await self.repo.get_by_id(challenge_id)
        if not challenge:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="챌린지를 찾을 수 없습니다.")

        existing = await self.uc_repo.get_active_by_user_and_challenge(user.id, challenge_id)
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="이미 진행 중인 챌린지입니다.")

        uc = await self.uc_repo.create(user.id, challenge_id)

        from app.services.badges import BadgeService
        await BadgeService(self._session).evaluate_and_grant(user.id)

        return ChallengeJoinResponse(detail="챌린지에 참여하였습니다.", user_challenge_id=uc.id)

    async def get_my_challenges(self, user: User, status_filter: str | None) -> list[UserChallengeResponse]:
        ucs = await self.uc_repo.get_by_user_id(user.id, status_filter)
        result = []
        for uc in ucs:
            completed_logs = await self.log_repo.count_completed(uc.id)
            required = uc.challenge.required_logs
            progress = min(100, round(completed_logs / required * 100)) if required > 0 else 0
            end_date = (uc.joined_at + timedelta(days=uc.challenge.duration_days)).date()
            days_left = max(0, (end_date - date.today()).days)
            today_log = await self.log_repo.get_today_log(uc.id)
            result.append(
                UserChallengeResponse(
                    user_challenge_id=uc.id,
                    challenge_name=uc.challenge.name,
                    type=uc.challenge.type,
                    description=uc.challenge.description,
                    duration_days=uc.challenge.duration_days,
                    status=uc.status,
                    progress=progress,
                    days_left=days_left,
                    today_completed=bool(today_log and today_log.is_completed),
                    joined_at=uc.joined_at,
                    completed_at=uc.completed_at,
                )
            )
        return result

    async def complete_challenge(self, user: User, user_challenge_id: int) -> ChallengeCompleteResponse:
        uc = await self.uc_repo.get_by_id_and_user(user_challenge_id, user.id)
        if not uc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="해당 챌린지를 찾을 수 없습니다.")
        if uc.status == "완료":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="이미 완료된 챌린지입니다.")

        completed_logs = await self.log_repo.count_completed(user_challenge_id)
        if completed_logs < uc.challenge.required_logs:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"완료 조건 미달: {completed_logs}/{uc.challenge.required_logs}일 달성",
            )

        latest = await self.prediction_repo.get_latest_by_user_id(user.id)
        score_before = latest.score if latest else 0.0

        update_data = {"status": "완료", "completed_at": datetime.now()}

        # 금주·금연 챌린지 완료 → 유지 모드 진입
        if uc.challenge.type in ("금주", "금연"):
            update_data["is_maintenance"] = True
            update_data["last_checkin_at"] = datetime.now()

        await self.uc_repo.update(uc, update_data)

        # 챌린지 완료 후 설문 자동 업데이트
        survey_changes = None
        survey = await self.survey_repo.get_by_user_id(user.id)
        if survey:
            survey_changes = await self._apply_challenge_survey_update(uc, survey)

        # 새 점수 계산
        from app.services.health_surveys import _calc_grade as _grade
        from app.services.health_surveys import _calc_score_from_survey

        updated_survey = await self.survey_repo.get_by_user_id(user.id)
        new_score = float(_calc_score_from_survey(updated_survey)) if updated_survey else score_before

        # 금주 유지 모드면 회복 점수 반영
        recovery = await self._calc_alcohol_recovery(user.id, updated_survey)
        new_score = min(100, new_score + recovery)
        new_grade = _grade(int(new_score))

        from app.services.badges import BadgeService
        await BadgeService(self._session).evaluate_and_grant(user.id)

        _maintenance_msg = {
            "금주": " 금주 유지 모드가 시작됩니다.",
            "금연": " 금연 유지 모드가 시작됩니다.",
        }
        return ChallengeCompleteResponse(
            detail="챌린지를 완료하였습니다." + _maintenance_msg.get(uc.challenge.type, ""),
            score_before=score_before,
            new_score=new_score,
            new_grade=new_grade,
            survey_changes=survey_changes,
        )

    # 챌린지명 키워드 → (diet_q 필드, 방향: +1 or -1)
    # 긍정 문항(q1 채소, q4 규칙식사, q6 단백질): +1
    # 부정 문항(q5 과식, q7 야식): -1
    _DIET_CHALLENGE_MAP: dict[str, tuple[str, int]] = {
        "채소": ("diet_q1", 1),
        "균형": ("diet_q4", 1),
        "소식": ("diet_q5", -1),
        "야식": ("diet_q7", -1),
    }

    async def _apply_challenge_survey_update(self, uc, survey) -> dict | None:
        """챌린지 완료 시 타입/이름별 설문 업데이트 로직"""
        ctype = uc.challenge.type
        cname = uc.challenge.name

        if ctype == "운동":
            before = survey.weekly_exercise_count
            target = 7 if "만보" in cname else 3
            new_val = max(before, target)
            if new_val != before or survey.exercise != "운동함":
                await self.survey_repo.update(survey, {"weekly_exercise_count": new_val, "exercise": "운동함"})
            return {"field": "weekly_exercise_count", "before": before, "after": new_val}

        elif ctype in ("식단", "식습관"):
            from app.services.health_surveys import _calc_diet

            # 챌린지명 키워드로 해당 문항 찾기
            matched = next(
                ((field, direction) for kw, (field, direction) in self._DIET_CHALLENGE_MAP.items() if kw in cname),
                None,
            )
            if not matched:
                return None

            field, direction = matched
            before_val = getattr(survey, field)
            new_val = max(1, min(5, before_val + direction))
            if new_val == before_val:
                return None

            # diet_q1~q7 전체 목록 재구성 후 score/eval 재계산
            qs = [getattr(survey, f"diet_q{i}") for i in range(1, 8)]
            q_idx = int(field[-1]) - 1  # "diet_q1" → 0
            qs[q_idx] = new_val
            new_score, new_eval = _calc_diet(qs)

            await self.survey_repo.update(survey, {
                field: new_val,
                "diet_score": new_score,
                "diet_eval": new_eval,
            })
            return {"field": field, "before": before_val, "after": new_val}

        elif ctype == "수면":
            if "환경" in cname and survey.sleep_disorder == "있음":
                await self.survey_repo.update(survey, {"sleep_disorder": "없음"})
                return {"field": "sleep_disorder", "before": "있음", "after": "없음"}
            else:
                before = survey.sleep_hours
                new_val = round(min(before + 0.5, 8.0), 1)
                if new_val != before:
                    await self.survey_repo.update(survey, {"sleep_hours": new_val})
                return {"field": "sleep_hours", "before": before, "after": new_val}

        elif ctype == "체중감량":
            target_kg = 5.0 if "5kg" in cname else 2.0
            before_weight = survey.weight
            new_weight = round(max(before_weight - target_kg, 30.0), 1)
            h = survey.height / 100
            new_bmi = round(new_weight / (h ** 2), 1)
            new_waist = round(survey.waist * (new_bmi / survey.bmi), 1) if survey.bmi > 0 else survey.waist
            await self.survey_repo.update(survey, {
                "weight": new_weight,
                "bmi": new_bmi,
                "waist": new_waist,
            })
            return {"field": "weight", "before": before_weight, "after": new_weight}

        elif ctype == "금연":
            updates: dict = {}
            if survey.current_smoking == "흡연":
                updates["current_smoking"] = "안함"
            await self.survey_repo.update(survey, updates) if updates else None
            return {"field": "current_smoking", "before": survey.current_smoking, "after": "안함"} if updates else None

        return None

    async def _calc_alcohol_recovery(self, user_id: int, survey) -> int:
        """금주 유지 모드의 회복 점수 계산"""
        uc = await self.uc_repo.get_maintenance_by_user(user_id, "금주")
        if not uc:
            return 0

        consecutive = await self.log_repo.get_consecutive_days(uc.id)
        recovery_rate = _calc_recovery_rate(consecutive)
        if recovery_rate == 0:
            return 0

        from app.utils.score import _alcohol_penalty

        alcohol_data = {
            "음주여부": survey.drinking,
            "1회음주량": survey.drink_amount,
            "주당음주빈도": survey.weekly_drink_freq,
            "월폭음빈도": survey.monthly_binge_freq,
        }
        penalty = _alcohol_penalty(alcohol_data)
        return round(abs(penalty) * recovery_rate)

    async def weekly_checkin(self, user: User, still_sober: bool) -> dict:
        """금주 유지 주간 체크인"""
        uc = await self.uc_repo.get_maintenance_by_user(user.id, "금주")
        if not uc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="금주 유지 모드가 아닙니다.",
            )

        if not still_sober:
            # 음주 재개 → 유지 모드 해제
            await self.uc_repo.update(uc, {"is_maintenance": False})
            return {
                "detail": "금주 유지 모드가 종료되었습니다. 다시 도전해보세요!",
                "is_maintenance": False,
                "recovery_points": 0,
            }

        # 체크인 로그 기록 + 타임스탬프 갱신
        await self.log_repo.create(uc.id, is_completed=True)
        await self.uc_repo.update(uc, {"last_checkin_at": datetime.now()})

        consecutive = await self.log_repo.get_consecutive_days(uc.id)
        recovery_rate = _calc_recovery_rate(consecutive)

        survey = await self.survey_repo.get_by_user_id(user.id)
        recovery = await self._calc_alcohol_recovery(user.id, survey)

        return {
            "detail": f"금주 {consecutive}일째 유지 중! 회복률 {int(recovery_rate * 100)}%",
            "is_maintenance": True,
            "consecutive_days": consecutive,
            "recovery_rate": recovery_rate,
            "recovery_points": recovery,
        }

    async def expire_stale_maintenances(self) -> int:
        """2주 미응답 유지 모드 자동 해제 (스케줄러에서 호출)"""
        cutoff = datetime.now() - timedelta(days=14)
        stale = await self.uc_repo.get_expired_maintenances(cutoff)
        for uc in stale:
            await self.uc_repo.update(uc, {"is_maintenance": False})
        return len(stale)

    async def add_log(self, user: User, user_challenge_id: int, is_completed: bool) -> ChallengeLogResponse:
        uc = await self.uc_repo.get_by_id_and_user(user_challenge_id, user.id)
        if not uc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="해당 챌린지를 찾을 수 없습니다.")

        existing = await self.log_repo.get_today_log(user_challenge_id)
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="오늘 이미 기록하였습니다.")

        log = await self.log_repo.create(user_challenge_id, is_completed)

        completed_logs = await self.log_repo.count_completed(user_challenge_id)
        days_remaining = max(0, uc.challenge.required_logs - completed_logs)

        motivation = _MOTIVATION_MESSAGES[completed_logs % len(_MOTIVATION_MESSAGES)]
        improvement = _IMPROVEMENT_MESSAGES.get(uc.challenge.type, "꾸준한 실천이 건강을 만들어요.")

        from app.services.badges import BadgeService
        await BadgeService(self._session).evaluate_and_grant(user.id)

        return ChallengeLogResponse(
            detail="기록이 저장됐습니다.",
            log_date=log.log_date,
            days_remaining=days_remaining,
            motivation_message=motivation,
            expected_improvement=improvement,
        )
