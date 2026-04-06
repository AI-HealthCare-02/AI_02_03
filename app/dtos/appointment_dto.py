from datetime import datetime

from pydantic import BaseModel

from app.dtos.base import BaseSerializerModel


class AppointmentCreateRequest(BaseModel):
    hospital_name: str
    visit_date: datetime
    memo: str | None = None


class AppointmentResponse(BaseSerializerModel):
    id: int
    user_id: int
    hospital_name: str
    visit_date: datetime
    memo: str | None
    is_notified: bool
    created_at: datetime
