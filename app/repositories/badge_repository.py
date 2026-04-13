from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.badges import UserBadge


class BadgeRepository:
    def __init__(self, session: AsyncSession):
        self._session = session

    async def get_by_user(self, user_id: int) -> list[UserBadge]:
        result = await self._session.execute(
            select(UserBadge).where(UserBadge.user_id == user_id).order_by(UserBadge.earned_at.asc())
        )
        return list(result.scalars().all())

    async def exists(self, user_id: int, badge_key: str) -> bool:
        result = await self._session.execute(
            select(UserBadge).where(UserBadge.user_id == user_id, UserBadge.badge_key == badge_key)
        )
        return result.scalar_one_or_none() is not None

    async def grant(self, user_id: int, badge_key: str) -> UserBadge:
        badge = UserBadge(user_id=user_id, badge_key=badge_key)
        self._session.add(badge)
        await self._session.flush()
        await self._session.refresh(badge)
        return badge

    async def count_earned(self, user_id: int) -> int:
        result = await self._session.execute(
            select(UserBadge).where(UserBadge.user_id == user_id)
        )
        return len(result.scalars().all())
