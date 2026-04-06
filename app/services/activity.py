from sqlalchemy.ext.asyncio import AsyncSession

from app.dtos.activity import ActivityResponse, ChallengeSummary, PredictionSummary
from app.repositories.activity_repository import ActivityRepository


class ActivityService:
    def __init__(self, session: AsyncSession):
        self.activity_repo = ActivityRepository(session)

    async def get_my_activity(self, user_id: int, limit: int = 20) -> ActivityResponse:
        predictions = await self.activity_repo.get_predictions_by_user(user_id, limit)
        user_challenges = await self.activity_repo.get_challenges_by_user(user_id)

        return ActivityResponse(
            predictions=[PredictionSummary.model_validate(p) for p in predictions],
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
