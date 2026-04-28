from datetime import datetime, time

from pydantic import BaseModel

from app.dtos.base import BaseSerializerModel


class NotificationSettingResponse(BaseSerializerModel):
    id: int
    user_id: int
    challenge_notification: bool
    appointment_reminder: bool
    notification_time: time | None
    night_mode_enabled: bool
    streak_reminder: bool
    meal_reminder: bool
    challenge_fail_warning: bool
    updated_at: datetime


class NotificationSettingUpdateRequest(BaseModel):
    challenge_notification: bool | None = None
    appointment_reminder: bool | None = None
    notification_time: time | None = None
    night_mode_enabled: bool | None = None
    streak_reminder: bool | None = None
    meal_reminder: bool | None = None
    challenge_fail_warning: bool | None = None
