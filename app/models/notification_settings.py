from datetime import datetime, time

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.databases import Base


class NotificationSetting(Base):
    __tablename__ = "notification_settings"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )

    # 기존 필드
    challenge_notification: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    prediction_notification: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    goal_notification: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # 새로 추가 필드
    appointment_reminder: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    notification_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    night_mode_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    streak_reminder: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    risk_change_alert: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    goal_achievement: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    meal_reminder: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    water_reminder: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    alcohol_warning: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    immediate_risk_alert: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    challenge_fail_warning: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.now, onupdate=datetime.now, nullable=False
    )
    user = relationship("User", back_populates="notification_settings")
