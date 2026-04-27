import pytest
from httpx import AsyncClient

# ================================================================
# 테스트 실행 방법:
# 1. pip install httpx pytest pytest-asyncio
# 2. pytest app/tests/test_all.py -s -v
# ================================================================

BASE_URL = "http://test"

# ================================================================
# 🔐 AUTH (인증)
# ================================================================


@pytest.mark.asyncio
async def test_signup_success(client: AsyncClient):
    """✅ 회원가입 성공"""
    response = await client.post(
        "/api/v1/auth/signup", json={"email": "testuser@example.com", "password": "Test1234!", "nickname": "테스터"}
    )
    print("✅ 회원가입 성공:", response.status_code, response.json())
    assert response.status_code == 201


@pytest.mark.asyncio
async def test_signup_duplicate_email(client: AsyncClient):
    """❌ 회원가입 실패 - 중복 이메일"""
    await client.post(
        "/api/v1/auth/signup", json={"email": "dup@example.com", "password": "Test1234!", "nickname": "중복유저"}
    )
    response = await client.post(
        "/api/v1/auth/signup", json={"email": "dup@example.com", "password": "Test1234!", "nickname": "중복유저2"}
    )
    print("❌ 중복 이메일:", response.status_code, response.json())
    assert response.status_code in [409, 400]


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    """✅ 로그인 성공"""
    await client.post(
        "/api/v1/auth/signup", json={"email": "login@example.com", "password": "Test1234!", "nickname": "로그인유저"}
    )
    response = await client.post("/api/v1/auth/login", json={"email": "login@example.com", "password": "Test1234!"})
    print("✅ 로그인 성공:", response.status_code, response.json())
    assert response.status_code == 200
    assert "access_token" in response.json()


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    """❌ 로그인 실패 - 비밀번호 오류"""
    response = await client.post(
        "/api/v1/auth/login", json={"email": "login@example.com", "password": "WrongPassword!"}
    )
    print("❌ 비밀번호 오류:", response.status_code, response.json())
    assert response.status_code in [400, 401]


@pytest.mark.asyncio
async def test_check_email_available(client: AsyncClient):
    """✅ 이메일 중복 확인 - 사용 가능"""
    response = await client.get("/api/v1/auth/check-email?email=new@example.com")
    print("✅ 이메일 사용 가능:", response.status_code, response.json())
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_check_nickname_duplicate(client: AsyncClient):
    """❌ 닉네임 중복 확인 - 이미 사용중"""
    await client.post(
        "/api/v1/auth/signup", json={"email": "nick@example.com", "password": "Test1234!", "nickname": "중복닉네임"}
    )
    response = await client.get("/api/v1/auth/check-nickname?nickname=중복닉네임")
    print("❌ 닉네임 중복:", response.status_code, response.json())
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_logout(client: AsyncClient):
    """✅ 로그아웃"""
    response = await client.post("/api/v1/auth/logout")
    print("✅ 로그아웃:", response.status_code, response.json())
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_token_refresh_no_cookie(client: AsyncClient):
    """❌ 토큰 갱신 실패 - refresh_token 없음"""
    response = await client.get("/api/v1/auth/token/refresh")
    print("❌ 토큰 갱신 실패:", response.status_code, response.json())
    assert response.status_code == 401


# ================================================================
# 👤 USER (유저)
# ================================================================


async def get_token(client: AsyncClient) -> str:
    """테스트용 토큰 발급 헬퍼"""
    await client.post(
        "/api/v1/auth/signup", json={"email": "helper@example.com", "password": "Test1234!", "nickname": "헬퍼유저"}
    )
    response = await client.post("/api/v1/auth/login", json={"email": "helper@example.com", "password": "Test1234!"})
    return response.json().get("access_token", "")


@pytest.mark.asyncio
async def test_get_my_user_info(client: AsyncClient):
    """✅ 내 유저 정보 조회"""
    token = await get_token(client)
    response = await client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {token}"})
    print("✅ 내 정보 조회:", response.status_code, response.json())
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_get_my_user_info_no_token(client: AsyncClient):
    """❌ 내 유저 정보 조회 실패 - 토큰 없음"""
    response = await client.get("/api/v1/users/me")
    print("❌ 토큰 없음:", response.status_code, response.json())
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_update_user_info(client: AsyncClient):
    """✅ 유저 정보 수정"""
    token = await get_token(client)
    response = await client.patch(
        "/api/v1/users/me", headers={"Authorization": f"Bearer {token}"}, json={"nickname": "수정된닉네임"}
    )
    print("✅ 유저 정보 수정:", response.status_code, response.json())
    assert response.status_code == 200


# ================================================================
# 📅 APPOINTMENT (진료 예약)
# ================================================================


