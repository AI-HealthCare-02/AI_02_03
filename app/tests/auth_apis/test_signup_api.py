import pytest
from httpx import AsyncClient
from starlette import status


@pytest.mark.asyncio
async def test_signup_success(client: AsyncClient):
    signup_data = {
        "email": "test@example.com",
        "password": "Password123!",
        "nickname": "테스터",
    }
    response = await client.post("/api/v1/auth/signup", json=signup_data)
    assert response.status_code == status.HTTP_201_CREATED
    assert response.json() == {"detail": "회원가입이 성공적으로 완료되었습니다."}


@pytest.mark.asyncio
async def test_signup_invalid_email(client: AsyncClient):
    signup_data = {
        "email": "invalid-email",
        "password": "password123!",
        "nickname": "테스터",
    }
    response = await client.post("/api/v1/auth/signup", json=signup_data)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
