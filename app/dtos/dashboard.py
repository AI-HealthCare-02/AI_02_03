from datetime import datetime
from pydantic import BaseModel


class ShapFactor(BaseModel):
    feature: str
    impact: float


class LatestPrediction(BaseModel):
    score: float
    grade: str
    character_state: str
    shap_factors: list[ShapFactor] = []
    created_at: datetime

    model_config = {"from_attributes": True}


class PredictionHistory(BaseModel):
    score: float
    grade: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ChallengeSummary(BaseModel):
    name: str
    type: str
    status: str
    completed_at: datetime | None


class DashboardResponse(BaseModel):
    latest_prediction: LatestPrediction | None
    prediction_history: list[PredictionHistory]
    challenges: list[ChallengeSummary]