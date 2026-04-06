from datetime import datetime

from pydantic import BaseModel


class RecommendedChallenge(BaseModel):
    id: int
    name: str
    type: str


class ShapFactor(BaseModel):
    feature: str
    impact: float


class PredictionResponse(BaseModel):
    id: int
    score: float
    grade: str
    character_state: str
    shap_factors: list[ShapFactor] = []
    recommended_challenges: list[RecommendedChallenge] = []
    created_at: datetime

    model_config = {"from_attributes": True}


class PredictionListItem(BaseModel):
    score: float
    grade: str
    character_state: str
    created_at: datetime

    model_config = {"from_attributes": True}


class PredictionListResponse(BaseModel):
    predictions: list[PredictionListItem]
