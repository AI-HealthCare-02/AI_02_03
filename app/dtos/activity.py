from datetime import datetime
from pydantic import BaseModel
from app.dtos.base import BaseSerializerModel


class ActivityLogResponse(BaseSerializerModel):
    id: int
    user_id: int
    activity_type: str
    description: str | None
    created_at: datetime