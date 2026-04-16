from datetime import date, datetime

from sqlalchemy import BigInteger, Boolean, Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.databases import Base


class Challenge(Base):
    __tablename__ = "challenges"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    type: Mapped[str] = mapped_column(String(20), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    duration_days: Mapped[int] = mapped_column(Integer, nullable=False)
    required_logs: Mapped[int] = mapped_column(Integer, nullable=False)

    is_custom: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_by: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=True
    )

    user_challenges: Mapped[list["UserChallenge"]] = relationship(back_populates="challenge")


class UserChallenge(Base):
    __tablename__ = "user_challenges"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False)
    challenge_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("challenges.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(10), default="진행중", nullable=False)
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now, nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_maintenance: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    last_checkin_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    challenge: Mapped["Challenge"] = relationship(back_populates="user_challenges")
    logs: Mapped[list["ChallengeLog"]] = relationship(back_populates="user_challenge")
    user = relationship("User", back_populates="user_challenges")


class ChallengeLog(Base):
    __tablename__ = "challenge_logs"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_challenge_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("user_challenges.id"), nullable=False)
    log_date: Mapped[date] = mapped_column(Date, nullable=False)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now, nullable=False)

    user_challenge: Mapped["UserChallenge"] = relationship(back_populates="logs")
