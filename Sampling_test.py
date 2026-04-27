import json

import psycopg2
import requests

BASE_URL = "http://localhost:8000/api/v1"

DB_CONFIG = {"host": "localhost", "port": 5432, "user": "postgres", "password": "postgres123", "dbname": "liver_db"}


# ================================================================
# DB 샘플링
# ================================================================
def get_random_user():
    """DB에서 랜덤 유저 1명 가져오기"""
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    cur.execute("SELECT id, email FROM users ORDER BY RANDOM() LIMIT 1")
    row = cur.fetchone()
    cur.close()
    conn.close()
    return {"id": row[0], "email": row[1]}


def get_random_challenge():
    """DB에서 랜덤 챌린지 가져오기"""
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    cur.execute("SELECT id, name FROM challenges ORDER BY RANDOM() LIMIT 1")
    row = cur.fetchone()
    cur.close()
    conn.close()
    return {"id": row[0], "name": row[1]}


# ================================================================
# 헬퍼
# ================================================================
results = []


def run_test(label, response, expected_status):
    success = response.status_code == expected_status
    results.append(
        {
            "label": label,
            "success": success,
            "status": response.status_code,
            "expected": expected_status,
            "response": response.text,
        }
    )
    emoji = "✅" if success else "❌"
    print(f"{emoji} {label} ({response.status_code})")
    return success


def print_summary():
    total = len(results)
    success = sum(1 for r in results if r["success"])
    failed = [r for r in results if not r["success"]]

    print(f"\n{'=' * 55}")
    print(f"📊 테스트 결과: 전체 {total}개 중 {success}개 성공 ✅")
    if failed:
        print(f"\n❌ 실패한 테스트 ({len(failed)}개):")
        for r in failed:
            print(f"  - {r['label']} | 예상: {r['expected']} / 실제: {r['status']}")
            try:
                body = json.loads(r["response"])
                detail = body.get("detail", r["response"])
                print(f"    → {detail}")
            except Exception:
                print(f"    → {r['response'][:100]}")
    else:
        print("🎉 모든 테스트 통과!")
    print("=" * 55)


# ================================================================
# DB에서 랜덤 유저 선택
# ================================================================
print("🎲 DB에서 랜덤 유저 샘플링 중...")
user = get_random_user()
challenge = get_random_challenge()
print(f"선택된 유저: {user['email']} (id: {user['id']})")
print(f"선택된 챌린지: {challenge['name']} (id: {challenge['id']})\n")

# 로그인
res = requests.post(f"{BASE_URL}/auth/login", json={"email": user["email"], "password": "Test1234!"})
if res.status_code != 200:
    print("❌ 로그인 실패! 테스트 종료")
    exit()

token = res.json().get("access_token", "")
headers = {"Authorization": f"Bearer {token}"}
print("✅ 로그인 성공! 테스트 시작...\n")

print("테스트 실행 중...")

# ================================================================
# ✅ 정상 케이스 테스트
# ================================================================

# 내 정보 조회
res = requests.get(f"{BASE_URL}/users/me", headers=headers)
run_test("[정상] 내 정보 조회", res, 200)

# 챌린지 참여 (DB에서 랜덤으로 뽑은 챌린지)
res = requests.post(f"{BASE_URL}/challenges/{challenge['id']}/join", headers=headers)
run_test(f"[정상] 챌린지 참여 (id:{challenge['id']} {challenge['name']})", res, 201)

# 건강 로그 저장
res = requests.post(
    f"{BASE_URL}/health-logs",
    headers=headers,
    json={"log_date": "2025-06-01", "weight": 70.5, "exercise_duration": 30, "alcohol_amount": 0, "smoking_amount": 0},
)
run_test("[정상] 건강 로그 저장", res, 200)

# 복약 생성
res = requests.post(
    f"{BASE_URL}/medications", headers=headers, json={"name": "혈압약", "dosage": "1정", "times": ["08:00"]}
)
run_test("[정상] 복약 생성", res, 201)

# 알림 설정 조회
res = requests.get(f"{BASE_URL}/notifications/settings", headers=headers)
run_test("[정상] 알림 설정 조회", res, 200)

# 설문 조회
res = requests.get(f"{BASE_URL}/surveys/me", headers=headers)
run_test("[정상] 설문 조회", res, 200)


# ================================================================
# ❌ 경계값/예상치 못한 값 테스트
# ================================================================

# 아주 긴 닉네임
res = requests.patch(f"{BASE_URL}/users/me", headers=headers, json={"nickname": "닉" * 100})
run_test("[경계값] 아주 긴 닉네임 (100글자)", res, 422)

# 음수 체중
res = requests.post(
    f"{BASE_URL}/health-logs",
    headers=headers,
    json={"log_date": "2025-06-02", "weight": -999, "exercise_duration": 30, "alcohol_amount": 0, "smoking_amount": 0},
)
run_test("[경계값] 음수 체중 (-999)", res, 422)

# 아주 큰 체중
res = requests.post(
    f"{BASE_URL}/health-logs",
    headers=headers,
    json={"log_date": "2025-06-03", "weight": 99999, "exercise_duration": 30, "alcohol_amount": 0, "smoking_amount": 0},
)
run_test("[경계값] 아주 큰 체중 (99999)", res, 422)

# 잘못된 날짜 형식
res = requests.post(
    f"{BASE_URL}/health-logs",
    headers=headers,
    json={"log_date": "not-a-date", "weight": 70.5, "exercise_duration": 30, "alcohol_amount": 0, "smoking_amount": 0},
)
run_test("[경계값] 잘못된 날짜 형식", res, 422)

# 빈 약 이름
res = requests.post(f"{BASE_URL}/medications", headers=headers, json={"name": "", "dosage": "1정", "times": ["08:00"]})
run_test("[경계값] 빈 약 이름", res, 422)

# 특수문자 닉네임
res = requests.patch(f"{BASE_URL}/users/me", headers=headers, json={"nickname": "!@#$%^&*()"})
run_test("[경계값] 특수문자 닉네임", res, 422)

# 없는 챌린지 참여
res = requests.post(f"{BASE_URL}/challenges/999999/join", headers=headers)
run_test("[경계값] 없는 챌린지 참여", res, 404)

# 잘못된 월 값
res = requests.get(f"{BASE_URL}/health-logs/me?year=2025&month=99", headers=headers)
run_test("[경계값] 잘못된 월 (99)", res, 422)

# 음수 운동 시간
res = requests.post(
    f"{BASE_URL}/health-logs",
    headers=headers,
    json={
        "log_date": "2025-06-04",
        "weight": 70.5,
        "exercise_duration": -100,
        "alcohol_amount": 0,
        "smoking_amount": 0,
    },
)
run_test("[경계값] 음수 운동 시간 (-100)", res, 422)

# 이상한 성별 값으로 설문
res = requests.post(
    f"{BASE_URL}/surveys",
    headers=headers,
    json={
        "age": 30,
        "gender": "alien",
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
run_test("[경계값] 이상한 성별 값 (alien) - 이미 설문 완료", res, 409)

# 토큰 없이 요청
res = requests.get(f"{BASE_URL}/users/me")
run_test("[경계값] 토큰 없이 요청", res, 401)

# 잘못된 토큰
res = requests.get(f"{BASE_URL}/users/me", headers={"Authorization": "Bearer wrongtoken"})
run_test("[경계값] 잘못된 토큰", res, 401)


# ================================================================
# 📊 결과 요약
# ================================================================
print_summary()
