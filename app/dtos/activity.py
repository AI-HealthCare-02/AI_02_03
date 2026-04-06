from datetime import datetime

from pydantic import BaseModel

from app.dtos.base import BaseSerializerModel


class PredictionSummary(BaseSerializerModel):
    score: float
    grade: str
    created_at: datetime


class ChallengeSummary(BaseModel):
    name: str
    type: str
    status: str
    completed_at: datetime | None


class ActivityResponse(BaseModel):
    predictions: list[PredictionSummary]
    challenges: list[ChallengeSummary]
