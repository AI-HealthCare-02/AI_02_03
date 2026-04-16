from collections import defaultdict
from datetime import date, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.challenges import Challenge, ChallengeLog, UserChallenge


class ChallengeRepository:
    def __init__(self, session: AsyncSession):
        self._session = session

    async def get_all_visible(self, user_id: int) -> list[Challenge]:
        """표준 챌린지 + 해당 유저가 만든 커스텀 챌린지"""
        result = await self._session.execute(
            select(Challenge).where(
                (Challenge.is_custom == False) | (Challenge.created_by == user_id)  # noqa: E712
            )
        )
        return list(result.scalars().all())

    async def get_all(self) -> list[Challenge]:
        result = await self._session.execute(select(Challenge))
        return list(result.scalars().all())

    async def get_by_id(self, challenge_id: int) -> Challenge | None:
        result = await self._session.execute(select(Challenge).where(Challenge.id == challenge_id))
        return result.scalar_one_or_none()

    async def get_participant_counts(self, challenge_ids: list[int]) -> dict[int, int]:
        """챌린지별 진행중 참여자 수 일괄 조회"""
        if not challenge_ids:
            return {}
        result = await self._session.execute(
            select(UserChallenge.challenge_id, func.count(UserChallenge.id))
            .where(
                UserChallenge.challenge_id.in_(challenge_ids),
                UserChallenge.status == "진행중",
            )
            .group_by(UserChallenge.challenge_id)
        )
        return {row[0]: row[1] for row in result.all()}

    async def delete_custom(self, challenge_id: int, user_id: int) -> bool:
        """본인이 만든 커스텀 챌린지 삭제"""
        from sqlalchemy import delete as sql_delete
        # FK 제약 때문에 user_challenges 먼저 삭제
        await self._session.execute(
            sql_delete(UserChallenge).where(UserChallenge.challenge_id == challenge_id)
        )
        result = await self._session.execute(
            sql_delete(Challenge).where(
                Challenge.id == challenge_id,
                Challenge.is_custom == True,
                Challenge.created_by == user_id,
            )
        )
        await self._session.commit()
        return result.rowcount > 0

    async def create_custom(self, user_id: int, title: str, description: str, category: str, duration_days: int) -> "Challenge":
        challenge = Challenge(
            type=category,
            name=title,
            description=description,
            duration_days=duration_days,
            required_logs=duration_days,
            is_custom=True,
            created_by=user_id,
        )
        self._session.add(challenge)
        await self._session.flush()
        await self._session.refresh(challenge)
        return challenge


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
        q = select(UserChallenge).where(UserChallenge.user_id == user_id).options(selectinload(UserChallenge.challenge))
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

    async def get_maintenance_by_user(self, user_id: int, challenge_type: str) -> UserChallenge | None:
        """유지 모드 중인 특정 타입 챌린지 조회"""
        result = await self._session.execute(
            select(UserChallenge)
            .join(Challenge)
            .where(
                UserChallenge.user_id == user_id,
                UserChallenge.is_maintenance.is_(True),
                Challenge.type == challenge_type,
            )
            .options(selectinload(UserChallenge.challenge))
        )
        return result.scalar_one_or_none()

    async def get_expired_maintenances(self, cutoff: datetime) -> list[UserChallenge]:
        """체크인 기한이 지난 유지 모드 챌린지 목록 (2주 미응답 감지용)"""
        result = await self._session.execute(
            select(UserChallenge).where(
                UserChallenge.is_maintenance.is_(True),
                UserChallenge.last_checkin_at < cutoff,
            )
        )
        return list(result.scalars().all())


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
        return result.scalars().first()

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
                ChallengeLog.is_completed.is_(True),
            )
        )
        return len(result.scalars().all())

    async def get_consecutive_days(self, user_challenge_id: int) -> int:
        """오늘 기준 연속 완료 일수 계산 (뒤에서부터 끊기는 시점까지)"""
        result = await self._session.execute(
            select(ChallengeLog.log_date)
            .where(
                ChallengeLog.user_challenge_id == user_challenge_id,
                ChallengeLog.is_completed.is_(True),
            )
            .order_by(ChallengeLog.log_date.desc())
        )
        dates = [row[0] for row in result.all()]
        if not dates:
            return 0

        consecutive = 0
        expected = date.today()
        for d in dates:
            if d == expected:
                consecutive += 1
                expected -= timedelta(days=1)
            elif d < expected:
                break
        return consecutive

    async def get_streak_days(self, active_uc_ids: list[int]) -> int:
        """진행중 챌린지 전부를 매일 완료한 연속 일수"""
        if not active_uc_ids:
            return 0

        result = await self._session.execute(
            select(ChallengeLog.log_date, ChallengeLog.user_challenge_id).where(
                ChallengeLog.user_challenge_id.in_(active_uc_ids),
                ChallengeLog.is_completed.is_(True),
            )
        )
        by_date: dict[date, set[int]] = defaultdict(set)
        for log_date, uc_id in result.all():
            by_date[log_date].add(uc_id)

        active_set = set(active_uc_ids)
        consecutive = 0
        expected = date.today()
        while True:
            if expected not in by_date or not active_set.issubset(by_date[expected]):
                break
            consecutive += 1
            expected -= timedelta(days=1)
        return consecutive

    async def get_weekly_rate(self, active_uc_ids: list[int]) -> float:
        """이번 주 달성률: 완료 로그 수 / (진행중 챌린지 수 × 7) × 100"""
        if not active_uc_ids:
            return 0.0

        today = date.today()
        week_start = today - timedelta(days=today.weekday())  # 이번 주 월요일

        result = await self._session.execute(
            select(func.count(ChallengeLog.id)).where(
                ChallengeLog.user_challenge_id.in_(active_uc_ids),
                ChallengeLog.is_completed.is_(True),
                ChallengeLog.log_date >= week_start,
                ChallengeLog.log_date <= today,
            )
        )
        completed = result.scalar() or 0
        total_expected = len(active_uc_ids) * 7
        return round(completed / total_expected * 100, 1)
