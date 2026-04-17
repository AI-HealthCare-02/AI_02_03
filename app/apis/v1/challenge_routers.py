import json
from datetime import UTC, date, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import ORJSONResponse as Response
from openai import AsyncOpenAI
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import config
from app.db.databases import get_db
from app.dependencies.security import get_request_user
from app.dtos.challenges import ChallengeLogRequest, CustomChallengeCreateRequest, MaintenanceCheckinRequest
from app.models.appointment import Appointment
from app.models.challenges import Challenge, UserChallenge
from app.models.users import User
from app.repositories.prediction_repository import PredictionRepository
from app.services.challenges import ChallengeService
from app.utils.redis import cache_get, cache_set, seconds_until_midnight

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
    """다음 진료일 D-day 기반 막간 챌린지 추천 + LLM 개인화 이유 + 예상 배지"""
    today = date.today().isoformat()
    cache_key = f"suggested:{user.id}:{today}"
    cached = await cache_get(cache_key)
    if cached:
        return Response(cached, status_code=status.HTTP_200_OK)

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
    appt_context = "없음"
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
        appt_context = f"{next_appt.hospital_name} D-{d_day}"

    # 이미 참여 중인 챌린지 ID 제외
    joined_result = await db.execute(
        select(UserChallenge.challenge_id).where(
            UserChallenge.user_id == user.id,
            UserChallenge.status == "진행중",
        )
    )
    joined_ids = {row[0] for row in joined_result.all()}

    # D-day 기준 기간 필터 — 예약이 있으면 남은 일수 이하만, 없으면 전체
    duration_filter = Challenge.duration_days <= d_day if d_day is not None else Challenge.duration_days > 0

    challenges_result = await db.execute(
        select(Challenge)
        .where(
            Challenge.is_custom == False,  # noqa: E712
            duration_filter,
            Challenge.id.notin_(joined_ids),
        )
        .order_by(Challenge.duration_days.desc())
        .limit(5)
    )
    challenges = challenges_result.scalars().all()

    # 건강 점수 조회
    prediction_repo = PredictionRepository(db)
    predictions = await prediction_repo.get_by_user_id(user.id)
    health_context = f"{predictions[0].score:.1f}점 ({predictions[0].grade})" if predictions else "정보 없음"

    # LLM: 각 챌린지별 개인화 이유 + 예상 배지 한 번에 생성
    challenge_list = "\n".join(f"- id:{c.id} 이름:{c.name} 종류:{c.type} 기간:{c.duration_days}일" for c in challenges)
    prompt = f"""당신은 지방간 환자의 건강 관리를 돕는 AI 코치입니다.
아래 사용자 상황에 맞게 각 챌린지를 추천하는 이유와, 완료 시 받을 특별 배지를 만들어주세요.

[사용자 상황]
- 건강 점수: {health_context}
- 다음 병원 예약: {appt_context}
- 현재 참여 챌린지 수: {len(joined_ids)}개

[추천 챌린지 목록]
{challenge_list}

반드시 아래 JSON 배열 형식으로만 응답하세요. 챌린지 순서를 유지하고 다른 텍스트는 절대 포함하지 마세요.
[
  {{
    "id": 챌린지id(정수),
    "reason": "이 사용자에게 이 챌린지를 추천하는 구체적 이유 한 문장 (40자 이내)",
    "preview_badge": {{
      "name": "완료 시 받을 배지 이름 (15자 이내)",
      "description": "배지 설명 (30자 이내)",
      "emoji": "어울리는 이모지 1개"
    }}
  }}
]"""

    llm_map: dict[int, dict] = {}
    try:
        client = AsyncOpenAI(api_key=config.OPENAI_API_KEY)
        resp = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=600,
        )
        text = resp.choices[0].message.content.strip().replace("```json", "").replace("```", "").strip()
        items = json.loads(text)
        llm_map = {item["id"]: item for item in items if "id" in item}
    except Exception:
        pass

    suggested = []
    for c in challenges:
        llm = llm_map.get(c.id, {})
        suggested.append(
            {
                "id": c.id,
                "type": c.type,
                "name": c.name,
                "description": c.description,
                "duration_days": c.duration_days,
                "reason": llm.get(
                    "reason",
                    f"진료 {d_day}일 전, {c.duration_days}일 챌린지로 딱 맞아요"
                    if d_day is not None
                    else f"{c.duration_days}일 챌린지로 시작해보세요",
                ),
                "preview_badge": llm.get(
                    "preview_badge",
                    {"name": f"{c.name} 완료", "description": f"{c.duration_days}일 챌린지 달성", "emoji": "🏆"},
                ),
            }
        )

    result = {"next_appointment": next_appt_info, "suggested": suggested}
    await cache_set(cache_key, result, seconds_until_midnight())
    return Response(result, status_code=status.HTTP_200_OK)


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
