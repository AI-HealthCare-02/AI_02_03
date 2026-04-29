from datetime import date, datetime

from sqlalchemy import BigInteger, Boolean, Date, DateTime, Float, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.databases import Base


class DailyHealthLog(Base):
    __tablename__ = "daily_health_logs"
    __table_args__ = (UniqueConstraint("user_id", "log_date", name="uq_user_log_date"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    log_date: Mapped[date] = mapped_column(Date, nullable=False)
    weight: Mapped[float | None] = mapped_column(Float, nullable=True)
    exercise_done: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    exercise_duration: Mapped[int | None] = mapped_column(Integer, nullable=True)  # 분
    alcohol_consumed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    alcohol_amount: Mapped[float | None] = mapped_column(Float, nullable=True)  # 잔 수
    smoking_done: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    smoking_amount: Mapped[int | None] = mapped_column(Integer, nullable=True)  # 개비 수
    sleep_hours: Mapped[float | None] = mapped_column(Float, nullable=True)
    waist: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.now, onupdate=datetime.now, nullable=False
    )

    user = relationship("User", back_populates="daily_health_logs")
