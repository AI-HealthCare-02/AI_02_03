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

# 유지 모드 진입 챌린지 타입 (패널티 회복 방식)
_MAINTENANCE_TYPES = {"운동", "수면", "금연", "금주"}

# 금주 유지 연속 일수 → 회복률 매핑 (모든 패널티 타입 공통)
_RECOVERY_TIERS = [
    (30, 1.0),
    (21, 0.75),
    (14, 0.5),
    (7, 0.3),
]

_MAINTENANCE_MESSAGES = {
    "운동": " 운동 유지 모드가 시작됩니다. 꾸준히 기록해 패널티를 줄여보세요.",
    "수면": " 수면 유지 모드가 시작됩니다. 꾸준히 기록해 패널티를 줄여보세요.",
    "금연": " 금연 유지 모드가 시작됩니다.",
    "금주": " 금주 유지 모드가 시작됩니다.",
}


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
    return [f["challenge_type"] for f in improvement_factors] if improvement_factors else []


def _calc_recovery_rate(consecutive_days: int) -> float:
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
        challenges = await self.repo.get_all_visible(user.id)
        latest = await self.prediction_repo.get_latest_by_user_id(user.id)
        recommended_types = _get_recommended_challenge_types(latest.improvement_factors if latest else [])

        challenge_ids = [c.id for c in challenges]
        counts = await self.repo.get_participant_counts(challenge_ids)

        result = []
        for c in challenges:
            resp = ChallengeResponse.model_validate(c)
            resp.is_recommended = c.type in recommended_types
            resp.participant_count = counts.get(c.id, 0)
            resp.is_custom = c.is_custom
            result.append(resp)
        return result

    async def delete_custom_challenge(self, user: User, challenge_id: int) -> dict:
        deleted = await self.repo.delete_custom(challenge_id, user.id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="챌린지를 찾을 수 없거나 삭제 권한이 없습니다."
            )
        return {"detail": "챌린지가 삭제되었습니다."}

    async def create_custom_challenge(self, user: User, data) -> ChallengeJoinResponse:
        challenge = await self.repo.create_custom(
            user_id=user.id,
            title=data.title,
            description=data.description,
            category=data.category,
            duration_days=data.duration_days,
        )
        uc = await self.uc_repo.create(user.id, challenge.id)
        return ChallengeJoinResponse(detail="나만의 챌린지가 시작되었습니다.", user_challenge_id=uc.id)

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
                    challenge_id=uc.challenge_id,
                    challenge_name=uc.challenge.name,
                    type=uc.challenge.type,
                    description=uc.challenge.description,
                    duration_days=uc.challenge.duration_days,
                    required_logs=uc.challenge.required_logs,
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

        update_data: dict = {"status": "완료", "completed_at": datetime.now()}

        # 패널티 회복 방식 챌린지 → 유지 모드 진입
        if uc.challenge.type in _MAINTENANCE_TYPES:
            update_data["is_maintenance"] = True
            update_data["last_checkin_at"] = datetime.now()

        await self.uc_repo.update(uc, update_data)

        # 설문 업데이트 (모든 챌린지 타입)
        survey_changes = None
        survey = await self.survey_repo.get_by_user_id(user.id)
        if survey:
            survey_changes = await self._apply_survey_update(uc, survey)

        # 새 점수 계산
        from app.services.health_surveys import _calc_grade as _grade
        from app.services.health_surveys import _calc_score_from_survey

        updated_survey = await self.survey_repo.get_by_user_id(user.id)
        try:
            new_score = await _calc_score_from_survey(updated_survey) if updated_survey else score_before
            new_score = await self._apply_all_penalties(user.id, updated_survey, new_score)
        except Exception:
            new_score = float(score_before)
        new_grade = _grade(int(new_score))

        from app.services.badges import BadgeService

        badge_service = BadgeService(self._session)
        await badge_service.evaluate_and_grant(user.id)
        await badge_service.grant_ai_badge(
            user_id=user.id,
            challenge_name=uc.challenge.name,
            challenge_type=uc.challenge.type,
            duration_days=uc.challenge.duration_days,
            completed_at=datetime.now(),
        )

        detail = "챌린지를 완료하였습니다." + _MAINTENANCE_MESSAGES.get(uc.challenge.type, "")
        return ChallengeCompleteResponse(
            detail=detail,
            score_before=score_before,
            new_score=new_score,
            new_grade=new_grade,
            survey_changes=survey_changes,
        )

    # ─── 설문 업데이트 방식 (식습관/식단/체중감량만) ────────────────────────

    _DIET_CHALLENGE_MAP: dict[str, tuple[str, int]] = {
        "채소": ("diet_q1", 1),       # diet_q1: 채소 섭취 (긍정)
        "단음식": ("diet_q2", -1),    # diet_q2: 단 음식 (부정 → 줄이기)
        "당류": ("diet_q2", -1),
        "튀김": ("diet_q3", -1),      # diet_q3: 튀김/패스트푸드 (부정 → 줄이기)
        "패스트푸드": ("diet_q3", -1),
        "균형": ("diet_q4", 1),       # diet_q4: 규칙적 식사 (긍정)
        "소식": ("diet_q5", -1),      # diet_q5: 과식 (부정 → 줄이기)
        "단백질": ("diet_q6", 1),     # diet_q6: 단백질 섭취 (긍정)
        "야식": ("diet_q7", -1),      # diet_q7: 야식 (부정 → 줄이기)
    }

    @staticmethod
    def _diet_delta(direction: int, duration_days: int) -> int:
        """기간에 따라 식습관 점수 변화량 결정
        ≤7일: 0 (배지만), 8~13일: ±1, 14~20일: ±2, 21일+: ±3
        """
        if duration_days <= 7:
            magnitude = 0
        elif duration_days >= 21:
            magnitude = 3
        elif duration_days >= 14:
            magnitude = 2
        else:
            magnitude = 1
        return direction * magnitude

    async def _apply_survey_update(self, uc, survey) -> dict | None:
        ctype = uc.challenge.type
        handlers = {
            "식단": self._update_diet,
            "식습관": self._update_diet,
            "체중감량": self._update_weight,
            "운동": self._update_exercise,
            "금주": self._update_drinking,
            "금연": self._update_smoking,
            "수면": self._update_sleep,
        }
        handler = handlers.get(ctype)
        if handler:
            return await handler(uc, survey)
        return None

    async def _update_diet(self, uc, survey) -> dict | None:
        from app.services.health_surveys import _calc_diet

        cname = uc.challenge.name
        matched = next(
            ((field, direction) for kw, (field, direction) in self._DIET_CHALLENGE_MAP.items() if kw in cname),
            None,
        )
        if not matched:
            return None
        field, direction = matched
        delta = self._diet_delta(direction, uc.challenge.duration_days)
        before_val = getattr(survey, field)
        new_val = max(1, min(5, before_val + delta))
        if new_val == before_val:
            return None
        qs = [getattr(survey, f"diet_q{i}") for i in range(1, 8)]
        qs[int(field[-1]) - 1] = new_val
        new_score, new_eval = _calc_diet(qs)
        await self.survey_repo.update(survey, {field: new_val, "diet_score": new_score, "diet_eval": new_eval})
        return {"field": field, "before": before_val, "after": new_val}

    async def _update_weight(self, uc, survey) -> dict | None:
        # 14일 미만은 유의미한 감량 불가 → 배지만
        if uc.challenge.duration_days < 14:
            return None
        # 30일 이상이면 5kg, 미만이면 2kg
        target_kg = 5.0 if uc.challenge.duration_days >= 30 else 2.0
        before_weight = survey.weight
        new_weight = round(max(before_weight - target_kg, 30.0), 1)
        h = survey.height / 100
        new_bmi = round(new_weight / (h**2), 1)
        new_waist = round(survey.waist * (new_bmi / survey.bmi), 1) if survey.bmi > 0 else survey.waist
        await self.survey_repo.update(survey, {"weight": new_weight, "bmi": new_bmi, "waist": new_waist})
        return {"field": "weight", "before": before_weight, "after": new_weight}

    async def _update_exercise(self, uc, survey) -> dict | None:
        # 7일 이하는 배지만
        if uc.challenge.duration_days <= 7:
            return None
        target = 5 if uc.challenge.duration_days >= 14 else 3
        before = survey.weekly_exercise_count
        new_count = max(before, target)
        if new_count == before and survey.exercise == "운동함":
            return None
        await self.survey_repo.update(survey, {"exercise": "운동함", "weekly_exercise_count": new_count})
        return {"field": "weekly_exercise_count", "before": before, "after": new_count}

    async def _update_drinking(self, uc, survey) -> dict | None:
        # 14일 미만은 배지만 (단기간에 음주 습관 변화 불가)
        if uc.challenge.duration_days < 14:
            return None
        if survey.drinking == "음주안함":
            return None
        before = survey.drinking
        await self.survey_repo.update(
            survey, {"drinking": "음주안함", "drink_amount": 0.0, "weekly_drink_freq": 0.0, "monthly_binge_freq": 0.0}
        )
        return {"field": "drinking", "before": before, "after": "음주안함"}

    async def _update_smoking(self, uc, survey) -> dict | None:
        # 14일 미만은 배지만 (단기간 금연은 습관 변화로 인정 불가)
        if uc.challenge.duration_days < 14:
            return None
        if survey.current_smoking == "안함":
            return None
        before = survey.smoking
        await self.survey_repo.update(survey, {"smoking": "비흡연", "current_smoking": "안함"})
        return {"field": "smoking", "before": before, "after": "비흡연"}

    async def _update_sleep(self, uc, survey) -> dict | None:
        # 7일 미만은 배지만 (수면 습관 개선에 최소 1주일 필요)
        if uc.challenge.duration_days < 7:
            return None
        before = survey.sleep_hours
        new_hours = max(before, 7.0)
        if new_hours == before:
            return None
        await self.survey_repo.update(survey, {"sleep_hours": new_hours})
        return {"field": "sleep_hours", "before": before, "after": new_hours}

    # ─── 패널티 + 회복 통합 계산 ─────────────────────────────────────────────

    async def _apply_all_penalties(self, user_id: int, survey, base_score: float) -> float:
        if not survey:
            return base_score

        from app.utils.score import (
            _alcohol_penalty,
            _exercise_penalty,
            _sleep_penalty,
            _smoking_penalty,
        )

        alcohol_data = {
            "음주여부": survey.drinking,
            "1회음주량": survey.drink_amount,
            "주당음주빈도": survey.weekly_drink_freq,
            "월폭음빈도": survey.monthly_binge_freq,
        }

        penalties = {
            "금주": _alcohol_penalty(alcohol_data),
            "운동": _exercise_penalty(survey.weekly_exercise_count),
            "금연": _smoking_penalty(survey.current_smoking, survey.smoking),
            "수면": _sleep_penalty(survey.sleep_hours, survey.sleep_disorder),
        }

        total_penalty = sum(penalties.values())
        total_recovery = sum(
            await self._calc_penalty_recovery(user_id, ctype, penalty) for ctype, penalty in penalties.items()
        )

        return min(100.0, max(10.0, base_score + total_penalty + total_recovery))

    async def _calc_penalty_recovery(self, user_id: int, challenge_type: str, penalty: int) -> int:
        """유지 모드 연속 일수에 따라 해당 타입의 패널티를 회복"""
        if penalty >= 0:
            return 0
        uc = await self.uc_repo.get_maintenance_by_user(user_id, challenge_type)
        if not uc:
            return 0
        consecutive = await self.log_repo.get_consecutive_days(uc.id)
        recovery_rate = _calc_recovery_rate(consecutive)
        return round(abs(penalty) * recovery_rate)

    # ─── 유지 모드 체크인 ─────────────────────────────────────────────────────

    async def maintenance_checkin(self, user: User, challenge_type: str, still_maintaining: bool) -> dict:
        """유지 모드 체크인 (금주/금연/운동/수면 공통)"""
        uc = await self.uc_repo.get_maintenance_by_user(user.id, challenge_type)
        if not uc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"{challenge_type} 유지 모드가 아닙니다.",
            )

        if not still_maintaining:
            await self.uc_repo.update(uc, {"is_maintenance": False})
            return {
                "detail": f"{challenge_type} 유지 모드가 종료되었습니다. 다시 도전해보세요!",
                "is_maintenance": False,
                "recovery_rate": 0,
                "recovery_points": 0,
            }

        await self.log_repo.create(uc.id, is_completed=True)
        await self.uc_repo.update(uc, {"last_checkin_at": datetime.now()})

        consecutive = await self.log_repo.get_consecutive_days(uc.id)
        recovery_rate = _calc_recovery_rate(consecutive)

        survey = await self.survey_repo.get_by_user_id(user.id)

        from app.utils.score import (
            _alcohol_penalty,
            _exercise_penalty,
            _sleep_penalty,
            _smoking_penalty,
        )

        penalty_fn_map = {
            "금주": lambda: _alcohol_penalty(
                {
                    "음주여부": survey.drinking,
                    "1회음주량": survey.drink_amount,
                    "주당음주빈도": survey.weekly_drink_freq,
                    "월폭음빈도": survey.monthly_binge_freq,
                }
            ),
            "운동": lambda: _exercise_penalty(survey.weekly_exercise_count),
            "금연": lambda: _smoking_penalty(survey.current_smoking, survey.smoking),
            "수면": lambda: _sleep_penalty(survey.sleep_hours, survey.sleep_disorder),
        }

        penalty = penalty_fn_map[challenge_type]() if survey else 0
        recovery_points = round(abs(penalty) * recovery_rate)

        return {
            "detail": f"{challenge_type} {consecutive}일째 유지 중! 회복률 {int(recovery_rate * 100)}%",
            "is_maintenance": True,
            "consecutive_days": consecutive,
            "recovery_rate": recovery_rate,
            "recovery_points": recovery_points,
        }

    async def quit_challenge(self, user: User, user_challenge_id: int) -> dict:
        uc = await self.uc_repo.get_by_id_and_user(user_challenge_id, user.id)
        if not uc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="해당 챌린지를 찾을 수 없습니다.")
        if uc.status != "진행중":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="진행 중인 챌린지가 아닙니다.")
        await self.uc_repo.update(uc, {"status": "중단", "is_maintenance": False})
        return {"detail": "챌린지가 중단되었습니다."}

    async def expire_stale_maintenances(self) -> int:
        """2주 미응답 유지 모드 자동 해제"""
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
