from datetime import date, datetime
from pydantic import BaseModel, Field, field_validator
from app.dtos.base import BaseSerializerModel

class DailyHealthLogUpsertRequest(BaseModel):
    log_date: date
    weight: float | None = Field(None, ge=10, le=500)        # 10~500kg
    exercise_done: bool = False
    exercise_duration: int | None = Field(None, ge=0, le=1440)  # 0~1440분
    alcohol_consumed: bool = False
    alcohol_amount: float | None = Field(None, ge=0, le=100)    # 0~100잔
    smoking_done: bool = False
    smoking_amount: int | None = Field(None, ge=0, le=200)      # 0~200개비

class DailyHealthLogUpdateRequest(BaseModel):
    weight: float | None = Field(None, ge=10, le=500)
    exercise_done: bool | None = None
    exercise_duration: int | None = Field(None, ge=0, le=1440)
    alcohol_consumed: bool | None = None
    alcohol_amount: float | None = Field(None, ge=0, le=100)
    smoking_done: bool | None = None
    smoking_amount: int | None = Field(None, ge=0, le=200)

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