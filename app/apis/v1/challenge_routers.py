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
from app.models.badges import UserBadge
from app.models.challenges import Challenge, UserChallenge
from app.models.food_logs import FoodLog
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
    """LLM이 D-day·건강상태 기반으로 챌린지 자체를 생성, DB 저장 후 반환"""
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

    # 이미 참여 중인 챌린지 ID
    joined_result = await db.execute(
        select(UserChallenge.challenge_id).where(
            UserChallenge.user_id == user.id,
            UserChallenge.status == "진행중",
        )
    )
    joined_ids = {row[0] for row in joined_result.all()}

    # 건강 점수 조회
    prediction_repo = PredictionRepository(db)
    predictions = await prediction_repo.get_by_user_id(user.id)
    health_context = f"{predictions[0].score:.1f}점 ({predictions[0].grade})" if predictions else "정보 없음"

    # 최근 식단 로그 조회 (최대 5개)
    food_result = await db.execute(
        select(FoodLog).where(FoodLog.user_id == user.id).order_by(FoodLog.analyzed_at.desc()).limit(5)
    )
    recent_foods = food_result.scalars().all()
    food_context = ", ".join(f"{f.food_name}({f.rating})" for f in recent_foods) if recent_foods else "없음"

    # 이미 획득한 AI 배지 이름 집합
    earned_badge_result = await db.execute(
        select(UserBadge.badge_name).where(
            UserBadge.user_id == user.id,
            UserBadge.badge_name.isnot(None),
        )
    )
    earned_badge_names = {row[0] for row in earned_badge_result.all()}

    max_days = d_day if d_day is not None else 30

    prompt = f"""당신은 지방간 환자의 건강 관리를 돕는 AI 코치입니다.
아래 사용자 상황에 딱 맞는 개인화 챌린지 2개를 직접 만들어주세요.

[사용자 상황]
- 건강 점수: {health_context}
- 다음 병원 예약: {appt_context}
- 최근 먹은 음식: {food_context}
- 현재 참여 중인 챌린지 수: {len(joined_ids)}개

[중요 제약 — 반드시 지킬 것]
- duration_days는 절대로 {max_days}를 초과하면 안 됩니다.
- required_logs는 duration_days 이하여야 합니다.
- type은 반드시 운동, 식단, 수면, 금주, 금연, 체중감량 중 하나여야 합니다.
- 최근 먹은 음식 중 '주의' 등급이 있으면 해당 식품을 줄이는 식단 챌린지를 반드시 포함하세요.

[배지 이름 기준]
- duration_days 7일 이하: 평범하고 소박한 이름 (예: 건강한 선택, 첫 발걸음, 잘했어요)
- duration_days 8~20일: 보통 수준 이름 (예: 꾸준한 실천, 한 걸음 더)
- duration_days 21일 이상: 멋진 이름 허용 (예: 습관의 달인, 건강 챔피언)

반드시 아래 JSON 배열 형식으로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요.
[
  {{
    "name": "챌린지 이름 (20자 이내)",
    "type": "운동|식단|수면|금주|금연|체중감량 중 하나",
    "description": "챌린지 설명 (50자 이내)",
    "duration_days": {max_days} 이하의 정수,
    "required_logs": duration_days 이하의 정수,
    "reason": "이 사용자에게 추천하는 구체적 이유 한 문장 (40자 이내)",
    "preview_badge": {{
      "name": "완료 시 받을 배지 이름 (15자 이내)",
      "description": "배지 설명 (30자 이내)",
      "emoji": "어울리는 이모지 1개"
    }}
  }}
]"""

    suggested = []
    try:
        client = AsyncOpenAI(api_key=config.OPENAI_API_KEY)
        resp = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=800,
        )
        text = resp.choices[0].message.content.strip().replace("```json", "").replace("```", "").strip()
        items = json.loads(text)

        for item in items:
            duration = min(int(item.get("duration_days", 7)), max_days)
            required = min(int(item.get("required_logs", duration)), duration)

            # 오늘 이미 동일 이름으로 생성된 챌린지가 있으면 재사용
            existing = await db.execute(
                select(Challenge).where(
                    Challenge.name == item["name"],
                    Challenge.created_by == user.id,
                    Challenge.is_custom == True,  # noqa: E712
                )
            )
            challenge = existing.scalar_one_or_none()
            if not challenge:
                challenge = Challenge(
                    name=item["name"],
                    type=item["type"],
                    description=item.get("description", ""),
                    duration_days=duration,
                    required_logs=required,
                    is_custom=True,
                    created_by=user.id,
                )
                db.add(challenge)
                await db.flush()
                await db.refresh(challenge)

            if challenge.id not in joined_ids:
                raw_badge = item.get("preview_badge")
                if raw_badge and raw_badge.get("name") in earned_badge_names:
                    raw_badge = None
                suggested.append(
                    {
                        "id": challenge.id,
                        "type": challenge.type,
                        "name": challenge.name,
                        "description": challenge.description,
                        "duration_days": challenge.duration_days,
                        "reason": item.get("reason", f"{duration}일 챌린지로 진료 전 건강을 챙겨보세요"),
                        "preview_badge": raw_badge,
                    }
                )

        await db.commit()
    except Exception as e:
        import logging

        logging.getLogger(__name__).exception("suggested challenges 생성 실패: %s", e)

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
