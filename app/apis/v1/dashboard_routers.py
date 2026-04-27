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
from app.models.challenges import Challenge, UserChallenge
from app.models.medications import Medication, MedicationCompletion
from app.models.health_surveys import HealthSurvey
from app.models.predictions import Prediction
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

    # 진행 중 챌린지 타입
    uc_result = await db.execute(
        select(Challenge.type)
        .join(UserChallenge, Challenge.id == UserChallenge.challenge_id)
        .where(UserChallenge.user_id == user.id, UserChallenge.status == "진행중")
    )
    active_types = [r[0] for r in uc_result.all()]
    challenge_context = f"진행 중: {', '.join(active_types)}" if active_types else "진행 중인 챌린지 없음"

    # 개선 요인 타입 (score_delta 높은 순 최대 2개)
    factors = sorted(
        latest.improvement_factors or [],
        key=lambda f: f.get("score_delta", 0) if isinstance(f, dict) else getattr(f, "score_delta", 0),
        reverse=True,
    )[:2]
    improvement_context = (
        ", ".join(
            f"{f.get('challenge_type') if isinstance(f, dict) else f.challenge_type}(+{f.get('score_delta') if isinstance(f, dict) else f.score_delta}점)"
            for f in factors
        )
        if factors
        else "없음"
    )

    client = AsyncOpenAI(api_key=config.OPENAI_API_KEY)
    prompt = f"""당신은 지방간 환자의 건강 관리를 돕는 AI 코치입니다.
아래 정보를 바탕으로 오늘 하루를 응원하는 짧은 말풍선 메시지와, 챌린지 추천 이유를 생성하세요.

- 건강 점수: {latest.score:.1f}점 ({latest.grade})
- 오늘 복약 완료: {med_rate}
- 다음 병원 예약: {appt_info}
- 챌린지 현황: {challenge_context}
- 개선 시 점수 상승 가능 항목: {improvement_context}

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요.
{{
  "message": "오늘 환자에게 건넬 따뜻하고 구체적인 한 문장 (40자 이내)",
  "challenge_reason": "개선 가능 항목의 점수를 언급하며 챌린지 참여를 유도하는 한 문장 (40자 이내, 예: '체중감량 챌린지로 +9점 올려보세요!')"
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
