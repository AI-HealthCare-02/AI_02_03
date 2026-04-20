import json
from datetime import UTC, date, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import ORJSONResponse as Response
from openai import AsyncOpenAI
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import config
from app.db.databases import get_db
from app.dependencies.security import get_request_user
from app.dtos.dashboard import DashboardResponse, LifestyleSummary, ScoreHistoryItem
from app.models.appointment import Appointment
from app.models.challenges import UserChallenge
from app.models.medications import Medication, MedicationCompletion
from app.models.users import User
from app.repositories.challenge_repository import ChallengeLogRepository, UserChallengeRepository
from app.repositories.health_survey_repository import HealthSurveyRepository
from app.repositories.prediction_repository import PredictionRepository
from app.utils.redis import cache_get, cache_set, seconds_until_midnight

dashboard_router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@dashboard_router.get("", response_model=DashboardResponse, status_code=status.HTTP_200_OK)
async def get_dashboard(
    user: Annotated[User, Depends(get_request_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Response:
    prediction_repo = PredictionRepository(db)
    survey_repo = HealthSurveyRepository(db)
    uc_repo = UserChallengeRepository(db)
    log_repo = ChallengeLogRepository(db)

    predictions = await prediction_repo.get_by_user_id(user.id)
    if not predictions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="예측 결과가 없습니다. 먼저 건강 예측을 진행해주세요.",
        )

    survey = await survey_repo.get_by_user_id(user.id)
    if not survey:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="설문 데이터가 없습니다.",
        )

    active_ucs = await uc_repo.get_by_user_id(user.id, status="진행중")
    active_uc_ids = [uc.id for uc in active_ucs]
    streak_days = await log_repo.get_streak_days(active_uc_ids)
    weekly_rate = await log_repo.get_weekly_rate(active_uc_ids)

    latest = predictions[0]

    result = DashboardResponse(
        latest_score=round(latest.score, 1),
        latest_grade=latest.grade,
        character_state=latest.character_state,
        improvement_factors=latest.improvement_factors or [],
        score_history=[ScoreHistoryItem(score=round(p.score, 1), created_at=p.created_at) for p in predictions[:10]],
        lifestyle_summary=LifestyleSummary(
            bmi=survey.bmi,
            weight=survey.weight,
            sleep_hours=survey.sleep_hours,
            drink_amount=survey.drink_amount,
            exercise=survey.exercise,
            current_smoking=survey.current_smoking,
        ),
        streak_days=streak_days,
        weekly_rate=weekly_rate,
    )

    return Response(result.model_dump(mode="json"), status_code=status.HTTP_200_OK)


@dashboard_router.get("/message", status_code=status.HTTP_200_OK)
async def get_dashboard_message(
    user: Annotated[User, Depends(get_request_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Response:
    """홈 말풍선 + 맞춤 챌린지 추천 이유 (하루 1회 캐싱)"""
    today = date.today().isoformat()
    cache_key = f"msg:{user.id}:{today}"

    cached = await cache_get(cache_key)
    if cached:
        return Response(cached, status_code=status.HTTP_200_OK)

    # 최신 건강 점수
    prediction_repo = PredictionRepository(db)
    predictions = await prediction_repo.get_by_user_id(user.id)
    if not predictions:
        return Response(
            {"message": "건강 예측을 먼저 진행해주세요!", "challenge_reason": None},
            status_code=status.HTTP_200_OK,
        )
    latest = predictions[0]

    # 오늘 복약 완료율
    now = datetime.now(UTC)
    med_result = await db.execute(select(Medication).where(Medication.user_id == user.id))
    medications = med_result.scalars().all()
    med_ids = [m.id for m in medications]
    completion_count = 0
    if med_ids:
        comp_result = await db.execute(
            select(func.count(MedicationCompletion.id)).where(
                MedicationCompletion.medication_id.in_(med_ids),
                MedicationCompletion.log_date == now.date(),
            )
        )
        completion_count = comp_result.scalar() or 0
    med_rate = f"{completion_count}/{len(med_ids)}" if med_ids else "없음"

    # 다음 진료 예약
    appt_result = await db.execute(
        select(Appointment)
        .where(Appointment.user_id == user.id, Appointment.visit_date > now)
        .order_by(Appointment.visit_date.asc())
        .limit(1)
    )
    next_appt = appt_result.scalar_one_or_none()
    appt_info = "없음"
    if next_appt:
        visit = next_appt.visit_date
        if visit.tzinfo is None:
            visit = visit.replace(tzinfo=UTC)
        d_day = (visit.date() - now.date()).days
        appt_info = f"{next_appt.hospital_name} D-{d_day}"

    # 진행 중 챌린지
    uc_result = await db.execute(
        select(UserChallenge).where(UserChallenge.user_id == user.id, UserChallenge.status == "진행중")
    )
    active_challenges = uc_result.scalars().all()

    client = AsyncOpenAI(api_key=config.OPENAI_API_KEY)
    prompt = f"""당신은 지방간 환자의 건강 관리를 돕는 AI 코치입니다.
아래 정보를 바탕으로 오늘 하루를 응원하는 짧은 말풍선 메시지와, 챌린지 추천 이유를 생성하세요.

- 건강 점수: {latest.score:.1f}점 ({latest.grade})
- 오늘 복약 완료: {med_rate}
- 다음 병원 예약: {appt_info}
- 진행 중 챌린지 수: {len(active_challenges)}개

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요.
{{
  "message": "오늘 환자에게 건넬 따뜻하고 구체적인 한 문장 (40자 이내)",
  "challenge_reason": "지금 챌린지를 시작하면 좋은 이유 한 문장 (40자 이내)"
}}"""

    try:
        resp = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200,
        )
        text = resp.choices[0].message.content.strip().replace("```json", "").replace("```", "").strip()
        result = json.loads(text)
    except Exception:
        result = {
            "message": "오늘도 건강한 하루 보내세요!",
            "challenge_reason": "작은 챌린지 하나가 큰 변화를 만들어요",
        }

    await cache_set(cache_key, result, seconds_until_midnight())
    return Response(result, status_code=status.HTTP_200_OK)
