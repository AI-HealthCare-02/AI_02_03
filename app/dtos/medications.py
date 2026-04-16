from datetime import date, datetime

from pydantic import BaseModel, Field

from app.dtos.base import BaseSerializerModel


class MedicationCreateRequest(BaseModel):
    name: str = Field(max_length=100)
    dosage: str = Field(max_length=50)
    times: list[str] = Field(description="복용 시간 목록, 예: ['08:00', '18:00']")


class MedicationResponse(BaseSerializerModel):
    id: int
    user_id: int
    name: str
    dosage: str
    times: list[str]
    created_at: datetime


class MedicationCompletionRequest(BaseModel):
    date: date
    time_index: int
    completed: bool


class MedicationCompletionsByDate(BaseModel):
    date: date
    completions: dict[int, bool]
