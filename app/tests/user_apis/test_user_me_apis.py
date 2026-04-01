import pytest
from httpx import AsyncClient
from starlette import status


@pytest.mark.asyncio
async def test_get_user_me_success(client: AsyncClient):
    email = "me@example.com"
    signup_data = {
        "email": email,
        "password": "Password123!",
        "nickname": "내정보테스터",
    }
    await client.post("/api/v1/auth/signup", json=signup_data)

    login_response = await client.post("/api/v1/auth/login", json={"email": email, "password": "Password123!"})
    access_token = login_response.json()["access_token"]

    headers = {"Authorization": f"Bearer {access_token}"}
    response = await client.get("/api/v1/users/me", headers=headers)

    assert response.status_code == status.HTTP_200_OK
    assert response.json()["email"] == email
    assert response.json()["nickname"] == "내정보테스터"


@pytest.mark.asyncio
async def test_update_user_me_success(client: AsyncClient):
    email = "update_me@example.com"
    signup_data = {
        "email": email,
        "password": "Password123!",
        "nickname": "수정전",
    }
    update_data = {"nickname": "수정후"}
    await client.post("/api/v1/auth/signup", json=signup_data)

    login_response = await client.post("/api/v1/auth/login", json={"email": email, "password": "Password123!"})
    access_token = login_response.json()["access_token"]

    headers = {"Authorization": f"Bearer {access_token}"}
    response = await client.patch("/api/v1/users/me", json=update_data, headers=headers)

    assert response.status_code == status.HTTP_200_OK
    assert response.json()["nickname"] == "수정후"


@pytest.mark.asyncio
async def test_get_user_me_unauthorized(client: AsyncClient):
    response = await client.get("/api/v1/users/me")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
