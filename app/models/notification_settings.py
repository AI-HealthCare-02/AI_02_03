from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.databases import Base


class NotificationSetting(Base):
    __tablename__ = "notification_settings"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    push_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    appointment_reminder: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    challenge_reminder: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    weekly_report: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    notification_time: Mapped[str] = mapped_column(String(5), default="09:00", nullable=False)
    night_mode_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    daily_action_reminder: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    streak_reminder: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    risk_change_alert: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    goal_achievement_alert: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    meal_reminder: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    water_reminder: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    alcohol_warning: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    immediate_risk_alert: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    challenge_fail_warning: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.now, onupdate=datetime.now, nullable=False
    )

    user = relationship("User", back_populates="notification_settings")
