from datetime import date, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.challenges import Challenge, ChallengeLog, UserChallenge


class ChallengeRepository:
    def __init__(self, session: AsyncSession):
        self._session = session

    async def get_all(self) -> list[Challenge]:
        result = await self._session.execute(select(Challenge))
        return list(result.scalars().all())

    async def get_by_id(self, challenge_id: int) -> Challenge | None:
        result = await self._session.execute(
            select(Challenge).where(Challenge.id == challenge_id)
        )
        return result.scalar_one_or_none()


class UserChallengeRepository:
    def __init__(self, session: AsyncSession):
        self._session = session

    async def get_active_by_user_and_challenge(self, user_id: int, challenge_id: int) -> UserChallenge | None:
        result = await self._session.execute(
            select(UserChallenge).where(
                UserChallenge.user_id == user_id,
                UserChallenge.challenge_id == challenge_id,
                UserChallenge.status == "진행중",
            )
        )
        return result.scalar_one_or_none()

    async def get_by_id_and_user(self, user_challenge_id: int, user_id: int) -> UserChallenge | None:
        result = await self._session.execute(
            select(UserChallenge)
            .where(UserChallenge.id == user_challenge_id, UserChallenge.user_id == user_id)
            .options(selectinload(UserChallenge.challenge), selectinload(UserChallenge.logs))
        )
        return result.scalar_one_or_none()

    async def get_by_user_id(self, user_id: int, status: str | None = None) -> list[UserChallenge]:
        q = select(UserChallenge).where(UserChallenge.user_id == user_id).options(
            selectinload(UserChallenge.challenge)
        )
        if status:
            q = q.where(UserChallenge.status == status)
        result = await self._session.execute(q.order_by(UserChallenge.joined_at.desc()))
        return list(result.scalars().all())

    async def create(self, user_id: int, challenge_id: int) -> UserChallenge:
        uc = UserChallenge(user_id=user_id, challenge_id=challenge_id)
        self._session.add(uc)
        await self._session.flush()
        await self._session.refresh(uc)
        return uc

    async def update(self, uc: UserChallenge, data: dict) -> UserChallenge:
        for k, v in data.items():
            setattr(uc, k, v)
        await self._session.flush()
        await self._session.refresh(uc)
        return uc


class ChallengeLogRepository:
    def __init__(self, session: AsyncSession):
        self._session = session

    async def get_today_log(self, user_challenge_id: int) -> ChallengeLog | None:
        today = date.today()
        result = await self._session.execute(
            select(ChallengeLog).where(
                ChallengeLog.user_challenge_id == user_challenge_id,
                ChallengeLog.log_date == today,
            )
        )
        return result.scalar_one_or_none()

    async def create(self, user_challenge_id: int, is_completed: bool) -> ChallengeLog:
        log = ChallengeLog(
            user_challenge_id=user_challenge_id,
            log_date=date.today(),
            is_completed=is_completed,
        )
        self._session.add(log)
        await self._session.flush()
        await self._session.refresh(log)
        return log

    async def count_completed(self, user_challenge_id: int) -> int:
        result = await self._session.execute(
            select(ChallengeLog).where(
                ChallengeLog.user_challenge_id == user_challenge_id,
                ChallengeLog.is_completed == True,
            )
        )
        return len(result.scalars().all())
