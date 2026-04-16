from datetime import datetime

from pydantic import BaseModel, field_validator

from app.dtos.base import BaseSerializerModel


class NotificationSettingResponse(BaseSerializerModel):
    id: int
    user_id: int
    push_enabled: bool
    appointment_reminder: bool
    challenge_reminder: bool
    weekly_report: bool
    notification_time: str
    night_mode_enabled: bool
    daily_action_reminder: bool
    streak_reminder: bool
    risk_change_alert: bool
    goal_achievement_alert: bool
    meal_reminder: bool
    water_reminder: bool
    alcohol_warning: bool
    immediate_risk_alert: bool
    challenge_fail_warning: bool
    updated_at: datetime


class NotificationSettingUpdateRequest(BaseModel):
    push_enabled: bool | None = None
    appointment_reminder: bool | None = None
    challenge_reminder: bool | None = None
    weekly_report: bool | None = None
    notification_time: str | None = None
    night_mode_enabled: bool | None = None
    daily_action_reminder: bool | None = None
    streak_reminder: bool | None = None
    risk_change_alert: bool | None = None
    goal_achievement_alert: bool | None = None
    meal_reminder: bool | None = None
    water_reminder: bool | None = None
    alcohol_warning: bool | None = None
    immediate_risk_alert: bool | None = None
    challenge_fail_warning: bool | None = None

    @field_validator("notification_time")
    @classmethod
    def validate_time_format(cls, v: str | None) -> str | None:
        if v is None:
            return v
        parts = v.split(":")
        if len(parts) != 2 or not parts[0].isdigit() or not parts[1].isdigit():
            raise ValueError("HH:MM 형식이어야 합니다")
        return v
