from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, HTTPException, status
from fastapi.responses import JSONResponse as Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import config
from app.core.config import Env
from app.db.databases import get_db
from app.dtos.auth import LoginRequest, LoginResponse, SignUpRequest, TokenRefreshResponse
from app.services.auth import AuthService
from app.services.jwt import JwtService

auth_router = APIRouter(prefix="/auth", tags=["auth"])


def get_auth_service(db: Annotated[AsyncSession, Depends(get_db)]) -> AuthService:
    return AuthService(db)


@auth_router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(
    request: SignUpRequest,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> Response:
    await auth_service.signup(request)
    return Response(content={"detail": "회원가입이 성공적으로 완료되었습니다."}, status_code=status.HTTP_201_CREATED)


@auth_router.post("/login", response_model=LoginResponse, status_code=status.HTTP_200_OK)
async def login(
    request: LoginRequest,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> Response:
    user = await auth_service.authenticate(request)
    tokens = await auth_service.login(user)
    resp = Response(
        content=LoginResponse(access_token=str(tokens["access_token"])).model_dump(), status_code=status.HTTP_200_OK
    )
    resp.set_cookie(
        key="refresh_token",
        value=str(tokens["refresh_token"]),
        httponly=True,
        secure=True if config.ENV == Env.PROD else False,
        domain=config.COOKIE_DOMAIN or None,
        expires=tokens["access_token"].payload["exp"],
    )
    return resp


@auth_router.post("/logout", status_code=status.HTTP_200_OK)
async def logout() -> Response:
    resp = Response(content={"detail": "로그아웃 되었습니다."}, status_code=status.HTTP_200_OK)
    resp.delete_cookie(key="refresh_token")
    return resp


@auth_router.get("/token/refresh", response_model=TokenRefreshResponse, status_code=status.HTTP_200_OK)
async def token_refresh(
    jwt_service: Annotated[JwtService, Depends(JwtService)],
    refresh_token: Annotated[str | None, Cookie()] = None,
) -> Response:
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token is missing.")
    access_token = jwt_service.refresh_jwt(refresh_token)
    return Response(
        content=TokenRefreshResponse(access_token=str(access_token)).model_dump(), status_code=status.HTTP_200_OK
    )


@auth_router.get("/check-email", status_code=status.HTTP_200_OK)
async def check_email(
    email: str,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> Response:
    await auth_service.check_email_exists(email)
    return Response(content={"available": True}, status_code=status.HTTP_200_OK)


@auth_router.get("/check-nickname", status_code=status.HTTP_200_OK)
async def check_nickname(
    nickname: str,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Response:
    from app.repositories.user_repository import UserRepository
    repo = UserRepository(db)
    exists = await repo.exists_by_nickname(nickname)
    if exists:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="이미 사용중인 닉네임입니다.")
    return Response(content={"available": True}, status_code=status.HTTP_200_OK)
