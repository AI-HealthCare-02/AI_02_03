from datetime import datetime

from pydantic import BaseModel, Field, model_validator

from app.dtos.base import BaseSerializerModel


class SurveyCreateRequest(BaseModel):
    age: int = Field(..., ge=13, le=80)
    gender: str
    height: float = Field(..., gt=0)
    weight: float = Field(..., gt=0)
    waist: float = Field(default=0.0, ge=0)

    drinking: str
    drink_amount: float = 0.0
    drink_type: str | None = None  # 맥주/소주/와인/막걸리/칵테일
    weekly_drink_freq: float = 0.0

    exercise: str
    weekly_exercise_count: int = 0

    smoking: str
    current_smoking: str = "안함"

    sleep_hours: float
    sleep_disorder: str

    diet_questions: list[int] = Field(..., min_length=7, max_length=7)

    diabetes: str
    hypertension: str

    @model_validator(mode="after")
    def validate_drinking(self) -> "SurveyCreateRequest":
        if self.drinking == "음주안함":
            self.drink_amount = 0.0
            self.weekly_drink_freq = 0.0
        else:
            if self.drink_amount <= 0:
                raise ValueError("음주를 하는 경우 1회 음주량은 0보다 커야 합니다.")
            if self.weekly_drink_freq <= 0:
                raise ValueError("음주를 하는 경우 주당 음주 횟수는 0보다 커야 합니다.")
        if self.exercise == "운동안함":
            self.weekly_exercise_count = 0
        return self


class SurveyCreateResponse(BaseModel):
    detail: str
    bmi: float


class SurveyUpdateRequest(BaseModel):
    """사용자가 직접 수정 가능한 신체 측정값만 허용"""

    height: float | None = Field(None, gt=100, lt=250)
    weight: float | None = Field(None, gt=20, lt=300)
    waist: float | None = Field(None, gt=40, lt=200)


class SurveyUpdateResponse(BaseModel):
    detail: str
    bmi: float
    score_before: int
    new_score: int
    new_grade: str
    score_change: int


class SurveyInfoResponse(BaseSerializerModel):
    age: int
    gender: str
    height: float
    weight: float
    bmi: float
    waist: float
    drinking: str
    drink_amount: float
    weekly_drink_freq: float
    monthly_binge_freq: float
    exercise: str
    weekly_exercise_count: int
    smoking: str
    current_smoking: str
    sleep_hours: float
    sleep_disorder: str
    diet_q1: int
    diet_q2: int
    diet_q3: int
    diet_q4: int
    diet_q5: int
    diet_q6: int
    diet_q7: int
    diet_score: int
    diet_eval: str
    diabetes: str
    hypertension: str
    updated_at: datetime
