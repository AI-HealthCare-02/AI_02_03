from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.predictions import Prediction
from app.models.users import User
from app.repositories.challenge_repository import ChallengeRepository
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
    return {
        "나이": survey.age,
        "성별": survey.gender,
        "키": survey.height,
        "몸무게": survey.weight,
        "BMI": survey.bmi,
        "허리둘레": survey.waist,
        "음주여부": survey.drinking,
        "1회음주량": survey.drink_amount,
        "주당음주빈도": survey.weekly_drink_freq,
        "월폭음빈도": survey.monthly_binge_freq,
        "운동여부": survey.exercise,
        "주당운동횟수": survey.weekly_exercise_count,
        "흡연여부": survey.smoking,
        "현재흡연여부": survey.current_smoking,
        "당뇨진단여부": survey.diabetes,
        "고혈압진단여부": survey.hypertension,
        "수면장애여부": survey.sleep_disorder,
        "평균수면시간": survey.sleep_hours,
        "식습관자가평가": survey.diet_eval,
    }


class PredictionService:
    def __init__(self, session: AsyncSession):
        self._session = session
        self.repo = PredictionRepository(session)
        self.survey_repo = HealthSurveyRepository(session)
        self.challenge_repo = ChallengeRepository(session)

    async def predict(self, user: User) -> Prediction:
        survey = await self.survey_repo.get_by_user_id(user.id)
        if not survey:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="설문 데이터가 없습니다. 먼저 설문을 완료해주세요.",
            )

        from ai_worker.tasks.predict import predict_fatty_liver

        features = _survey_to_features(survey)
        task_result = predict_fatty_liver.delay(features)

        try:
            result = task_result.get(timeout=30)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI 예측 서비스에 연결할 수 없습니다.",
            )

        score = result["score"]
        grade = _calc_grade(score)

        improvement_factors = result.get("improvement_factors", [])
        prediction = await self.repo.create({
            "user_id": user.id,
            "score": score,
            "grade": grade,
            "character_state": result["stage_label"],
            "shap_factors": improvement_factors,
        })

        # counterfactual 개선 요인 기반 추천 챌린지
        challenge_types = [f["challenge_type"] for f in improvement_factors]
        all_challenges = await self.challenge_repo.get_all()
        matched = [
            {"id": c.id, "name": c.name, "type": c.type}
            for c in all_challenges
            if c.type in challenge_types
        ]

        if matched:
            prediction.recommended_challenges = matched
        else:
            # 개선 여지 없음(이미 건강) → 운동 챌린지 우선 추천
            general = [
                {"id": c.id, "name": c.name, "type": c.type}
                for c in all_challenges
                if c.type == "운동"
            ]
            prediction.recommended_challenges = general or [
                {"id": c.id, "name": c.name, "type": c.type}
                for c in all_challenges[:2]
            ]

        return prediction

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
