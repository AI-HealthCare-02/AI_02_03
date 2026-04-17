from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import ORJSONResponse as Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.databases import get_db
from app.dependencies.security import get_request_user
from app.dtos.challenges import ChallengeLogRequest, CustomChallengeCreateRequest, MaintenanceCheckinRequest
from app.models.appointment import Appointment
from app.models.challenges import Challenge, UserChallenge
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


@challenge_router.get("/challenges/suggested", status_code=status.HTTP_200_OK)
async def get_suggested_challenges(
    user: Annotated[User, Depends(get_request_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Response:
    """다음 진료일 D-day 기반 막간 챌린지 추천 (LLM 없음)"""
    now = datetime.now(UTC)

    # 다음 예약 조회
    appt_result = await db.execute(
        select(Appointment)
        .where(Appointment.user_id == user.id, Appointment.visit_date > now)
        .order_by(Appointment.visit_date.asc())
        .limit(1)
    )
    next_appt = appt_result.scalar_one_or_none()

    d_day: int | None = None
    next_appt_info: dict | None = None
    if next_appt:
        visit = next_appt.visit_date
        if visit.tzinfo is None:
            visit = visit.replace(tzinfo=UTC)
        d_day = (visit.date() - now.date()).days
        next_appt_info = {
            "hospital_name": next_appt.hospital_name,
            "visit_date": next_appt.visit_date.isoformat(),
            "d_day": d_day,
        }

    # 이미 참여 중인 챌린지 ID 제외
    joined_result = await db.execute(
        select(UserChallenge.challenge_id).where(
            UserChallenge.user_id == user.id,
            UserChallenge.status == "진행중",
        )
    )
    joined_ids = {row[0] for row in joined_result.all()}

    # D-day 기준 기간 필터
    if d_day is None:
        target_days = [7, 14, 30]
    elif d_day >= 14:
        target_days = [14, 30]
    elif d_day >= 7:
        target_days = [7, 14]
    else:
        target_days = [3, 7]

    challenges_result = await db.execute(
        select(Challenge)
        .where(
            Challenge.is_custom == False,  # noqa: E712
            Challenge.duration_days.in_(target_days),
            Challenge.id.notin_(joined_ids),
        )
        .order_by(Challenge.duration_days.asc())
        .limit(5)
    )
    challenges = challenges_result.scalars().all()

    return Response(
        {
            "next_appointment": next_appt_info,
            "suggested": [
                {
                    "id": c.id,
                    "type": c.type,
                    "name": c.name,
                    "description": c.description,
                    "duration_days": c.duration_days,
                    "reason": f"진료 {d_day}일 전, {c.duration_days}일짜리 챌린지로 딱 맞아요"
                    if d_day is not None
                    else f"{c.duration_days}일 챌린지로 시작해보세요",
                }
                for c in challenges
            ],
        },
        status_code=status.HTTP_200_OK,
    )


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
