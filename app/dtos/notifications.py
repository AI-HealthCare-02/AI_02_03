from datetime import datetime, time
from pydantic import BaseModel
from app.dtos.base import BaseSerializerModel


class NotificationSettingResponse(BaseSerializerModel):
    id: int
    user_id: int
    challenge_notification: bool
    prediction_notification: bool
    goal_notification: bool
    notification_time: time | None
    night_mode_enabled: bool
    streak_reminder: bool
    risk_change_alert: bool
    goal_achievement: bool
    meal_reminder: bool
    water_reminder: bool
    alcohol_warning: bool
    immediate_risk_alert: bool
    challenge_fail_warning: bool
    updated_at: datetime


class NotificationSettingUpdateRequest(BaseModel):
    challenge_notification: bool | None = None
    prediction_notification: bool | None = None
    goal_notification: bool | None = None
    notification_time: time | None = None
    night_mode_enabled: bool | None = None
    streak_reminder: bool | None = None
    risk_change_alert: bool | None = None
    goal_achievement: bool | None = None
    meal_reminder: bool | None = None
    water_reminder: bool | None = None
    alcohol_warning: bool | None = None
    immediate_risk_alert: bool | None = None
    challenge_fail_warning: bool | None = None