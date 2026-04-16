from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dtos.reminders import ReminderCreateRequest
from app.models.reminders import Reminder
from app.repositories.reminder_repository import ReminderRepository


class ReminderService:
    def __init__(self, session: AsyncSession):
        self.repo = ReminderRepository(session)

    async def get_my_reminders(self, user_id: int) -> list[Reminder]:
        return await self.repo.get_all_by_user(user_id)

    async def create_reminder(self, user_id: int, data: ReminderCreateRequest) -> Reminder:
        return await self.repo.create(
            user_id=user_id,
            type=data.type,
            title=data.title,
            remind_at=data.remind_at,
        )

    async def toggle_reminder(self, reminder_id: int, user_id: int, enabled: bool) -> Reminder:
        reminder = await self.repo.get_by_id(reminder_id, user_id)
        if not reminder:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="알림을 찾을 수 없습니다")
        return await self.repo.update_enabled(reminder, enabled)

    async def delete_reminder(self, reminder_id: int, user_id: int) -> None:
        reminder = await self.repo.get_by_id(reminder_id, user_id)
        if not reminder:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="알림을 찾을 수 없습니다")
        await self.repo.delete(reminder)
