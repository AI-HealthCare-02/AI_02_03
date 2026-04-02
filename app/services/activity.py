from sqlalchemy.ext.asyncio import AsyncSession
from app.models.activity_logs import ActivityLog
from app.repositories.activity_repository import ActivityRepository


class ActivityService:
    def __init__(self, session: AsyncSession):
        self.activity_repo = ActivityRepository(session)

    async def get_my_activity(self, user_id: int, limit: int = 20) -> list[ActivityLog]:
        return await self.activity_repo.get_logs_by_user(user_id, limit)

    async def log_activity(self, user_id: int, activity_type: str, description: str | None = None) -> ActivityLog:
        return await self.activity_repo.create_log(user_id, activity_type, description)