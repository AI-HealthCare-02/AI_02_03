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

    async def social_login_or_signup(
        self,
        provider: str,
        social_id: str,
        email: str | None,
        nickname: str,
    ) -> dict:
        """소셜 계정으로 기존 사용자 찾거나 신규 생성 후 JWT 발급"""
        user = await self.user_repo.get_by_social(provider, social_id)
        if not user:
            # 같은 이메일로 가입된 일반 계정이 있으면 소셜 연동
            if email:
                user = await self.user_repo.get_user_by_email(email)
            if user:
                await self.user_repo.update_instance(user, {"social_provider": provider, "social_id": social_id})
            else:
                safe_nickname = await self._make_unique_nickname(nickname)
                user = await self.user_repo.create_social_user(
                    provider=provider,
                    social_id=social_id,
                    nickname=safe_nickname,
                    email=email,
                )
        tokens = self.jwt_service.issue_jwt_pair(user)
        return {"tokens": tokens, "is_new": not user.is_onboarded}

    async def _make_unique_nickname(self, base: str) -> str:
        """닉네임 중복 시 숫자 접미사로 유일화"""
        import random

        nickname = base[:18]
        if not await self.user_repo.exists_by_nickname(nickname):
            return nickname
        for _ in range(10):
            candidate = f"{nickname[:16]}{random.randint(10, 99)}"
            if not await self.user_repo.exists_by_nickname(candidate):
                return candidate
        return f"{nickname[:14]}{random.randint(1000, 9999)}"

    async def check_email_exists(self, email: str | EmailStr) -> None:
        if await self.user_repo.exists_by_email(str(email)):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="이미 사용중인 이메일입니다.")

    async def reset_password(self, email: str) -> str:
        user = await self.user_repo.get_user_by_email(email)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="가입되지 않은 이메일입니다.")
        if user.social_provider and not user.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="소셜 로그인 계정은 비밀번호 재설정을 지원하지 않습니다.",
            )
        import random
        import string

        temp_password = "".join(random.choices(string.ascii_letters + string.digits, k=10))
        await self.user_repo.update_instance(user, {"hashed_password": hash_password(temp_password)})
        return temp_password
