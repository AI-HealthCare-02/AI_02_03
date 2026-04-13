from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.databases import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(40), unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(128), nullable=False)
    nickname: Mapped[str] = mapped_column(String(20), nullable=False)
    is_onboarded: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now, nullable=False)

    health_survey = relationship("HealthSurvey", back_populates="user", cascade="all, delete-orphan", uselist=False)
    predictions = relationship("Prediction", back_populates="user", cascade="all, delete-orphan")
    medications = relationship("Medication", back_populates="user", cascade="all, delete-orphan")
    goals = relationship("Goal", back_populates="user", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="user", cascade="all, delete-orphan")
    notification_settings = relationship(
        "NotificationSetting", back_populates="user", cascade="all, delete-orphan", uselist=False
    )
    user_challenges = relationship("UserChallenge", back_populates="user", cascade="all, delete-orphan")
    daily_health_logs = relationship("DailyHealthLog", back_populates="user", cascade="all, delete-orphan")
    badges = relationship("UserBadge", back_populates="user", cascade="all, delete-orphan")
