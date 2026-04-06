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


# 주류별 1잔 기준 순수 알코올(g) / 14g(NHANES standard drink)
# 소주: 50ml × 17% × 0.8 = 6.8g → 0.49
# 맥주: 355ml × 5% × 0.8 = 14.2g → 1.01
# 와인: 150ml × 12% × 0.8 = 14.4g → 1.03
# 막걸리: 200ml × 6% × 0.8 = 9.6g → 0.69
# 칵테일: 100ml × 15% × 0.8 = 12g → 0.86
_DRINK_TYPE_MULTIPLIER: dict[str, float] = {
    "소주": 0.49,
    "맥주": 1.01,
    "와인": 1.03,
    "막걸리": 0.69,
    "칵테일": 0.86,
}
_DEFAULT_MULTIPLIER = 1.0
_BINGE_THRESHOLD = 5  # 5 standard drinks 이상 = 폭음


def _to_standard_drinks(drinks: float, drink_type: str | None) -> float:
    """한국 잔 수 → NHANES standard drink 변환"""
    multiplier = _DRINK_TYPE_MULTIPLIER.get(drink_type, _DEFAULT_MULTIPLIER) if drink_type else _DEFAULT_MULTIPLIER
    return round(drinks * multiplier, 2)


def _calc_monthly_binge(drink_amount_std: float, weekly_drink_freq: float) -> float:
    """standard drink 기준 1회 음주량 >= 5이면 폭음, 월 폭음 횟수 자동 계산"""
    if drink_amount_std >= _BINGE_THRESHOLD:
        return round(weekly_drink_freq * 4.33, 1)
    return 0.0


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
        drink_amount_std = _to_standard_drinks(data.drink_amount, data.drink_type)
        monthly_binge_freq = _calc_monthly_binge(drink_amount_std, data.weekly_drink_freq)

        survey_data = {
            "user_id": user.id,
            "age": data.age,
            "gender": data.gender,
            "height": data.height,
            "weight": data.weight,
            "bmi": bmi,
            "waist": data.waist,
            "drinking": data.drinking,
            "drink_amount": drink_amount_std,
            "weekly_drink_freq": data.weekly_drink_freq,
            "monthly_binge_freq": monthly_binge_freq,
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
        elif data.drink_amount is not None or data.weekly_drink_freq is not None:
            if data.drink_amount is not None:
                update_data["drink_amount"] = _to_standard_drinks(data.drink_amount, data.drink_type)
            new_drink_amount_std = update_data.get("drink_amount", survey.drink_amount)
            new_weekly_freq = data.weekly_drink_freq if data.weekly_drink_freq is not None else survey.weekly_drink_freq
            update_data["monthly_binge_freq"] = _calc_monthly_binge(new_drink_amount_std, new_weekly_freq)

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
