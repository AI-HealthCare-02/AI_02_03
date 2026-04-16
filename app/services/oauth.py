"""카카오·네이버 OAuth2 소셜 로그인 서비스"""

import httpx

from app.core import config


class KakaoOAuthService:
    AUTH_URL = "https://kauth.kakao.com/oauth/authorize"
    TOKEN_URL = "https://kauth.kakao.com/oauth/token"
    USER_INFO_URL = "https://kapi.kakao.com/v2/user/me"

    def get_auth_url(self) -> str:
        params = {
            "client_id": config.KAKAO_CLIENT_ID,
            "redirect_uri": config.KAKAO_REDIRECT_URI,
            "response_type": "code",
        }
        query = "&".join(f"{k}={v}" for k, v in params.items())
        return f"{self.AUTH_URL}?{query}"

    async def get_user_info(self, code: str) -> dict:
        """code → access_token → 사용자 정보 반환"""
        async with httpx.AsyncClient() as client:
            # 1. access_token 교환
            token_resp = await client.post(
                self.TOKEN_URL,
                data={
                    "grant_type": "authorization_code",
                    "client_id": config.KAKAO_CLIENT_ID,
                    "client_secret": config.KAKAO_CLIENT_SECRET,
                    "redirect_uri": config.KAKAO_REDIRECT_URI,
                    "code": code,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            token_resp.raise_for_status()
            access_token = token_resp.json()["access_token"]

            # 2. 사용자 정보 조회
            info_resp = await client.get(
                self.USER_INFO_URL,
                headers={"Authorization": f"Bearer {access_token}"},
            )
            info_resp.raise_for_status()
            data = info_resp.json()

        social_id = str(data["id"])
        kakao_account = data.get("kakao_account", {})
        email = kakao_account.get("email")
        nickname = kakao_account.get("profile", {}).get("nickname") or data.get("properties", {}).get("nickname") or "카카오유저"

        return {"social_id": social_id, "email": email, "nickname": nickname}


class NaverOAuthService:
    AUTH_URL = "https://nid.naver.com/oauth2.0/authorize"
    TOKEN_URL = "https://nid.naver.com/oauth2.0/token"
    USER_INFO_URL = "https://openapi.naver.com/v1/nid/me"

    def get_auth_url(self, state: str) -> str:
        params = {
            "client_id": config.NAVER_CLIENT_ID,
            "redirect_uri": config.NAVER_REDIRECT_URI,
            "response_type": "code",
            "state": state,
        }
        query = "&".join(f"{k}={v}" for k, v in params.items())
        return f"{self.AUTH_URL}?{query}"

    async def get_user_info(self, code: str, state: str) -> dict:
        """code → access_token → 사용자 정보 반환"""
        async with httpx.AsyncClient() as client:
            # 1. access_token 교환
            token_resp = await client.get(
                self.TOKEN_URL,
                params={
                    "grant_type": "authorization_code",
                    "client_id": config.NAVER_CLIENT_ID,
                    "client_secret": config.NAVER_CLIENT_SECRET,
                    "redirect_uri": config.NAVER_REDIRECT_URI,
                    "code": code,
                    "state": state,
                },
            )
            token_resp.raise_for_status()
            access_token = token_resp.json()["access_token"]

            # 2. 사용자 정보 조회
            info_resp = await client.get(
                self.USER_INFO_URL,
                headers={"Authorization": f"Bearer {access_token}"},
            )
            info_resp.raise_for_status()
            profile = info_resp.json().get("response", {})

        social_id = str(profile.get("id", ""))
        email = profile.get("email")
        nickname = profile.get("nickname") or profile.get("name") or "네이버유저"

        return {"social_id": social_id, "email": email, "nickname": nickname}
