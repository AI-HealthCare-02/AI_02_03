from sqlalchemy.ext.asyncio import AsyncSession
from app.dtos.notifications import NotificationSettingUpdateRequest
from app.models.notification_settings import NotificationSetting
from app.repositories.notification_repository import NotificationRepository


class NotificationService:
    def __init__(self, session: AsyncSession):
        self.notification_repo = NotificationRepository(session)

    async def get_or_create_settings(self, user_id: int) -> NotificationSetting:
        setting = await self.notification_repo.get_by_user(user_id)
        if not setting:
            setting = await self.notification_repo.create_default(user_id)
        return setting

    async def update_settings(self, user_id: int, data: NotificationSettingUpdateRequest) -> NotificationSetting:
        setting = await self.get_or_create_settings(user_id)
        return await self.notification_repo.update(setting, data.model_dump(exclude_none=True))