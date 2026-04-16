import asyncio

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dtos.health_surveys import SurveyCreateRequest, SurveyUpdateRequest, SurveyUpdateResponse
from app.models.health_surveys import HealthSurvey
from app.models.users import User
from app.repositories.challenge_repository import ChallengeLogRepository, UserChallengeRepository
from app.repositories.health_survey_repository import HealthSurveyRepository
from app.repositories.prediction_repository import PredictionRepository
from app.repositories.user_repository import UserRepository
from app.utils.score import _alcohol_penalty, _exercise_penalty, _sleep_penalty, _smoking_penalty


def _clip(value: float, lo: float, hi: float) -> float:
    return round(max(lo, min(hi, value)), 1)


def _calc_bmi(weight: float, height: float) -> float:
    return round(weight / (height / 100) ** 2, 1)


def _estimate_waist(gender: str, bmi: float) -> float:
    """허리둘레 미입력 시 성별+BMI 기반 추정값 반환"""
    if gender == "남성":
        return round(bmi * 2.8, 1)
    return round(bmi * 2.6, 1)


def _calc_grade(score: int) -> str:
    if score >= 80:
        return "정상"
    elif score >= 55:
        return "경미"
    elif score >= 35:
        return "중등도"
    else:
        return "중증"


async def _calc_score_from_survey(survey: HealthSurvey) -> int:
    """ML 모델 점수만 반환 (패널티 미포함) — 패널티는 호출부에서 별도 적용"""
    from celery import current_app as celery_app

    waist = survey.waist if survey.waist > 0 else _estimate_waist(survey.gender, survey.bmi)

    input_data = {
        "나이": survey.age,
        "성별": survey.gender,
        "키": survey.height,
        "몸무게": survey.weight,
        "BMI": survey.bmi,
        "허리둘레": waist,
        "주당운동횟수": survey.weekly_exercise_count,
        "흡연여부": survey.smoking,
        "당뇨진단여부": survey.diabetes,
        "고혈압진단여부": survey.hypertension,
        "수면장애여부": survey.sleep_disorder,
        "식습관자가평가": survey.diet_eval,
        "간질환진단여부": "없음",
    }
    result = await asyncio.to_thread(
        lambda: celery_app.send_task("predict_fatty_liver", args=[input_data]).get(timeout=30)
    )
    return result["score"]


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
    # 긍정 문항: 0(채소), 3(규칙적 식사), 5(단백질) → 그대로
    # 부정 문항: 1(단 음식), 2(튀김/패스트푸드), 4(과식), 6(야식) → 역산 (6 - x)
    negative = {1, 2, 4, 6}
    score = sum(6 - q if i in negative else q for i, q in enumerate(questions))
    # 범위: 7~35점, 5단계 균등 분할
    if score >= 31:
        return score, "매우좋음"
    elif score >= 25:
        return score, "좋음"
    elif score >= 19:
        return score, "보통"
    elif score >= 13:
        return score, "나쁨"
    else:
        return score, "매우나쁨"


class HealthSurveyService:
    def __init__(self, session: AsyncSession):
        self._session = session
        self.repo = HealthSurveyRepository(session)
        self.user_repo = UserRepository(session)
        self.uc_repo = UserChallengeRepository(session)
        self.log_repo = ChallengeLogRepository(session)

    async def create_survey(self, user: User, data: SurveyCreateRequest) -> HealthSurvey:
        existing = await self.repo.get_by_user_id(user.id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="이미 설문을 완료했습니다.",
            )

        height = _clip(data.height, 100, 250)
        weight = _clip(data.weight, 20, 300)
        bmi = _calc_bmi(weight, height)
        waist = data.waist if data.waist > 0 else _estimate_waist(data.gender, bmi)
        waist = _clip(waist, 40, 200)

        diet_score, diet_eval = _calc_diet(data.diet_questions)
        drink_amount_std = _to_standard_drinks(data.drink_amount, data.drink_type)
        monthly_binge_freq = _calc_monthly_binge(drink_amount_std, data.weekly_drink_freq)

        survey_data = {
            "user_id": user.id,
            "age": data.age,
            "gender": data.gender,
            "height": height,
            "weight": weight,
            "bmi": bmi,
            "waist": waist,
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
            "diet_q1": data.diet_questions[0],
            "diet_q2": data.diet_questions[1],
            "diet_q3": data.diet_questions[2],
            "diet_q4": data.diet_questions[3],
            "diet_q5": data.diet_questions[4],
            "diet_q6": data.diet_questions[5],
            "diet_q7": data.diet_questions[6],
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

    async def _apply_all_penalties(self, user_id: int, survey, base_score: float) -> float:
        """4개 패널티 적용 + 유지 모드 회복 반영"""
        from app.services.challenges import _calc_recovery_rate

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

    async def update_survey(self, user: User, data: SurveyUpdateRequest) -> SurveyUpdateResponse:
        survey = await self.get_survey(user)

        latest = await PredictionRepository(self._session).get_latest_by_user_id(user.id)
        score_before = int(latest.score) if latest else 0

        update_data: dict = {}
        if data.height is not None:
            update_data["height"] = _clip(data.height, 100, 250)
        if data.weight is not None:
            update_data["weight"] = _clip(data.weight, 20, 300)

        new_height = update_data.get("height") or survey.height
        new_weight = update_data.get("weight") or survey.weight
        new_bmi = _calc_bmi(new_weight, new_height)
        update_data["bmi"] = new_bmi

        if data.waist is not None:
            update_data["waist"] = data.waist if data.waist > 0 else _estimate_waist(survey.gender, new_bmi)
        elif survey.waist == 0:
            update_data["waist"] = _estimate_waist(survey.gender, new_bmi)

        updated = await self.repo.update(survey, update_data)

        try:
            new_score = await _calc_score_from_survey(updated)
            new_score = await self._apply_all_penalties(user.id, updated, new_score)
        except Exception:
            new_score = float(score_before)
        new_grade = _calc_grade(int(new_score))

        return SurveyUpdateResponse(
            detail="신체 정보가 수정됐습니다.",
            bmi=updated.bmi,
            score_before=score_before,
            new_score=new_score,
            new_grade=new_grade,
            score_change=new_score - score_before,
        )
