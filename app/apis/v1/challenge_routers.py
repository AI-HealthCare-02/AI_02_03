from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import ORJSONResponse as Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.databases import get_db
from app.dependencies.security import get_request_user
from app.dtos.challenges import ChallengeLogRequest, CustomChallengeCreateRequest, MaintenanceCheckinRequest
from app.models.users import User
from app.services.challenges import ChallengeService

challenge_router = APIRouter(tags=["challenges"])


def get_challenge_service(db: Annotated[AsyncSession, Depends(get_db)]) -> ChallengeService:
    return ChallengeService(db)


@challenge_router.get("/challenges", status_code=status.HTTP_200_OK)
async def get_challenges(
    user: Annotated[User, Depends(get_request_user)],
    service: Annotated[ChallengeService, Depends(get_challenge_service)],
) -> Response:
    result = await service.get_challenges(user)
    return Response([r.model_dump() for r in result], status_code=status.HTTP_200_OK)


@challenge_router.delete("/challenges/{challenge_id}/custom", status_code=status.HTTP_200_OK)
async def delete_custom_challenge(
    challenge_id: int,
    user: Annotated[User, Depends(get_request_user)],
    service: Annotated[ChallengeService, Depends(get_challenge_service)],
) -> Response:
    result = await service.delete_custom_challenge(user, challenge_id)
    return Response(result, status_code=status.HTTP_200_OK)


@challenge_router.post("/challenges/custom", status_code=status.HTTP_201_CREATED)
async def create_custom_challenge(
    body: CustomChallengeCreateRequest,
    user: Annotated[User, Depends(get_request_user)],
    service: Annotated[ChallengeService, Depends(get_challenge_service)],
) -> Response:
    result = await service.create_custom_challenge(user, body)
    return Response(result.model_dump(), status_code=status.HTTP_201_CREATED)


@challenge_router.post("/challenges/{challenge_id}/join", status_code=status.HTTP_201_CREATED)
async def join_challenge(
    challenge_id: int,
    user: Annotated[User, Depends(get_request_user)],
    service: Annotated[ChallengeService, Depends(get_challenge_service)],
) -> Response:
    result = await service.join_challenge(user, challenge_id)
    return Response(result.model_dump(), status_code=status.HTTP_201_CREATED)


@challenge_router.get("/user-challenges/me", status_code=status.HTTP_200_OK)
async def get_my_challenges(
    user: Annotated[User, Depends(get_request_user)],
    service: Annotated[ChallengeService, Depends(get_challenge_service)],
    status_filter: str | None = Query(default=None, alias="status"),
) -> Response:
    result = await service.get_my_challenges(user, status_filter)
    return Response([r.model_dump() for r in result], status_code=status.HTTP_200_OK)


@challenge_router.patch("/user-challenges/{user_challenge_id}/quit", status_code=status.HTTP_200_OK)
async def quit_challenge(
    user_challenge_id: int,
    user: Annotated[User, Depends(get_request_user)],
    service: Annotated[ChallengeService, Depends(get_challenge_service)],
) -> Response:
    result = await service.quit_challenge(user, user_challenge_id)
    return Response(result, status_code=status.HTTP_200_OK)


@challenge_router.patch("/user-challenges/{user_challenge_id}/complete", status_code=status.HTTP_200_OK)
async def complete_challenge(
    user_challenge_id: int,
    user: Annotated[User, Depends(get_request_user)],
    service: Annotated[ChallengeService, Depends(get_challenge_service)],
) -> Response:
    result = await service.complete_challenge(user, user_challenge_id)
    return Response(result.model_dump(), status_code=status.HTTP_200_OK)


@challenge_router.post("/user-challenges/{user_challenge_id}/logs", status_code=status.HTTP_201_CREATED)
async def add_challenge_log(
    user_challenge_id: int,
    body: ChallengeLogRequest,
    user: Annotated[User, Depends(get_request_user)],
    service: Annotated[ChallengeService, Depends(get_challenge_service)],
) -> Response:
    result = await service.add_log(user, user_challenge_id, body.is_completed)
    return Response(result.model_dump(), status_code=status.HTTP_201_CREATED)


@challenge_router.post("/user-challenges/{challenge_type}/checkin", status_code=status.HTTP_200_OK)
async def maintenance_checkin(
    challenge_type: str,
    body: MaintenanceCheckinRequest,
    user: Annotated[User, Depends(get_request_user)],
    service: Annotated[ChallengeService, Depends(get_challenge_service)],
) -> Response:
    """유지 모드 체크인 — challenge_type: 운동 | 수면 | 금연 | 금주"""
    result = await service.maintenance_checkin(user, challenge_type, body.still_maintaining)
    return Response(result, status_code=status.HTTP_200_OK)
