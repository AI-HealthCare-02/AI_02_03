from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import ORJSONResponse as Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.databases import get_db
from app.dependencies.security import get_request_user
from app.dtos.dashboard import DashboardResponse, LifestyleSummary, ScoreHistoryItem
from app.models.users import User
from app.repositories.challenge_repository import ChallengeLogRepository, UserChallengeRepository
from app.repositories.health_survey_repository import HealthSurveyRepository
from app.repositories.prediction_repository import PredictionRepository

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
        improvement_factors=latest.shap_factors or [],
        score_history=[
            ScoreHistoryItem(score=round(p.score, 1), created_at=p.created_at)
            for p in predictions[:10]
        ],
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
