from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification_settings import NotificationSetting


class NotificationRepository:
    def __init__(self, session: AsyncSession):
        self._session = session

    async def get_by_user(self, user_id: int) -> NotificationSetting | None:
        result = await self._session.execute(select(NotificationSetting).where(NotificationSetting.user_id == user_id))
        return result.scalar_one_or_none()

    async def create_default(self, user_id: int) -> NotificationSetting:
        setting = NotificationSetting(user_id=user_id)
        self._session.add(setting)
        await self._session.flush()
        await self._session.refresh(setting)
        return setting

    async def update(self, setting: NotificationSetting, data: dict) -> NotificationSetting:
        for key, value in data.items():
            if value is not None:
                setattr(setting, key, value)
        await self._session.flush()
        await self._session.refresh(setting)
        return setting
