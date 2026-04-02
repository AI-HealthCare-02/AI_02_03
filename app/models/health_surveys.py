from datetime import datetime

from sqlalchemy import BigInteger, DateTime, Float, Integer, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.databases import Base


class HealthSurvey(Base):
    __tablename__ = "health_surveys"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), unique=True, nullable=False)

    age: Mapped[int] = mapped_column(Integer, nullable=False)
    gender: Mapped[str] = mapped_column(String(10), nullable=False)
    height: Mapped[float] = mapped_column(Float, nullable=False)
    weight: Mapped[float] = mapped_column(Float, nullable=False)
    bmi: Mapped[float] = mapped_column(Float, nullable=False)
    waist: Mapped[float] = mapped_column(Float, nullable=False)

    drinking: Mapped[str] = mapped_column(String(10), nullable=False)
    drink_amount: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    weekly_drink_freq: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    monthly_binge_freq: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    exercise: Mapped[str] = mapped_column(String(10), nullable=False)
    weekly_exercise_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    smoking: Mapped[str] = mapped_column(String(20), nullable=False)
    current_smoking: Mapped[str] = mapped_column(String(10), default="안함", nullable=False)

    sleep_hours: Mapped[float] = mapped_column(Float, nullable=False)
    sleep_disorder: Mapped[str] = mapped_column(String(10), nullable=False)

    diet_score: Mapped[int] = mapped_column(Integer, nullable=False)
    diet_eval: Mapped[str] = mapped_column(String(20), nullable=False)

    diabetes: Mapped[str] = mapped_column(String(10), nullable=False)
    hypertension: Mapped[str] = mapped_column(String(10), nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now, nullable=False)
