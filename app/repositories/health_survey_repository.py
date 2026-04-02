from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.health_surveys import HealthSurvey


class HealthSurveyRepository:
    def __init__(self, session: AsyncSession):
        self._session = session

    async def get_by_user_id(self, user_id: int) -> HealthSurvey | None:
        result = await self._session.execute(
            select(HealthSurvey).where(HealthSurvey.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def create(self, data: dict) -> HealthSurvey:
        survey = HealthSurvey(**data)
        self._session.add(survey)
        await self._session.flush()
        await self._session.refresh(survey)
        return survey

    async def update(self, survey: HealthSurvey, data: dict) -> HealthSurvey:
        for key, value in data.items():
            if value is not None:
                setattr(survey, key, value)
        await self._session.flush()
        await self._session.refresh(survey)
        return survey
