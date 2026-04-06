from datetime import datetime

from pydantic import BaseModel, Field

from app.dtos.base import BaseSerializerModel
from app.models.appointment import AppointmentStatus


class AppointmentCreateRequest(BaseModel):
    title: str = Field(max_length=100)
    doctor_name: str | None = Field(default=None, max_length=50)
    location: str | None = Field(default=None, max_length=200)
    scheduled_at: datetime
    notes: str | None = Field(default=None, max_length=500)


class AppointmentResponse(BaseSerializerModel):
    id: int
    user_id: int
    title: str
    doctor_name: str | None
    location: str | None
    scheduled_at: datetime
    notes: str | None
    status: AppointmentStatus
    created_at: datetime
    updated_at: datetime