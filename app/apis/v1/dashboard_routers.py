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
from app.models.challenges import ChallengeLog
from app.models.health_surveys import HealthSurvey
from app.models.medications import Medication, MedicationCompletion
from app.models.predictions import Prediction
from app.models.users import User
from app.repositories.challenge_repository import ChallengeLogRepository, UserChallengeRepository
from app.repositories.health_survey_repository import HealthSurveyRepository
from app.repositories.prediction_repository import PredictionRepository
from app.utils.redis import cache_get, cache_set, get_time_period

dashboard_router = APIRouter(prefix="/dashboard", tags=["dashboard"])


async def _build_message_context(db: AsyncSession, user_id: int, now: datetime) -> str:
    lines: list[str] = []

    # 복약 (있는 사람만)
    med_result = await db.execute(select(Medication).where(Medication.user_id == user_id))
    med_ids = [m.id for m in med_result.scalars().all()]
    if med_ids:
        comp_result = await db.execute(
            select(func.count(MedicationCompletion.id)).where(
                MedicationCompletion.medication_id.in_(med_ids),
                MedicationCompletion.log_date == now.date(),
            )
        )
        done = comp_result.scalar() or 0
        lines.append(f"오늘 복약 {done}/{len(med_ids)} 완료")

    # 병원 예약 (있는 사람만)
    appt_result = await db.execute(
        select(Appointment)
        .where(Appointment.user_id == user_id, Appointment.visit_date > now)
        .order_by(Appointment.visit_date.asc())
        .limit(1)
    )
    next_appt = appt_result.scalar_one_or_none()
    if next_appt:
        visit = next_appt.visit_date
        if visit.tzinfo is None:
            visit = visit.replace(tzinfo=UTC)
        d_day = (visit.date() - now.date()).days
        lines.append(f"다음 병원: {next_appt.hospital_name} D-{d_day}")

    # 챌린지 현황
    uc_repo = UserChallengeRepository(db)
    log_repo = ChallengeLogRepository(db)
    active_ucs = await uc_repo.get_by_user_id(user_id, status="진행중")
    active_uc_ids = [uc.id for uc in active_ucs]

    streak_days = await log_repo.get_streak_days(active_uc_ids)
    if streak_days > 0:
        lines.append(f"연속 참여 {streak_days}일째")

    incomplete: list[str] = []
    for uc in active_ucs:
        log = await db.execute(
            select(ChallengeLog).where(
                ChallengeLog.user_challenge_id == uc.id,
                ChallengeLog.log_date == now.date(),
                ChallengeLog.is_completed.is_(True),
            )
        )
        if log.scalar_one_or_none() is None:
            incomplete.append(uc.challenge.name)

    if incomplete:
        lines.append(f"오늘 미완료 챌린지: {', '.join(incomplete)}")
    elif active_ucs:
        lines.append("오늘 챌린지 모두 완료!")

    return "\n".join(f"- {line}" for line in lines) if lines else "- 아직 활동 내역 없음"


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

    # 나이대 구간 (10년 단위)
    age_group_min = (survey.age // 10) * 10
    age_group_max = age_group_min + 9

    # 같은 나이대 유저의 최신 예측 ID 서브쿼리
    same_age_user_ids_subq = (
        select(HealthSurvey.user_id)
        .where(HealthSurvey.age >= age_group_min, HealthSurvey.age <= age_group_max)
        .scalar_subquery()
    )
    latest_id_subq = (
        select(func.max(Prediction.id))
        .where(Prediction.user_id.in_(same_age_user_ids_subq))
        .group_by(Prediction.user_id)
        .scalar_subquery()
    )
    total_res = await db.execute(select(func.count()).where(Prediction.id.in_(latest_id_subq)))
    total = total_res.scalar() or 1
    below_res = await db.execute(
        select(func.count()).where(
            Prediction.id.in_(latest_id_subq),
            Prediction.score < latest.score,
        )
    )
    below = below_res.scalar() or 0
    if total <= 1:
        display_pct = 50
        percentile_label = "상위"
    else:
        rank_pct = round(below / total * 100)  # 나보다 낮은 사람 비율
        display_pct = max(1, min(99, 100 - rank_pct))
        percentile_label = "상위" if rank_pct >= 50 else "하위"

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
        score_percentile=display_pct,
        score_percentile_label=percentile_label,
        age_group=age_group_min,
    )

    return Response(result.model_dump(mode="json"), status_code=status.HTTP_200_OK)


@dashboard_router.get("/message", status_code=status.HTTP_200_OK)
async def get_dashboard_message(
    user: Annotated[User, Depends(get_request_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Response:
    """홈 말풍선 (아침/점심/저녁 시간대별 캐싱)"""
    today = date.today().isoformat()
    period, ttl = get_time_period()
    cache_key = f"msg:{user.id}:{today}:{period}"

    cached = await cache_get(cache_key)
    if cached:
        return Response(cached, status_code=status.HTTP_200_OK)

    prediction_repo = PredictionRepository(db)
    predictions = await prediction_repo.get_by_user_id(user.id)
    if not predictions:
        return Response(
            {"message": "건강 예측을 먼저 진행해주세요!"},
            status_code=status.HTTP_200_OK,
        )

    now = datetime.now(UTC)
    context_str = await _build_message_context(db, user.id, now)

    period_context = {
        "morning": "아침입니다. 오늘 복약과 챌린지 계획을 세우도록 유도하세요.",
        "afternoon": "점심입니다. 오전 챌린지를 점검하고 오후 참여를 독려하세요.",
        "evening": "저녁입니다. 오늘 달성한 것을 언급하며 마무리를 유도하세요.",
    }[period]

    client = AsyncOpenAI(api_key=config.OPENAI_API_KEY)
    prompt = f"""당신은 지방간 환자의 건강 관리를 돕는 적극적인 AI 코치입니다.
지금은 {period_context}
아래 데이터를 바탕으로 지금 당장 행동하고 싶게 만드는 짧은 메시지를 생성하세요.

{context_str}

규칙:
- 막연한 응원("힘내세요", "잘할 수 있어요") 금지
- 위 데이터 중 하나를 구체적으로 언급해 행동을 유도할 것
- 예시: "복약 아직 1/3이에요, 지금 바로 챙겨보세요!", "연속 5일째, 오늘 챌린지 완료하면 기록 유지!"

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요.
{{
  "message": "행동을 유도하는 구체적인 한 문장 (40자 이내)"
}}"""

    try:
        resp = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=100,
        )
        text = resp.choices[0].message.content.strip().replace("```json", "").replace("```", "").strip()
        result = json.loads(text)
    except Exception:
        result = {"message": "오늘도 건강한 하루 보내세요!"}

    await cache_set(cache_key, result, ttl)
    return Response(result, status_code=status.HTTP_200_OK)
