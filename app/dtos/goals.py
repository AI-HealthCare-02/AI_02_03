from datetime import datetime
from pydantic import BaseModel, Field
from app.dtos.base import BaseSerializerModel


class GoalCreateRequest(BaseModel):
    title: str = Field(max_length=100)
    description: str | None = Field(None)


class GoalUpdateRequest(BaseModel):
    title: str | None = Field(None, max_length=100)
    description: str | None = Field(None)
    is_completed: bool | None = Field(None)


class GoalResponse(BaseSerializerModel):
    id: int
    user_id: int
    title: str
    description: str | None
    is_completed: bool
    created_at: datetime
    updated_at: datetime