@pytest.mark.asyncio
async def test_create_appointment_success(client: AsyncClient):
    """✅ 진료 예약 생성 성공"""
    token = await get_token(client)
    response = await client.post(
        "/api/v1/appointments",
        headers={"Authorization": f"Bearer {token}"},
        json={"hospital_name": "서울병원", "visit_date": "2025-06-01T10:00:00", "memo": "정기검진"},
    )
    print("✅ 예약 생성:", response.status_code, response.json())
    assert response.status_code == 201


@pytest.mark.asyncio
async def test_get_my_appointments(client: AsyncClient):
    """✅ 내 예약 목록 조회"""
    token = await get_token(client)
    response = await client.get("/api/v1/appointments/me", headers={"Authorization": f"Bearer {token}"})
    print("✅ 예약 목록:", response.status_code, response.json())
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_delete_appointment_not_found(client: AsyncClient):
    """❌ 예약 삭제 실패 - 존재하지 않는 예약"""
    token = await get_token(client)
    response = await client.delete("/api/v1/appointments/99999", headers={"Authorization": f"Bearer {token}"})
    print("❌ 예약 없음:", response.status_code, response.json())
    assert response.status_code == 404


# ================================================================
# 🏆 BADGE (뱃지)
# ================================================================


@pytest.mark.asyncio
async def test_get_my_badges(client: AsyncClient):
    """✅ 내 뱃지 목록 조회"""
    token = await get_token(client)
    response = await client.get("/api/v1/badges/me", headers={"Authorization": f"Bearer {token}"})
    print("✅ 뱃지 목록:", response.status_code, response.json())
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_get_my_badge_count(client: AsyncClient):
    """✅ 내 뱃지 개수 조회"""
    token = await get_token(client)
    response = await client.get("/api/v1/badges/me/count", headers={"Authorization": f"Bearer {token}"})
    print("✅ 뱃지 개수:", response.status_code, response.json())
    assert response.status_code == 200


# ================================================================
# 🎯 CHALLENGE (챌린지)
# ================================================================


@pytest.mark.asyncio
async def test_get_challenges(client: AsyncClient):
    """✅ 챌린지 목록 조회"""
    token = await get_token(client)
    response = await client.get("/api/v1/challenges", headers={"Authorization": f"Bearer {token}"})
    print("✅ 챌린지 목록:", response.status_code, response.json())
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_join_challenge_not_found(client: AsyncClient):
    """❌ 챌린지 참여 실패 - 없는 챌린지"""
    token = await get_token(client)
    response = await client.post("/api/v1/challenges/99999/join", headers={"Authorization": f"Bearer {token}"})
    print("❌ 챌린지 없음:", response.status_code, response.json())
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_create_custom_challenge(client: AsyncClient):
    """✅ 커스텀 챌린지 생성"""
    token = await get_token(client)
    response = await client.post(
        "/api/v1/challenges/custom",
        headers={"Authorization": f"Bearer {token}"},
        json={"title": "매일 물 2L 마시기", "description": "건강을 위해!", "category": "건강", "duration_days": 30},
    )
    print("✅ 커스텀 챌린지 생성:", response.status_code, response.json())
    assert response.status_code == 201


# ================================================================
# 📋 HEALTH LOG (건강 로그)
# ================================================================


@pytest.mark.asyncio
async def test_get_my_health_logs(client: AsyncClient):
    """✅ 건강 로그 조회"""
    token = await get_token(client)
    response = await client.get(
        "/api/v1/health-logs/me?year=2025&month=5", headers={"Authorization": f"Bearer {token}"}
    )
    print("✅ 건강 로그 조회:", response.status_code, response.json())
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_get_health_logs_invalid_month(client: AsyncClient):
    """❌ 건강 로그 조회 실패 - 잘못된 month 값"""
    token = await get_token(client)
    response = await client.get(
        "/api/v1/health-logs/me?year=2025&month=13", headers={"Authorization": f"Bearer {token}"}
    )
    print("❌ 잘못된 month:", response.status_code, response.json())
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_upsert_health_log(client: AsyncClient):
    """✅ 건강 로그 생성/수정"""
    token = await get_token(client)
    response = await client.post(
        "/api/v1/health-logs",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "log_date": "2025-05-01",
            "weight": 70.5,
            "exercise_duration": 30,
            "alcohol_amount": 0,
            "smoking_amount": 0,
        },
    )
    print("✅ 건강 로그 저장:", response.status_code, response.json())
    assert response.status_code == 200


# ================================================================
# 💊 MEDICATION (복약)
# ================================================================


@pytest.mark.asyncio
async def test_create_medication(client: AsyncClient):
    """✅ 복약 정보 생성"""
    token = await get_token(client)
    response = await client.post(
        "/api/v1/medications",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "혈압약", "dosage": "1정", "times": ["08:00"]},
    )
    print("✅ 복약 생성:", response.status_code, response.json())
    assert response.status_code == 201


