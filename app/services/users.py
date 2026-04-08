from sqlalchemy.ext.asyncio import AsyncSession

from app.dtos.users import UserUpdateRequest
from app.models.users import User
from app.repositories.user_repository import UserRepository
from app.services.auth import AuthService


class UserManageService:
    def __init__(self, session: AsyncSession):
        self._session = session
        self.repo = UserRepository(session)
        self.auth_service = AuthService(session)

    async def update_user(self, user: User, data: UserUpdateRequest) -> User:
        if data.email:
            await self.auth_service.check_email_exists(data.email)
        await self.repo.update_instance(user=user, data=data.model_dump(exclude_none=True))
        return user

    async def delete_user(self, user: User) -> None:
        await self.repo.delete_user(user)

    async def complete_onboarding(self, user: User) -> None:
        await self.repo.update_instance(user=user, data={"is_onboarded": True})
