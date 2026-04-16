from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.predictions import Prediction
from app.models.users import User
from app.repositories.challenge_repository import ChallengeLogRepository, ChallengeRepository, UserChallengeRepository
from app.repositories.health_survey_repository import HealthSurveyRepository
from app.repositories.prediction_repository import PredictionRepository


def _calc_grade(score: float) -> str:
    if score >= 80:
        return "정상"
    elif score >= 55:
        return "경미"
    elif score >= 30:
        return "중등도"
    else:
        return "중증"


def _survey_to_features(survey) -> dict:
    """ML 모델 피처 13개 + 패널티 계산용 비모델 피처를 함께 전달.
    ai_worker에서 _PENALTY_COLS를 분리해 패널티 계산에만 사용.
    """
    return {
        # ── ML 모델 피처 (13개) ──────────────────────────
        "나이": survey.age,
        "성별": survey.gender,
        "키": survey.height,
        "몸무게": survey.weight,
        "BMI": survey.bmi,
        "허리둘레": survey.waist,
        "주당운동횟수": survey.weekly_exercise_count,
        "흡연여부": survey.smoking,
        "당뇨진단여부": survey.diabetes,
        "고혈압진단여부": survey.hypertension,
        "수면장애여부": survey.sleep_disorder,
        "식습관자가평가": survey.diet_eval,
        "간질환진단여부": "없음",
        # ── 패널티 계산용 (모델 미포함) ─────────────────
        "음주여부": survey.drinking,
        "1회음주량": survey.drink_amount,
        "주당음주빈도": survey.weekly_drink_freq,
        "월폭음빈도": survey.monthly_binge_freq,
        "현재흡연여부": survey.current_smoking,
        "평균수면시간": survey.sleep_hours,
    }


class PredictionService:
    def __init__(self, session: AsyncSession):
        self._session = session
        self.repo = PredictionRepository(session)
        self.survey_repo = HealthSurveyRepository(session)
        self.challenge_repo = ChallengeRepository(session)
        self.uc_repo = UserChallengeRepository(session)
        self.log_repo = ChallengeLogRepository(session)

    async def predict(self, user: User) -> Prediction:
        survey = await self.survey_repo.get_by_user_id(user.id)
        if not survey:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="설문 데이터가 없습니다. 먼저 설문을 완료해주세요.",
            )

        from celery import current_app as celery_app

        features = _survey_to_features(survey)
        task_result = celery_app.send_task("predict_fatty_liver", args=[features])

        try:
            result = task_result.get(timeout=30)
        except Exception as e:
            import logging

            logging.getLogger(__name__).error("Celery task failed: %s", repr(e))
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"AI 예측 서비스에 연결할 수 없습니다. ({repr(e)})",
            ) from e

        score = result["score"]

        # 전체 패널티 + 유지 모드 회복 반영
        score = await self._apply_all_penalties(user.id, survey, score)

        grade = _calc_grade(score)

        improvement_factors = result.get("improvement_factors", [])
        prediction = await self.repo.create(
            {
                "user_id": user.id,
                "score": score,
                "grade": grade,
                "character_state": result["stage_label"],
                "improvement_factors": improvement_factors,
            }
        )

        # counterfactual 개선 요인 기반 추천 챌린지
        challenge_types = [f["challenge_type"] for f in improvement_factors]
        all_challenges = await self.challenge_repo.get_all()
        matched = [{"id": c.id, "name": c.name, "type": c.type} for c in all_challenges if c.type in challenge_types]

        if matched:
            prediction.recommended_challenges = matched
        else:
            # 개선 여지 없음(이미 건강) → 운동 챌린지 우선 추천
            general = [{"id": c.id, "name": c.name, "type": c.type} for c in all_challenges if c.type == "운동"]
            prediction.recommended_challenges = general or [
                {"id": c.id, "name": c.name, "type": c.type} for c in all_challenges[:2]
            ]

        return prediction

    async def _apply_all_penalties(self, user_id: int, survey, base_score: float) -> float:
        """4개 패널티 적용 + 유지 모드 회복 반영"""
        from app.services.challenges import _calc_recovery_rate
        from app.utils.score import (
            _alcohol_penalty,
            _exercise_penalty,
            _sleep_penalty,
            _smoking_penalty,
        )

        penalties = {
            "금주": _alcohol_penalty(
                {
                    "음주여부": survey.drinking,
                    "1회음주량": survey.drink_amount,
                    "주당음주빈도": survey.weekly_drink_freq,
                    "월폭음빈도": survey.monthly_binge_freq,
                }
            ),
            "운동": _exercise_penalty(survey.weekly_exercise_count),
            "금연": _smoking_penalty(survey.current_smoking, survey.smoking),
            "수면": _sleep_penalty(survey.sleep_hours, survey.sleep_disorder),
        }

        total_penalty = sum(penalties.values())

        total_recovery = 0
        for ctype, penalty in penalties.items():
            if penalty >= 0:
                continue
            uc = await self.uc_repo.get_maintenance_by_user(user_id, ctype)
            if not uc:
                continue
            consecutive = await self.log_repo.get_consecutive_days(uc.id)
            rate = _calc_recovery_rate(consecutive)
            total_recovery += round(abs(penalty) * rate)

        return min(100.0, max(10.0, base_score + total_penalty + total_recovery))

    async def get_predictions(self, user: User) -> list[Prediction]:
        return await self.repo.get_by_user_id(user.id)

    async def get_latest_prediction(self, user: User) -> Prediction:
        prediction = await self.repo.get_latest_by_user_id(user.id)
        if not prediction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="예측 결과가 없습니다.",
            )
        return prediction
