from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.challenges import UserChallenge
from app.models.predictions import Prediction


class ActivityRepository:
    def __init__(self, session: AsyncSession):
        self._session = session

    async def get_predictions_by_user(self, user_id: int, limit: int = 20) -> list[Prediction]:
        result = await self._session.execute(
            select(Prediction).where(Prediction.user_id == user_id).order_by(Prediction.created_at.desc()).limit(limit)
        )
        return list(result.scalars().all())

    async def get_challenges_by_user(self, user_id: int) -> list[UserChallenge]:
        result = await self._session.execute(
            select(UserChallenge)
            .where(UserChallenge.user_id == user_id)
            .options(selectinload(UserChallenge.challenge))
            .order_by(UserChallenge.joined_at.desc())
        )
        return list(result.scalars().all())
