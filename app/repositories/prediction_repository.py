from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.predictions import Prediction


class PredictionRepository:
    def __init__(self, session: AsyncSession):
        self._session = session

    async def create(self, data: dict) -> Prediction:
        prediction = Prediction(**data)
        self._session.add(prediction)
        await self._session.flush()
        await self._session.refresh(prediction)
        return prediction

    async def get_by_user_id(self, user_id: int) -> list[Prediction]:
        result = await self._session.execute(
            select(Prediction)
            .where(Prediction.user_id == user_id)
            .order_by(Prediction.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_latest_by_user_id(self, user_id: int) -> Prediction | None:
        result = await self._session.execute(
            select(Prediction)
            .where(Prediction.user_id == user_id)
            .order_by(Prediction.created_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()
