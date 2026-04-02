import pandas as pd
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from ai_worker.tasks.predict import _load_model, _proba_to_score
from app.dtos.health_surveys import SurveyCreateRequest, SurveyUpdateRequest, SurveyUpdateResponse
from app.models.health_surveys import HealthSurvey
from app.models.users import User
from app.repositories.health_survey_repository import HealthSurveyRepository
from app.repositories.prediction_repository import PredictionRepository
from app.repositories.user_repository import UserRepository


def _calc_bmi(weight: float, height: float) -> float:
    return round(weight / (height / 100) ** 2, 1)


def _calc_grade(score: int) -> str:
    if score >= 80:
        return "정상"
    elif score >= 55:
        return "경미"
    elif score >= 30:
        return "중등도"
    else:
        return "중증"


def _calc_score_from_survey(survey: HealthSurvey) -> int:
    features = {
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
    model = _load_model()
    proba = model.predict_proba(pd.DataFrame([features]))[0]
    return _proba_to_score(proba)


def _calc_diet(questions: list[int]) -> tuple[int, str]:
    score = sum(questions)
    if score >= 28:
        return score, "좋음"
    elif score >= 21:
        return score, "보통"
    else:
        return score, "나쁨"


class HealthSurveyService:
    def __init__(self, session: AsyncSession):
        self._session = session
        self.repo = HealthSurveyRepository(session)
        self.user_repo = UserRepository(session)

    async def create_survey(self, user: User, data: SurveyCreateRequest) -> HealthSurvey:
        existing = await self.repo.get_by_user_id(user.id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="이미 설문을 완료했습니다.",
            )

        bmi = _calc_bmi(data.weight, data.height)
        diet_score, diet_eval = _calc_diet(data.diet_questions)

        survey_data = {
            "user_id": user.id,
            "age": data.age,
            "gender": data.gender,
            "height": data.height,
            "weight": data.weight,
            "bmi": bmi,
            "waist": data.waist,
            "drinking": data.drinking,
            "drink_amount": data.drink_amount,
            "weekly_drink_freq": data.weekly_drink_freq,
            "monthly_binge_freq": data.monthly_binge_freq,
            "exercise": data.exercise,
            "weekly_exercise_count": data.weekly_exercise_count,
            "smoking": data.smoking,
            "current_smoking": data.current_smoking,
            "sleep_hours": data.sleep_hours,
            "sleep_disorder": data.sleep_disorder,
            "diet_score": diet_score,
            "diet_eval": diet_eval,
            "diabetes": data.diabetes,
            "hypertension": data.hypertension,
        }
        survey = await self.repo.create(survey_data)

        # 온보딩 완료 처리
        await self.user_repo.update_instance(user, {"is_onboarded": True})

        return survey

    async def get_survey(self, user: User) -> HealthSurvey:
        survey = await self.repo.get_by_user_id(user.id)
        if not survey:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="설문 데이터가 없습니다.",
            )
        return survey

    async def update_survey(self, user: User, data: SurveyUpdateRequest) -> SurveyUpdateResponse:
        survey = await self.get_survey(user)

        # 이전 점수: DB에 저장된 최근 예측 결과 사용
        latest = await PredictionRepository(self._session).get_latest_by_user_id(user.id)
        score_before = int(latest.score) if latest else 0

        update_data: dict = {}

        if data.weight or data.height:
            new_weight = data.weight or survey.weight
            new_height = data.height or survey.height
            update_data["bmi"] = _calc_bmi(new_weight, new_height)

        if data.diet_questions:
            diet_score, diet_eval = _calc_diet(data.diet_questions)
            update_data["diet_score"] = diet_score
            update_data["diet_eval"] = diet_eval

        if data.drinking == "음주안함":
            update_data["drink_amount"] = 0.0
            update_data["weekly_drink_freq"] = 0.0
            update_data["monthly_binge_freq"] = 0.0

        if data.exercise == "운동안함":
            update_data["weekly_exercise_count"] = 0

        raw = data.model_dump(exclude_none=True, exclude={"diet_questions"})
        update_data.update(raw)

        updated = await self.repo.update(survey, update_data)

        # 업데이트된 설문으로 새 점수 계산
        new_score = _calc_score_from_survey(updated)
        new_grade = _calc_grade(new_score)

        return SurveyUpdateResponse(
            detail="설문이 수정됐습니다.",
            bmi=updated.bmi,
            score_before=score_before,
            new_score=new_score,
            new_grade=new_grade,
            score_change=new_score - score_before,
        )
