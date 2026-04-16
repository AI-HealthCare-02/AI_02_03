import secrets
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

    async def exists_by_nickname(self, nickname: str) -> bool:
        result = await self._session.execute(select(exists().where(User.nickname == nickname)))
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

    async def get_by_social(self, provider: str, social_id: str) -> User | None:
        result = await self._session.execute(
            select(User).where(User.social_provider == provider, User.social_id == social_id)
        )
        return result.scalar_one_or_none()

    async def create_social_user(
        self,
        provider: str,
        social_id: str,
        nickname: str,
        email: str | None = None,
    ) -> User:
        user = User(
            email=email,
            hashed_password=secrets.token_hex(32),  # 소셜 로그인 전용 플레이스홀더
            nickname=nickname,
            social_provider=provider,
            social_id=social_id,
        )
        self._session.add(user)
        await self._session.flush()
        await self._session.refresh(user)
        return user

    async def delete_user(self, user: User) -> None:
        await self._session.delete(user)
        await self._session.flush()
