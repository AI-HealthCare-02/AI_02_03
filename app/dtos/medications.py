from datetime import datetime
from pydantic import BaseModel, Field
from app.dtos.base import BaseSerializerModel


class MedicationCreateRequest(BaseModel):
    name: str = Field(max_length=100)
    dosage: str = Field(max_length=50)
    schedule: str = Field(max_length=50, description="예: 아침/점심/저녁")


class MedicationResponse(BaseSerializerModel):
    id: int
    user_id: int
    name: str
    dosage: str
    schedule: str
    is_taken: bool
    created_at: datetime
    updated_at: datetime
