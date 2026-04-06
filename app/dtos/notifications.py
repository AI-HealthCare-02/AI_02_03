from datetime import datetime

from pydantic import BaseModel

from app.dtos.base import BaseSerializerModel


class NotificationSettingResponse(BaseSerializerModel):
    id: int
    user_id: int
    push_enabled: bool
    appointment_reminder: bool
    challenge_reminder: bool
    weekly_report: bool
    updated_at: datetime


class NotificationSettingUpdateRequest(BaseModel):
    push_enabled: bool | None = None
    appointment_reminder: bool | None = None
    challenge_reminder: bool | None = None
    weekly_report: bool | None = None
