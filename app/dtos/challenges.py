from datetime import date, datetime

from pydantic import BaseModel


class ChallengeResponse(BaseModel):
    id: int
    type: str
    name: str
    description: str
    duration_days: int
    required_logs: int
    is_recommended: bool = False
    participant_count: int = 0
    is_custom: bool = False

    model_config = {"from_attributes": True}


class CustomChallengeCreateRequest(BaseModel):
    title: str
    description: str
    category: str
    duration_days: int


class ChallengeJoinResponse(BaseModel):
    detail: str
    user_challenge_id: int


class UserChallengeResponse(BaseModel):
    user_challenge_id: int
    challenge_id: int
    challenge_name: str
    type: str
    description: str
    duration_days: int
    required_logs: int
    status: str
    progress: int = 0
    days_left: int = 0
    today_completed: bool = False
    joined_at: datetime
    completed_at: datetime | None = None

    model_config = {"from_attributes": True}


class ChallengeCompleteRequest(BaseModel):
    weight: float | None = None  # 체중감량 챌린지 완료 시 현재 체중 (kg)


class ChallengeCompleteResponse(BaseModel):
    detail: str
    score_before: float
    new_score: float
    new_grade: str
    survey_changes: dict | None = None


class ChallengeLogRequest(BaseModel):
    is_completed: bool


class ChallengeLogResponse(BaseModel):
    detail: str
    log_date: date
    days_remaining: int
    motivation_message: str
    expected_improvement: str


class MaintenanceCheckinRequest(BaseModel):
    still_maintaining: bool


class MaintenanceCheckinResponse(BaseModel):
    detail: str
    is_maintenance: bool
    consecutive_days: int = 0
    recovery_rate: float = 0.0
    recovery_points: int = 0
