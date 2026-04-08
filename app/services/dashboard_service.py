from sqlalchemy.ext.asyncio import AsyncSession

from app.dtos.dashboard import ChallengeSummary, DashboardResponse, LatestPrediction, PredictionHistory
from app.repositories.activity_repository import ActivityRepository
from app.repositories.prediction_repository import PredictionRepository


class DashboardService:
    def __init__(self, session: AsyncSession):
        self.prediction_repo = PredictionRepository(session)
        self.activity_repo = ActivityRepository(session)

    async def get_dashboard(self, user_id: int) -> DashboardResponse:
        latest = await self.prediction_repo.get_latest_by_user_id(user_id)
        history = await self.prediction_repo.get_by_user_id(user_id)
        user_challenges = await self.activity_repo.get_challenges_by_user(user_id)

        return DashboardResponse(
            latest_prediction=LatestPrediction.model_validate(latest) if latest else None,
            prediction_history=[PredictionHistory.model_validate(p) for p in history],
            challenges=[
                ChallengeSummary(
                    name=uc.challenge.name,
                    type=uc.challenge.type,
                    status=uc.status,
                    completed_at=uc.completed_at,
                )
                for uc in user_challenges
            ],
        )