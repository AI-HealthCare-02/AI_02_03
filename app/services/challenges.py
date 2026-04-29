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

# 유지 모드 연속 일수 → 패널티 회복률 매핑
_RECOVERY_TIERS = [
    (30, 1.0),
    (21, 0.75),
    (14, 0.5),
    (7, 0.3),
]

# 유지 중단 시 연속 일수 → 설문값 롤백 비율 (0.0 = 롤백 없음, 1.0 = 완전 복원)
_ROLLBACK_TIERS = [
    (30, 0.0),  # 30일+ 유지: 영구 변경으로 인정, 롤백 없음
    (21, 0.1),  # 21~29일: 10%만 롤백
    (14, 0.3),  # 14~20일: 30% 롤백
    (7, 0.6),  # 7~13일: 60% 롤백
    (0, 1.0),  # 7일 미만: 완전 롤백
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


def _get_rollback_ratio(consecutive_days: int) -> float:
    for threshold, ratio in _ROLLBACK_TIERS:
        if consecutive_days >= threshold:
            return ratio
    return 1.0


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
                    is_maintenance=uc.is_maintenance,
                    joined_at=uc.joined_at,
                    completed_at=uc.completed_at,
                )
            )
        return result

    async def complete_challenge(
        self, user: User, user_challenge_id: int, input_weight: float | None = None, input_waist: float | None = None
    ) -> ChallengeCompleteResponse:
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
            # 같은 타입의 기존 유지 모드가 있으면 롤백 없이 교체 (더 높은 마일스톤 달성)
            prev_maintenance = await self.uc_repo.get_maintenance_by_user(user.id, uc.challenge.type)
            if prev_maintenance:
                await self.uc_repo.update(prev_maintenance, {"is_maintenance": False, "survey_snapshot": None})
            update_data["is_maintenance"] = True
            update_data["last_checkin_at"] = datetime.now()

        await self.uc_repo.update(uc, update_data)

        # 설문 업데이트 (모든 챌린지 타입)
        survey_changes = None
        survey = await self.survey_repo.get_by_user_id(user.id)
        if survey:
            # 유지모드 진입 챌린지는 변경 전에 원본값 snapshot 저장
            pre_snapshot = (
                self._take_snapshot_before(uc.challenge.type, survey)
                if uc.challenge.type in _MAINTENANCE_TYPES
                else None
            )
            survey_changes = await self._apply_survey_update(uc, survey, input_weight)
            if pre_snapshot and survey_changes:
                await self.uc_repo.update(uc, {"survey_snapshot": pre_snapshot})

        # 체중/허리 명시적 입력값 적용 (모든 챌린지 공통)
        if input_weight is not None or input_waist is not None:
            current = await self.survey_repo.get_by_user_id(user.id)
            if current:
                await self._apply_body_measurements(current, input_weight, input_waist)

        # 새 점수 계산 및 예측 저장
        updated_survey = await self.survey_repo.get_by_user_id(user.id)
        new_score, new_grade = await self._run_and_save_prediction(user.id, updated_survey, score_before, latest)

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
        "채소": ("diet_q1", 1),  # diet_q1: 채소 섭취 (긍정)
        "단음식": ("diet_q2", -1),  # diet_q2: 단 음식 (부정 → 줄이기)
        "당류": ("diet_q2", -1),
        "튀김": ("diet_q3", -1),  # diet_q3: 튀김/패스트푸드 (부정 → 줄이기)
        "패스트푸드": ("diet_q3", -1),
        "균형": ("diet_q4", 1),  # diet_q4: 규칙적 식사 (긍정)
        "소식": ("diet_q5", -1),  # diet_q5: 과식 (부정 → 줄이기)
        "단백질": ("diet_q6", 1),  # diet_q6: 단백질 섭취 (긍정)
        "야식": ("diet_q7", -1),  # diet_q7: 야식 (부정 → 줄이기)
    }

    _MILESTONES = [7, 14, 21, 30]

    @staticmethod
    def _diet_tier(days: int) -> int:
        if days <= 7:
            return 0
        elif days >= 21:
            return 3
        elif days >= 14:
            return 2
        else:
            return 1

    async def _cumulative_days(self, user_id: int, challenge_type: str, current_duration: int) -> int:
        """현재 챌린지 포함, 동일 타입 완료 챌린지의 누적 duration_days 합산"""
        completed = await self.uc_repo.get_by_user_id(user_id, status="완료")
        past_days = sum(
            uc.challenge.duration_days for uc in completed if uc.challenge and uc.challenge.type == challenge_type
        )
        return past_days + current_duration

    def _take_snapshot_before(self, challenge_type: str, survey) -> dict:
        """설문 변경 전에 유지모드 롤백용 원본값 저장 (타입별 관련 필드 전체)"""
        if challenge_type == "운동":
            return {"exercise": survey.exercise, "weekly_exercise_count": survey.weekly_exercise_count}
        if challenge_type == "수면":
            return {"sleep_hours": survey.sleep_hours}
        if challenge_type == "금연":
            return {"smoking": survey.smoking, "current_smoking": survey.current_smoking}
        if challenge_type == "금주":
            return {
                "drinking": survey.drinking,
                "drink_amount": survey.drink_amount,
                "weekly_drink_freq": survey.weekly_drink_freq,
                "monthly_binge_freq": survey.monthly_binge_freq,
            }
        return {}

    async def _rollback_survey(self, user_id: int, snapshot: dict, consecutive_days: int = 0) -> None:
        """유지 중단 일수에 따라 차등 롤백 (30일+ 유지 시 롤백 없음, 7일 미만 완전 복원)"""
        survey = await self.survey_repo.get_by_user_id(user_id)
        if not survey or not snapshot:
            return

        ratio = _get_rollback_ratio(consecutive_days)
        if ratio == 0.0:
            return  # 충분히 유지했으므로 영구 변경으로 인정

        restore_data: dict = {}
        for field, before_val in snapshot.items():
            current_val = getattr(survey, field, None)
            if current_val is None:
                continue
            if isinstance(before_val, (int, float)) and isinstance(current_val, (int, float)):
                # 수치형: before 방향으로 ratio만큼만 복원
                new_val = current_val + (before_val - current_val) * ratio
                restore_data[field] = round(new_val) if isinstance(before_val, int) else round(new_val, 2)
            elif isinstance(before_val, str) and ratio >= 0.5:
                # 문자열(categorical): 절반 이상 롤백해야 할 때만 원상복귀
                restore_data[field] = before_val

        # 음주량이 0 초과로 복원되면 음주 여부도 원래대로
        if restore_data.get("drink_amount", 0) > 0 and survey.drinking == "음주안함":
            restore_data["drinking"] = snapshot.get("drinking", "음주함")

        if restore_data:
            await self.survey_repo.update(survey, restore_data)

    def _newly_crossed(self, prev: int, new: int) -> list[int]:
        """prev → new 사이에 새로 넘은 마일스톤 목록"""
        return [m for m in self._MILESTONES if prev < m <= new]

    async def _apply_survey_update(self, uc, survey, input_weight: float | None = None) -> dict | None:
        ctype = uc.challenge.type
        new_cum = await self._cumulative_days(uc.user_id, ctype, uc.challenge.duration_days)
        prev_cum = new_cum - uc.challenge.duration_days
        crossed = self._newly_crossed(prev_cum, new_cum)

        if ctype == "체중감량":
            return await self._update_weight(uc, survey, prev_cum, new_cum, crossed, input_weight)

        if not crossed:
            return None

        handlers = {
            "식단": self._update_diet,
            "식습관": self._update_diet,
            "운동": self._update_exercise,
            "금주": self._update_drinking,
            "금연": self._update_smoking,
            "수면": self._update_sleep,
        }
        handler = handlers.get(ctype)
        if handler:
            return await handler(uc, survey, prev_cum, new_cum, crossed)
        return None

    async def _update_diet(self, uc, survey, prev_cum: int, new_cum: int, crossed: list[int]) -> dict | None:
        from app.services.health_surveys import _calc_diet

        cname = uc.challenge.name
        matched = next(
            ((field, direction) for kw, (field, direction) in self._DIET_CHALLENGE_MAP.items() if kw in cname),
            None,
        )
        if not matched:
            return None
        field, direction = matched
        # 이번에 오른 티어만큼만 delta 적용 (이전 티어 → 현재 티어 차이)
        delta = (self._diet_tier(new_cum) - self._diet_tier(prev_cum)) * direction
        if delta == 0:
            return None
        before_val = getattr(survey, field)
        new_val = max(1, min(5, before_val + delta))
        if new_val == before_val:
            return None
        qs = [getattr(survey, f"diet_q{i}") for i in range(1, 8)]
        qs[int(field[-1]) - 1] = new_val
        new_score, new_eval = _calc_diet(qs)
        await self.survey_repo.update(survey, {field: new_val, "diet_score": new_score, "diet_eval": new_eval})
        return {"field": field, "before": before_val, "after": new_val}

    async def _apply_body_measurements(self, survey, input_weight: float | None, input_waist: float | None) -> None:
        updates: dict = {}
        if input_weight is not None:
            new_weight = round(max(input_weight, 30.0), 1)
            h = survey.height / 100
            new_bmi = round(new_weight / (h**2), 1)
            updates["weight"] = new_weight
            updates["bmi"] = new_bmi
            if input_waist is None and survey.bmi > 0:
                updates["waist"] = round(survey.waist * (new_bmi / survey.bmi), 1)
        if input_waist is not None:
            updates["waist"] = round(max(input_waist, 40.0), 1)
        if updates:
            await self.survey_repo.update(survey, updates)

    async def _run_and_save_prediction(self, user_id: int, survey, score_before: float, latest) -> tuple[float, str]:
        import logging

        from celery import current_app as celery_app

        from app.services.health_surveys import _calc_grade as _grade
        from app.services.health_surveys import _estimate_waist

        new_score = float(score_before)
        new_improvement_factors = latest.improvement_factors if latest else []
        new_character_state = latest.character_state if latest else "normal"

        if survey:
            try:
                waist = survey.waist if survey.waist > 0 else _estimate_waist(survey.gender, survey.bmi)
                input_data = {
                    "나이": survey.age, "성별": survey.gender, "키": survey.height,
                    "몸무게": survey.weight, "BMI": survey.bmi, "허리둘레": waist,
                    "주당운동횟수": survey.weekly_exercise_count, "흡연여부": survey.smoking,
                    "당뇨진단여부": survey.diabetes, "고혈압진단여부": survey.hypertension,
                    "수면장애여부": survey.sleep_disorder, "식습관자가평가": survey.diet_eval,
                    "간질환진단여부": "없음",
                    "음주여부": survey.drinking, "1회음주량": survey.drink_amount,
                    "주당음주빈도": survey.weekly_drink_freq, "월폭음빈도": survey.monthly_binge_freq,
                    "현재흡연여부": survey.current_smoking, "평균수면시간": survey.sleep_hours,
                }
                result = celery_app.send_task("predict_fatty_liver", args=[input_data]).get(timeout=30)
                new_score = float(result["score"])
                new_improvement_factors = result.get("improvement_factors", new_improvement_factors)
                new_character_state = result.get("stage_label", new_character_state)
            except Exception as e:
                logging.getLogger(__name__).error("챌린지 완료 예측 실패: %s", repr(e))
            new_score = await self._apply_all_penalties(user_id, survey, new_score)

        new_grade = _grade(int(new_score))
        await self.prediction_repo.create({
            "user_id": user_id, "score": new_score, "grade": new_grade,
            "character_state": new_character_state, "improvement_factors": new_improvement_factors,
        })
        return new_score, new_grade

    async def _update_weight(
        self, uc, survey, prev_cum: int, new_cum: int, crossed: list[int], input_weight: float | None = None
    ) -> dict | None:
        before_weight = survey.weight
        if input_weight is not None:
            # 사용자가 직접 입력한 체중 사용
            new_weight = round(max(input_weight, 30.0), 1)
        else:
            # 마일스톤 기반 자동 감량: 14일 첫 돌파 -2kg, 30일 첫 돌파 추가 -3kg
            kg_delta = 0.0
            if 14 in crossed:
                kg_delta += 2.0
            if 30 in crossed:
                kg_delta += 3.0
            if kg_delta == 0.0:
                return None
            new_weight = round(max(before_weight - kg_delta, 30.0), 1)
        if input_weight is None and new_weight >= before_weight:
            return None
        h = survey.height / 100
        new_bmi = round(new_weight / (h**2), 1)
        new_waist = round(survey.waist * (new_bmi / survey.bmi), 1) if survey.bmi > 0 else survey.waist
        await self.survey_repo.update(survey, {"weight": new_weight, "bmi": new_bmi, "waist": new_waist})
        return {"field": "weight", "before": before_weight, "after": new_weight}

    async def _update_exercise(self, uc, survey, prev_cum: int, new_cum: int, crossed: list[int]) -> dict | None:
        # 14일 마일스톤 돌파 → 주5회, 첫 8일(7일 초과) 돌파 → 주3회
        target = 5 if new_cum >= 14 else 3
        before = survey.weekly_exercise_count
        new_count = max(before, target)
        if new_count == before and survey.exercise == "운동함":
            return None
        await self.survey_repo.update(survey, {"exercise": "운동함", "weekly_exercise_count": new_count})
        return {"field": "weekly_exercise_count", "before": before, "after": new_count}

    async def _update_drinking(self, uc, survey, prev_cum: int, new_cum: int, crossed: list[int]) -> dict | None:
        if survey.drinking == "음주안함":
            return None
        before_amount = survey.drink_amount
        before_freq = survey.weekly_drink_freq

        if 30 in crossed:
            # 30일 마일스톤 돌파 → 완전 금주
            await self.survey_repo.update(
                survey,
                {"drinking": "음주안함", "drink_amount": 0.0, "weekly_drink_freq": 0.0, "monthly_binge_freq": 0.0},
            )
            return {"field": "drinking", "before": survey.drinking, "after": "음주안함"}

        # 새로 넘은 마일스톤(14, 21) 각각 0.5씩 곱함 (복리 감소)
        reduction_steps = len([m for m in crossed if m in (14, 21)])
        if reduction_steps == 0:
            return None
        ratio = 0.5**reduction_steps
        new_amount = round(before_amount * ratio, 2)
        new_freq = round(before_freq * ratio, 2)
        from app.services.health_surveys import _calc_monthly_binge

        new_binge = _calc_monthly_binge(new_amount, new_freq)
        await self.survey_repo.update(
            survey,
            {"drink_amount": new_amount, "weekly_drink_freq": new_freq, "monthly_binge_freq": new_binge},
        )
        return {"field": "drink_amount", "before": before_amount, "after": new_amount}

    async def _update_smoking(self, uc, survey, prev_cum: int, new_cum: int, crossed: list[int]) -> dict | None:
        if 14 not in crossed:
            return None
        if survey.current_smoking == "안함":
            return None
        before = survey.smoking
        await self.survey_repo.update(survey, {"smoking": "비흡연", "current_smoking": "안함"})
        return {"field": "smoking", "before": before, "after": "비흡연"}

    async def _update_sleep(self, uc, survey, prev_cum: int, new_cum: int, crossed: list[int]) -> dict | None:
        if 7 not in crossed:
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
            "금연": _smoking_penalty(survey.current_smoking),
            "수면": _sleep_penalty(survey.sleep_hours, survey.sleep_disorder),
        }

        total_penalty = sum(penalties.values())
        total_recovery = 0
        for ctype, penalty in penalties.items():
            total_recovery += await self._calc_penalty_recovery(user_id, ctype, penalty)

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
            consecutive = await self.log_repo.get_consecutive_days(uc.id)
            rollback_ratio = _get_rollback_ratio(consecutive)
            await self._rollback_survey(uc.user_id, uc.survey_snapshot, consecutive)
            await self.uc_repo.update(uc, {"is_maintenance": False, "survey_snapshot": None})
            rollback_pct = int(rollback_ratio * 100)
            detail = (
                f"{challenge_type} 유지 모드가 종료되었습니다. "
                f"{consecutive}일 유지 → 설문값 {rollback_pct}% 복원되었습니다."
                if rollback_ratio > 0
                else f"{challenge_type} 유지 모드가 종료되었습니다. 30일 이상 유지하여 변경값이 영구 반영됩니다."
            )
            return {
                "detail": detail,
                "is_maintenance": False,
                "consecutive_days": consecutive,
                "rollback_ratio": rollback_ratio,
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
            "금연": lambda: _smoking_penalty(survey.current_smoking),
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
        """2주 미응답 유지 모드 자동 해제 + 설문값 롤백"""
        cutoff = datetime.now() - timedelta(days=14)
        stale = await self.uc_repo.get_expired_maintenances(cutoff)
        for uc in stale:
            consecutive = await self.log_repo.get_consecutive_days(uc.id)
            await self._rollback_survey(uc.user_id, uc.survey_snapshot, consecutive)
            await self.uc_repo.update(uc, {"is_maintenance": False, "survey_snapshot": None})
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

        from app.services.badges import BADGE_MAP, BadgeService

        newly_granted = await BadgeService(self._session).evaluate_and_grant(user.id)
        earned_badge = None
        if newly_granted:
            defn = BADGE_MAP.get(newly_granted[0])
            if defn:
                earned_badge = {"name": defn["name"], "emoji": defn["emoji"]}

        return ChallengeLogResponse(
            detail="기록이 저장됐습니다.",
            log_date=log.log_date,
            days_remaining=days_remaining,
            motivation_message=motivation,
            expected_improvement=improvement,
            earned_badge=earned_badge,
        )
