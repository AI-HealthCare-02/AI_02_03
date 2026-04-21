from typing import Annotated

from pydantic import AfterValidator, BaseModel, EmailStr, Field

from app.validators.user_validators import validate_password


class SignUpRequest(BaseModel):
    email: Annotated[EmailStr, Field(max_length=40)]
    password: Annotated[str, Field(min_length=8), AfterValidator(validate_password)]
    nickname: Annotated[str, Field(min_length=2, max_length=20)]


class LoginRequest(BaseModel):
    email: EmailStr
    password: Annotated[str, Field(min_length=8)]


class LoginResponse(BaseModel):
    access_token: str


class TokenRefreshResponse(LoginResponse): ...


class ResetPasswordRequest(BaseModel):
    email: EmailStr