@pytest.mark.asyncio
async def test_get_my_medications(client: AsyncClient):
    """✅ 내 복약 목록 조회"""
    token = await get_token(client)
    response = await client.get("/api/v1/medications/me", headers={"Authorization": f"Bearer {token}"})
    print("✅ 복약 목록:", response.status_code, response.json())
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_delete_medication_not_found(client: AsyncClient):
    """❌ 복약 삭제 실패 - 없는 복약"""
    token = await get_token(client)
    response = await client.delete("/api/v1/medications/99999", headers={"Authorization": f"Bearer {token}"})
    print("❌ 복약 없음:", response.status_code, response.json())
    assert response.status_code == 404


# ================================================================
# 🔔 NOTIFICATION (알림)
# ================================================================


@pytest.mark.asyncio
async def test_get_notification_settings(client: AsyncClient):
    """✅ 알림 설정 조회"""
    token = await get_token(client)
    response = await client.get("/api/v1/notifications/settings", headers={"Authorization": f"Bearer {token}"})
    print("✅ 알림 설정:", response.status_code, response.json())
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_update_notification_settings(client: AsyncClient):
    """✅ 알림 설정 수정"""
    token = await get_token(client)
    response = await client.put(
        "/api/v1/notifications/settings",
        headers={"Authorization": f"Bearer {token}"},
        json={"push_enabled": True, "email_enabled": False},
    )
    print("✅ 알림 설정 수정:", response.status_code, response.json())
    assert response.status_code == 200


# ================================================================
# 📊 SURVEY (설문)
# ================================================================


@pytest.mark.asyncio
async def test_create_survey(client: AsyncClient):
    """✅ 설문 생성"""
    token = await get_token(client)
    response = await client.post(
        "/api/v1/surveys",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "age": 30,
            "gender": "male",
            "height": 170.0,
            "weight": 70.0,
            "waist": 80.0,
            "drinking": "음주안함",
            "drink_amount": 0.0,
            "weekly_drink_freq": 0.0,
            "exercise": "운동안함",
            "weekly_exercise_count": 0,
            "smoking": "비흡연",
            "current_smoking": "안함",
            "sleep_hours": 7.0,
            "sleep_disorder": "없음",
            "diet_questions": [1, 1, 1, 1, 1, 1, 1],
            "diabetes": "없음",
            "hypertension": "없음",
        },
    )
    print("✅ 설문 생성:", response.status_code, response.json())
    assert response.status_code == 201


@pytest.mark.asyncio
async def test_get_my_survey(client: AsyncClient):
    """✅ 내 설문 조회"""
    token = await get_token(client)
    response = await client.get("/api/v1/surveys/me", headers={"Authorization": f"Bearer {token}"})
    print("✅ 설문 조회:", response.status_code, response.json())
    assert response.status_code in [200, 404]


# ================================================================
# 🤖 PREDICTION (예측)
# ================================================================


@pytest.mark.asyncio
async def test_create_prediction_no_survey(client: AsyncClient):
    """❌ 예측 생성 실패 - 설문 없음"""
    token = await get_token(client)
    response = await client.post("/api/v1/predictions", headers={"Authorization": f"Bearer {token}"})
    print("❌ 설문 없어 예측 불가:", response.status_code, response.json())
    assert response.status_code in [400, 404]


@pytest.mark.asyncio
async def test_get_my_predictions(client: AsyncClient):
    """✅ 내 예측 목록 조회"""
    token = await get_token(client)
    response = await client.get("/api/v1/predictions/me", headers={"Authorization": f"Bearer {token}"})
    print("✅ 예측 목록:", response.status_code, response.json())
    assert response.status_code == 200


# ================================================================
# 📈 ACTIVITY (활동)
# ================================================================


@pytest.mark.asyncio
async def test_get_my_activity(client: AsyncClient):
    """✅ 내 활동 조회"""
    token = await get_token(client)
    response = await client.get("/api/v1/activity/me", headers={"Authorization": f"Bearer {token}"})
    print("✅ 활동 조회:", response.status_code, response.json())
    assert response.status_code == 200


# ================================================================
# 🏠 DASHBOARD (대시보드)
# ================================================================


@pytest.mark.asyncio
async def test_get_dashboard_no_prediction(client: AsyncClient):
    """❌ 대시보드 조회 실패 - 예측 없음"""
    token = await get_token(client)
    response = await client.get("/api/v1/dashboard", headers={"Authorization": f"Bearer {token}"})
    print("❌ 예측 없어 대시보드 불가:", response.status_code, response.json())
    assert response.status_code == 404
