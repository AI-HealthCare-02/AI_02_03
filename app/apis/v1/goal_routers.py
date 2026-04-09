from typing import Annotated

from fastapi import APIRouter, Depends, status
from fastapi.responses import ORJSONResponse as Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.databases import get_db
from app.dependencies.security import get_request_user
from app.dtos.goals import GoalCreateRequest, GoalResponse, GoalUpdateRequest
from app.models.users import User
from app.services.goals import GoalService

goal_router = APIRouter(prefix="/goals", tags=["goals"])


def get_goal_service(db: Annotated[AsyncSession, Depends(get_db)]) -> GoalService:
    return GoalService(db)


@goal_router.post("", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
async def create_goal(
    request: GoalCreateRequest,
    user: Annotated[User, Depends(get_request_user)],
    goal_service: Annotated[GoalService, Depends(get_goal_service)],
) -> Response:
    goal = await goal_service.create_goal(user.id, request)
    return Response(GoalResponse.model_validate(goal).model_dump(), status_code=status.HTTP_201_CREATED)


# GET /goals/me 로 변경
@goal_router.get("/me", response_model=list[GoalResponse], status_code=status.HTTP_200_OK)
async def get_my_goals(
    user: Annotated[User, Depends(get_request_user)],
    goal_service: Annotated[GoalService, Depends(get_goal_service)],
) -> Response:
    goals = await goal_service.get_goals(user.id)
    return Response([GoalResponse.model_validate(g).model_dump() for g in goals], status_code=status.HTTP_200_OK)


# PUT 응답을 {"detail": str} 로 변경
@goal_router.put("/{goal_id}", status_code=status.HTTP_200_OK)
async def update_goal(
    goal_id: int,
    request: GoalUpdateRequest,
    user: Annotated[User, Depends(get_request_user)],
    goal_service: Annotated[GoalService, Depends(get_goal_service)],
) -> Response:
    await goal_service.update_goal(goal_id, user.id, request)
    return Response({"detail": "목표가 수정되었습니다."}, status_code=status.HTTP_200_OK)


# DELETE 200 + {"detail": str} 로 변경
@goal_router.delete("/{goal_id}", status_code=status.HTTP_200_OK)
async def delete_goal(
    goal_id: int,
    user: Annotated[User, Depends(get_request_user)],
    goal_service: Annotated[GoalService, Depends(get_goal_service)],
) -> Response:
    await goal_service.delete_goal(goal_id, user.id)
    return Response({"detail": "목표가 삭제되었습니다."}, status_code=status.HTTP_200_OK)
