from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.databases import Base


class FoodLog(Base):
    __tablename__ = "food_logs"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    food_name: Mapped[str] = mapped_column(String(200), nullable=False)
    calories: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    fat: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    sugar: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    liver_impact: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    recommendation: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    rating: Mapped[str] = mapped_column(String(20), nullable=False, default="보통")
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    analyzed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now, nullable=False)

    user = relationship("User", back_populates="food_logs")
