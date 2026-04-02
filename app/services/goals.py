from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.dtos.goals import GoalCreateRequest, GoalUpdateRequest
from app.models.goals import Goal
from app.repositories.goal_repository import GoalRepository


class GoalService:
    def __init__(self, session: AsyncSession):
        self.goal_repo = GoalRepository(session)

    async def create_goal(self, user_id: int, data: GoalCreateRequest) -> Goal:
        return await self.goal_repo.create_goal(
            user_id=user_id,
            title=data.title,
            description=data.description,
        )

    async def get_goals(self, user_id: int) -> list[Goal]:
        return await self.goal_repo.get_goals_by_user(user_id)

    async def update_goal(self, goal_id: int, user_id: int, data: GoalUpdateRequest) -> Goal:
        goal = await self.goal_repo.get_goal(goal_id, user_id)
        if not goal:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="목표를 찾을 수 없습니다")
        return await self.goal_repo.update_goal(goal, data.model_dump(exclude_none=True))

    async def delete_goal(self, goal_id: int, user_id: int) -> None:
        goal = await self.goal_repo.get_goal(goal_id, user_id)
        if not goal:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="목표를 찾을 수 없습니다")
        await self.goal_repo.delete_goal(goal)