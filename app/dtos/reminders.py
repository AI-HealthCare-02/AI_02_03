from datetime import datetime

from pydantic import BaseModel, Field

from app.dtos.base import BaseSerializerModel


class ReminderCreateRequest(BaseModel):
    type: str = Field(description="appointment | medication")
    title: str = Field(max_length=200)
    remind_at: str = Field(max_length=50, description="표시용 문자열, 예: '2026-04-20 14:00'")


class ReminderToggleRequest(BaseModel):
    enabled: bool


class ReminderResponse(BaseSerializerModel):
    id: int
    type: str
    title: str
    remind_at: str
    enabled: bool
    created_at: datetime
