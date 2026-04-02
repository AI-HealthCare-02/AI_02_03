from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.activity_logs import ActivityLog


class ActivityRepository:
    def __init__(self, session: AsyncSession):
        self._session = session

    async def create_log(self, user_id: int, activity_type: str, description: str | None = None) -> ActivityLog:
        log = ActivityLog(user_id=user_id, activity_type=activity_type, description=description)
        self._session.add(log)
        await self._session.flush()
        await self._session.refresh(log)
        return log

    async def get_logs_by_user(self, user_id: int, limit: int = 20) -> list[ActivityLog]:
        result = await self._session.execute(
            select(ActivityLog)
            .where(ActivityLog.user_id == user_id)
            .order_by(ActivityLog.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())