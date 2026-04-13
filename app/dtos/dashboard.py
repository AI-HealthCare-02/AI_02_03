from datetime import datetime

from pydantic import BaseModel


class ScoreHistoryItem(BaseModel):
    score: float
    created_at: datetime


class LifestyleSummary(BaseModel):
    bmi: float
    sleep_hours: float
    drink_amount: float
    exercise: str


class DashboardResponse(BaseModel):
    latest_score: float
    latest_grade: str
    character_state: str
    improvement_factors: list  # counterfactual 기반 개선 요인
    score_history: list[ScoreHistoryItem]
    lifestyle_summary: LifestyleSummary
