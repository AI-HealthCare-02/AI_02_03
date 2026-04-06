from datetime import datetime
from pydantic import BaseModel
from app.dtos.base import BaseSerializerModel


class NotificationSettingResponse(BaseSerializerModel):
    id: int
    user_id: int
    challenge_notification: bool
    prediction_notification: bool
    goal_notification: bool
    updated_at: datetime


class NotificationSettingUpdateRequest(BaseModel):
    challenge_notification: bool | None = None
    prediction_notification: bool | None = None
    goal_notification: bool | None = None