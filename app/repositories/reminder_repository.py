from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.reminders import Reminder


class ReminderRepository:
    def __init__(self, session: AsyncSession):
        self._session = session

    async def get_all_by_user(self, user_id: int) -> list[Reminder]:
        result = await self._session.execute(
            select(Reminder).where(Reminder.user_id == user_id).order_by(Reminder.created_at.asc())
        )
        return list(result.scalars().all())

    async def get_by_id(self, reminder_id: int, user_id: int) -> Reminder | None:
        result = await self._session.execute(
            select(Reminder).where(Reminder.id == reminder_id, Reminder.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def create(self, user_id: int, type: str, title: str, remind_at: str) -> Reminder:
        reminder = Reminder(user_id=user_id, type=type, title=title, remind_at=remind_at)
        self._session.add(reminder)
        await self._session.flush()
        await self._session.refresh(reminder)
        return reminder

    async def update_enabled(self, reminder: Reminder, enabled: bool) -> Reminder:
        reminder.enabled = enabled
        await self._session.flush()
        await self._session.refresh(reminder)
        return reminder

    async def delete(self, reminder: Reminder) -> None:
        await self._session.delete(reminder)
        await self._session.flush()
