from datetime import datetime

from pydantic import BaseModel, Field, model_validator

from app.dtos.base import BaseSerializerModel


class SurveyCreateRequest(BaseModel):
    age: int = Field(..., ge=13, le=80)
    gender: str
    height: float
    weight: float
    waist: float

    drinking: str
    drink_amount: float = 0.0
    weekly_drink_freq: float = 0.0
    monthly_binge_freq: float = 0.0

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
            self.monthly_binge_freq = 0.0
        if self.exercise == "운동안함":
            self.weekly_exercise_count = 0
        return self


class SurveyCreateResponse(BaseModel):
    detail: str
    bmi: float


class SurveyUpdateRequest(BaseModel):
    age: int | None = Field(None, ge=13, le=80)
    height: float | None = None
    weight: float | None = None
    waist: float | None = None

    drinking: str | None = None
    drink_amount: float | None = None
    weekly_drink_freq: float | None = None
    monthly_binge_freq: float | None = None

    exercise: str | None = None
    weekly_exercise_count: int | None = None

    smoking: str | None = None
    current_smoking: str | None = None

    sleep_hours: float | None = None
    sleep_disorder: str | None = None

    diet_questions: list[int] | None = Field(None, min_length=7, max_length=7)

    diabetes: str | None = None
    hypertension: str | None = None


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
    diet_score: int
    diet_eval: str
    diabetes: str
    hypertension: str
    updated_at: datetime
