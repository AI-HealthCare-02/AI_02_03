from datetime import datetime

from pydantic import BaseModel


class ScoreHistoryItem(BaseModel):
    score: float
    created_at: datetime


class LifestyleSummary(BaseModel):
    bmi: float
    weight: float
    sleep_hours: float
    drink_amount: float
    exercise: str
    current_smoking: str


class DashboardResponse(BaseModel):
    latest_score: float
    latest_grade: str
    character_state: str
    improvement_factors: list  # counterfactual 기반 개선 요인
    score_history: list[ScoreHistoryItem]
    lifestyle_summary: LifestyleSummary
    streak_days: int
    weekly_rate: float
    score_percentile: int  # 상위 X% (낮을수록 우수)
