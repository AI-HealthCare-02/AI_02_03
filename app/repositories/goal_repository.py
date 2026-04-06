from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.goals import Goal


class GoalRepository:
    def __init__(self, session: AsyncSession):
        self._session = session

    async def create_goal(self, user_id: int, category: str, description: str | None) -> Goal:
        goal = Goal(user_id=user_id, category=category, description=description)
        self._session.add(goal)
        await self._session.flush()
        await self._session.refresh(goal)
        return goal

    async def get_goals_by_user(self, user_id: int) -> list[Goal]:
        result = await self._session.execute(
            select(Goal).where(Goal.user_id == user_id).order_by(Goal.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_goal(self, goal_id: int, user_id: int) -> Goal | None:
        result = await self._session.execute(
            select(Goal).where(Goal.id == goal_id, Goal.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def update_goal(self, goal: Goal, data: dict) -> Goal:
        for key, value in data.items():
            if value is not None:
                setattr(goal, key, value)
        await self._session.flush()
        await self._session.refresh(goal)
        return goal

    async def delete_goal(self, goal: Goal) -> None:
        await self._session.delete(goal)
        await self._session.flush()