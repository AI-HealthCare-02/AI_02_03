from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dtos.daily_health_logs import DailyHealthLogUpdateRequest, DailyHealthLogUpsertRequest
from app.models.daily_health_logs import DailyHealthLog
from app.repositories.daily_health_log_repository import DailyHealthLogRepository


class DailyHealthLogService:
    def __init__(self, session: AsyncSession):
        self.repo = DailyHealthLogRepository(session)

    async def upsert(self, user_id: int, data: DailyHealthLogUpsertRequest) -> DailyHealthLog:
        existing = await self.repo.get_by_user_and_date(user_id, data.log_date)
        if existing:
            update_data = data.model_dump(exclude={"log_date"}, exclude_none=False)
            return await self.repo.update(existing, update_data)

        create_data = data.model_dump()
        create_data["user_id"] = user_id
        return await self.repo.create(create_data)

    async def update(self, user_id: int, log_id: int, data: DailyHealthLogUpdateRequest) -> DailyHealthLog:
        log = await self._get_and_validate(user_id, log_id)
        return await self.repo.update(log, data.model_dump(exclude_none=True))

    async def get_by_month(self, user_id: int, year: int, month: int) -> list[DailyHealthLog]:
        return await self.repo.get_by_user_and_month(user_id, year, month)

    async def _get_and_validate(self, user_id: int, log_id: int) -> DailyHealthLog:
        result = await self.repo._session.get(DailyHealthLog, log_id)
        if not result or result.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="기록을 찾을 수 없습니다.")
        return result
