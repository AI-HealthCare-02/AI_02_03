from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.databases import Base


class UserBadge(Base):
    __tablename__ = "user_badges"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    badge_key: Mapped[str] = mapped_column(String(100), nullable=False)  # e.g. "first_step", "ai_generated_..."
    badge_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    badge_description: Mapped[str | None] = mapped_column(String(300), nullable=True)
    badge_emoji: Mapped[str | None] = mapped_column(String(10), nullable=True)
    earned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now, nullable=False)

    user = relationship("User", back_populates="badges")
