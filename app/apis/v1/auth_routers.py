import secrets
from typing import Annotated
from urllib.parse import urlencode

from fastapi import APIRouter, Cookie, Depends, HTTPException, status
from fastapi.responses import JSONResponse as Response
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import config
from app.core.config import Env
from app.db.databases import get_db
from app.dtos.auth import LoginRequest, LoginResponse, SignUpRequest, TokenRefreshResponse
from app.services.auth import AuthService
from app.services.jwt import JwtService
from app.services.oauth import KakaoOAuthService, NaverOAuthService

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


# ──────────────────────── Social Login ────────────────────────

_kakao_svc = KakaoOAuthService()
_naver_svc = NaverOAuthService()

_NAVER_STATE_COOKIE = "naver_oauth_state"


@auth_router.get("/kakao")
async def kakao_login() -> RedirectResponse:
    return RedirectResponse(url=_kakao_svc.get_auth_url())


@auth_router.get("/kakao/callback")
async def kakao_callback(
    code: str,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> RedirectResponse:
    frontend_url = config.FRONTEND_BASE_URL
    try:
        user_info = await _kakao_svc.get_user_info(code)
        result = await auth_service.social_login_or_signup(
            provider="kakao",
            social_id=user_info["social_id"],
            email=user_info.get("email"),
            nickname=user_info["nickname"],
        )
        access_token = str(result["tokens"]["access_token"])
        is_new = "true" if result["is_new"] else "false"
        return RedirectResponse(
            url=f"{frontend_url}/auth/social/callback?{urlencode({'token': access_token, 'is_new': is_new})}"
        )
    except Exception:
        return RedirectResponse(url=f"{frontend_url}/login?error=kakao_failed")


@auth_router.get("/naver")
async def naver_login() -> RedirectResponse:
    state = secrets.token_urlsafe(16)
    resp = RedirectResponse(url=_naver_svc.get_auth_url(state))
    resp.set_cookie(
        key=_NAVER_STATE_COOKIE,
        value=state,
        httponly=True,
        secure=config.ENV == Env.PROD,
        max_age=300,
    )
    return resp


@auth_router.get("/naver/callback")
async def naver_callback(
    code: str,
    state: str,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    naver_state: Annotated[str | None, Cookie(alias=_NAVER_STATE_COOKIE)] = None,
) -> RedirectResponse:
    frontend_url = config.FRONTEND_BASE_URL
    try:
        if naver_state and naver_state != state:
            return RedirectResponse(url=f"{frontend_url}/login?error=naver_state_mismatch")
        user_info = await _naver_svc.get_user_info(code, state)
        result = await auth_service.social_login_or_signup(
            provider="naver",
            social_id=user_info["social_id"],
            email=user_info.get("email"),
            nickname=user_info["nickname"],
        )
        access_token = str(result["tokens"]["access_token"])
        is_new = "true" if result["is_new"] else "false"
        resp = RedirectResponse(
            url=f"{frontend_url}/auth/social/callback?{urlencode({'token': access_token, 'is_new': is_new})}"
        )
        resp.delete_cookie(_NAVER_STATE_COOKIE)
        return resp
    except Exception:
        return RedirectResponse(url=f"{frontend_url}/login?error=naver_failed")
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
