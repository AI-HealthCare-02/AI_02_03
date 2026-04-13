from datetime import date

from sqlalchemy import extract, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.daily_health_logs import DailyHealthLog


class DailyHealthLogRepository:
    def __init__(self, session: AsyncSession):
        self._session = session

    async def get_by_user_and_date(self, user_id: int, log_date: date) -> DailyHealthLog | None:
        result = await self._session.execute(
            select(DailyHealthLog).where(
                DailyHealthLog.user_id == user_id,
                DailyHealthLog.log_date == log_date,
            )
        )
        return result.scalar_one_or_none()

    async def get_by_user_and_month(self, user_id: int, year: int, month: int) -> list[DailyHealthLog]:
        result = await self._session.execute(
            select(DailyHealthLog)
            .where(
                DailyHealthLog.user_id == user_id,
                extract("year", DailyHealthLog.log_date) == year,
                extract("month", DailyHealthLog.log_date) == month,
            )
            .order_by(DailyHealthLog.log_date.desc())
        )
        return list(result.scalars().all())

    async def get_all_by_user(self, user_id: int) -> list[DailyHealthLog]:
        result = await self._session.execute(
            select(DailyHealthLog)
            .where(DailyHealthLog.user_id == user_id)
            .order_by(DailyHealthLog.log_date.desc())
        )
        return list(result.scalars().all())

    async def create(self, data: dict) -> DailyHealthLog:
        log = DailyHealthLog(**data)
        self._session.add(log)
        await self._session.flush()
        await self._session.refresh(log)
        return log

    async def update(self, log: DailyHealthLog, data: dict) -> DailyHealthLog:
        for key, value in data.items():
            if value is not None:
                setattr(log, key, value)
        await self._session.flush()
        await self._session.refresh(log)
        return log
