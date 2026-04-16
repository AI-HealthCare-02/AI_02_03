from datetime import date, datetime

from pydantic import BaseModel

from app.dtos.base import BaseSerializerModel


class DailyHealthLogUpsertRequest(BaseModel):
    log_date: date
    weight: float | None = None
    exercise_done: bool = False
    exercise_duration: int | None = None  # 분
    alcohol_consumed: bool = False
    alcohol_amount: float | None = None  # 잔 수
    smoking_done: bool = False
    smoking_amount: int | None = None  # 개비 수


class DailyHealthLogUpdateRequest(BaseModel):
    weight: float | None = None
    exercise_done: bool | None = None
    exercise_duration: int | None = None
    alcohol_consumed: bool | None = None
    alcohol_amount: float | None = None
    smoking_done: bool | None = None
    smoking_amount: int | None = None


class DailyHealthLogResponse(BaseSerializerModel):
    id: int
    log_date: date
    weight: float | None
    exercise_done: bool
    exercise_duration: int | None
    alcohol_consumed: bool
    alcohol_amount: float | None
    smoking_done: bool
    smoking_amount: int | None
    created_at: datetime
    updated_at: datetime
