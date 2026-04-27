import re
from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.dtos.base import BaseSerializerModel


class UserUpdateRequest(BaseModel):
    email: Annotated[EmailStr | None, Field(None, max_length=40)] = None
    nickname: Annotated[str | None, Field(None, min_length=2, max_length=20)] = None

    @field_validator("nickname")
    @classmethod
    def validate_nickname(cls, v):
        if v and not re.match(r"^[a-zA-Z0-9가-힣_]+$", v):
            raise ValueError("닉네임에는 특수문자를 사용할 수 없습니다.")
        return v


class UserInfoResponse(BaseSerializerModel):
    id: int
    email: str | None
    nickname: str
    is_onboarded: bool
    created_at: datetime
