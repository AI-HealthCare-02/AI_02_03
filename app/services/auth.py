from fastapi.exceptions import HTTPException
from pydantic import EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status

from app.dtos.auth import LoginRequest, SignUpRequest
from app.models.users import User
from app.repositories.user_repository import UserRepository
from app.services.jwt import JwtService
from app.utils.jwt.tokens import AccessToken, RefreshToken
from app.utils.security import hash_password, verify_password


class AuthService:
    def __init__(self, session: AsyncSession):
        self.user_repo = UserRepository(session)
        self.jwt_service = JwtService()

    async def signup(self, data: SignUpRequest) -> User:
        await self.check_email_exists(data.email)
        user = await self.user_repo.create_user(
            email=data.email,
            hashed_password=hash_password(data.password),
            nickname=data.nickname,
        )
        return user

    async def authenticate(self, data: LoginRequest) -> User:
        user = await self.user_repo.get_user_by_email(str(data.email))
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="이메일 또는 비밀번호가 올바르지 않습니다.",
            )
        if not verify_password(data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="이메일 또는 비밀번호가 올바르지 않습니다.",
            )
        return user

    async def login(self, user: User) -> dict[str, AccessToken | RefreshToken]:
        return self.jwt_service.issue_jwt_pair(user)

    async def check_email_exists(self, email: str | EmailStr) -> None:
        if await self.user_repo.exists_by_email(str(email)):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="이미 사용중인 이메일입니다.")
