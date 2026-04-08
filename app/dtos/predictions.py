from datetime import datetime

from pydantic import BaseModel, Field


class RecommendedChallenge(BaseModel):
    id: int
    name: str
    type: str


class ImprovementFactor(BaseModel):
    category: str
    challenge_type: str
    score_delta: int


class PredictionResponse(BaseModel):
    id: int
    score: float
    grade: str
    character_state: str
    improvement_factors: list[ImprovementFactor] = Field(default=[], validation_alias="shap_factors")
    recommended_challenges: list[RecommendedChallenge] = []
    created_at: datetime

    model_config = {"from_attributes": True}


class PredictionListItem(BaseModel):
    score: float
    grade: str
    character_state: str
    created_at: datetime

    model_config = {"from_attributes": True}


