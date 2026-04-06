from datetime import datetime
from typing import Literal

from pydantic import BaseModel

from app.dtos.base import BaseSerializerModel

GoalCategory = Literal["운동", "식단", "금주", "수면", "기타"]


class GoalCreateRequest(BaseModel):
    category: GoalCategory
    description: str


class GoalUpdateRequest(BaseModel):
    description: str | None = None
    is_achieved: bool | None = None


class GoalResponse(BaseSerializerModel):
    id: int
    user_id: int
    category: str
    description: str | None
    is_achieved: bool
    created_at: datetime
