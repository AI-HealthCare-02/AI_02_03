from typing import Any

from pydantic import EmailStr
from sqlalchemy import exists, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.users import User


class UserRepository:
    def __init__(self, session: AsyncSession):
        self._session = session

    async def get_user(self, user_id: int) -> User | None:
        result = await self._session.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_user_by_email(self, email: str) -> User | None:
        result = await self._session.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def exists_by_email(self, email: str) -> bool:
        result = await self._session.execute(select(exists().where(User.email == email)))
        return bool(result.scalar())

    async def create_user(
        self,
        email: str | EmailStr,
        hashed_password: str,
        nickname: str,
    ) -> User:
        user = User(
            email=email,
            hashed_password=hashed_password,
            nickname=nickname,
        )
        self._session.add(user)
        await self._session.flush()
        await self._session.refresh(user)
        return user

    async def update_instance(self, user: User, data: dict[str, Any]) -> None:
        for key, value in data.items():
            if value is not None:
                setattr(user, key, value)
        await self._session.flush()
        await self._session.refresh(user)

    async def exists_by_nickname(self, nickname: str) -> bool:
        result = await self._session.execute(
            select(exists().where(User.nickname == nickname))
        )
        return bool(result.scalar())