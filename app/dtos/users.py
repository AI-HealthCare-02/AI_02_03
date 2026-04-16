from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, EmailStr, Field

from app.dtos.base import BaseSerializerModel


class UserUpdateRequest(BaseModel):
    email: Annotated[EmailStr | None, Field(None, max_length=40)] = None
    nickname: Annotated[str | None, Field(None, min_length=2, max_length=20)] = None


class UserInfoResponse(BaseSerializerModel):
    id: int
    email: str | None
    nickname: str
    is_onboarded: bool
    created_at: datetime
