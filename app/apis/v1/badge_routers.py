from typing import Annotated

from fastapi import APIRouter, Depends, status
from fastapi.responses import ORJSONResponse as Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.databases import get_db
from app.dependencies.security import get_request_user
from app.models.users import User
from app.services.badges import BadgeService

badge_router = APIRouter(prefix="/badges", tags=["badges"])


def get_badge_service(db: Annotated[AsyncSession, Depends(get_db)]) -> BadgeService:
    return BadgeService(db)


@badge_router.get("/me", status_code=status.HTTP_200_OK)
async def get_my_badges(
    user: Annotated[User, Depends(get_request_user)],
    service: Annotated[BadgeService, Depends(get_badge_service)],
) -> Response:
    result = await service.get_my_badges(user.id)
    return Response(result, status_code=status.HTTP_200_OK)


@badge_router.get("/me/count", status_code=status.HTTP_200_OK)
async def get_my_badge_count(
    user: Annotated[User, Depends(get_request_user)],
    service: Annotated[BadgeService, Depends(get_badge_service)],
) -> Response:
    count = await service.get_earned_count(user.id)
    return Response({"earned_count": count}, status_code=status.HTTP_200_OK)
