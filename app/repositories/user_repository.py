from datetime import date, datetime
from typing import Any

from pydantic import EmailStr
from sqlalchemy import exists, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import config
from app.models.users import Gender, User


class UserRepository:
    def __init__(self, session: AsyncSession):
        self._session = session

    async def get_all(self) -> list[User]:
        result = await self._session.execute(select(User))
        return list(result.scalars().all())

    async def get_user(self, user_id: int) -> User | None:
        result = await self._session.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def create_user(
        self,
        email: str | EmailStr,
        hashed_password: str,
        name: str,
        phone_number: str,
        gender: Gender,
        birthday: date,
        *,
        is_active: bool = True,
        is_admin: bool = False,
    ) -> User:
        user = User(
            email=email,
            hashed_password=hashed_password,
            name=name,
            phone_number=phone_number,
            gender=gender,
            birthday=birthday,
            is_active=is_active,
            is_admin=is_admin,
        )
        self._session.add(user)
        await self._session.flush()
        await self._session.refresh(user)
        return user

    async def get_user_by_email(self, email: str) -> User | None:
        result = await self._session.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def exists_by_email(self, email: str) -> bool:
        result = await self._session.execute(select(exists().where(User.email == email)))
        return bool(result.scalar())

    async def exists_by_phone_number(self, phone_number: str) -> bool:
        result = await self._session.execute(select(exists().where(User.phone_number == phone_number)))
        return bool(result.scalar())

    async def update_last_login(self, user_id: int) -> None:
        await self._session.execute(
            update(User).where(User.id == user_id).values(last_login=datetime.now(config.TIMEZONE))
        )

    async def update_instance(self, user: User, data: dict[str, Any]) -> None:
        for key, value in data.items():
            if value is not None:
                setattr(user, key, value)
        user.updated_at = datetime.now(config.TIMEZONE)
        await self._session.flush()
        await self._session.refresh(user)
