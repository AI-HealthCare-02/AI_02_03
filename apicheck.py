import json

import psycopg2
import requests

BASE_URL = "http://localhost:8000/api/v1"

# ================================================================
# DB 연결 설정
# ================================================================
DB_CONFIG = {"host": "localhost", "port": 5432, "user": "postgres", "password": "postgres123", "dbname": "liver_db"}


def get_db():
    return psycopg2.connect(**DB_CONFIG)


def delete_dummy_data(email: str):
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        row = cur.fetchone()
        if not row:
            print("\n⚠️ 삭제할 유저를 찾을 수 없습니다.")
            return
        user_id = row[0]
        tables = [
            "challenge_logs",
            "user_challenges",
            "medication_completions",
            "medications",
            "appointments",
            "daily_health_logs",
            "user_badges",
            "notification_settings",
            "health_surveys",
            "predictions",
            "food_logs",
            "reminders",
        ]
        for table in tables:
            try:
                cur.execute(f"DELETE FROM {table} WHERE user_id = %s", (user_id,))
            except Exception:
                conn.rollback()
        cur.execute("DELETE FROM users WHERE id = %s", (user_id,))
        conn.commit()
        print(f"🗑️  더미데이터 삭제 완료! (email: {email})")
    except Exception as e:
        print(f"⚠️ 더미데이터 삭제 중 오류: {e}")
    finally:
        cur.close()
        conn.close()


# ================================================================
# 헬퍼 함수
# ================================================================
results = []


def safe_request(method, url, **kwargs):
    """500 에러 및 서버 꺼짐 처리"""
    try:
        res = getattr(requests, method)(url, timeout=5, **kwargs)

        # 500 에러 감지
        if res.status_code >= 500:
            print(f"\n🚨 서버 내부 오류 감지! ({res.status_code})")
            print(f"   URL: {url}")
            try:
                print(f"   상세: {res.json()}")
            except Exception:
                print(f"   상세: {res.text[:200]}")

        return res

    except requests.exceptions.ConnectionError:
        print(f"\n🔴 서버가 꺼져있습니다! 연결 실패")
        print(f"   URL: {url}")
        print(f"   → uvicorn app.main:app 으로 서버를 켜주세요!")
        exit(1)

    except requests.exceptions.Timeout:
        print(f"\n⏱️ 서버 응답 시간 초과! (5초)")
        print(f"   URL: {url}")
        print(f"   → 서버가 느리거나 Redis 연결 문제일 수 있어요!")
        exit(1)

    except requests.exceptions.RequestException as e:
        print(f"\n⚠️ 요청 오류: {e}")
        exit(1)


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
    return success


def input_with_default(prompt, default):
    value = input(f"{prompt} (기본값: {default}): ").strip()
    return value if value else default


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
# 서버 상태 체크
# ================================================================
print("🔍 서버 상태 확인 중...")
try:
    requests.get(f"http://localhost:8000/docs", timeout=3)
    print("✅ 서버 정상 작동 중!\n")
except requests.exceptions.ConnectionError:
    print("🔴 서버가 꺼져있습니다!")
    print("   → uvicorn app.main:app 으로 서버를 켜주세요!")
    exit(1)
except requests.exceptions.Timeout:
    print("⏱️ 서버 응답 시간 초과!")
    exit(1)


# ================================================================
# 입력
# ================================================================
print("※ 회원가입 정보를 입력해주세요")
email = input("이메일: ").strip()
password = input("비밀번호: ").strip()
nickname = input("닉네임: ").strip()
new_nickname = input_with_default("새 닉네임", f"{nickname}_수정")
hospital_name = input_with_default("병원명", "서울병원")
visit_date = input_with_default("방문날짜 (예: 2025-06-01T10:00:00)", "2025-06-01T10:00:00")
memo = input_with_default("메모", "정기검진")
challenge_title = input_with_default("챌린지 이름", "매일 물 2L 마시기")
challenge_desc = input_with_default("설명", "건강을 위해!")
challenge_category = input_with_default("카테고리", "건강")
challenge_days = input_with_default("기간 (일)", "30")
log_year = input_with_default("조회 연도", "2025")
log_month = input_with_default("조회 월 (1-12)", "5")
log_date = input_with_default("로그 날짜 (예: 2025-05-01)", "2025-05-01")
weight = input_with_default("체중 (kg)", "70.5")
exercise_duration = input_with_default("운동 시간 (분)", "30")
alcohol_amount = input_with_default("음주량 (잔)", "0")
smoking_amount = input_with_default("흡연량 (개)", "0")
med_name = input_with_default("약 이름", "혈압약")
med_dosage = input_with_default("용량", "1정")
med_times = input_with_default("복용 시간 (예: 08:00,12:00,18:00)", "08:00")
challenge_noti = input_with_default("챌린지 알림 (true/false)", "true")
prediction_noti = input_with_default("예측 알림 (true/false)", "true")
age = input_with_default("나이", "30")
gender = input_with_default("성별 (male/female)", "male")
height = input_with_default("키 (cm)", "170")
weight_survey = input_with_default("체중 (kg)", "70")
waist = input_with_default("허리둘레 (cm)", "80")
drinking = input_with_default("음주여부 (음주안함/가끔음주/자주음주)", "음주안함")
exercise = input_with_default("운동여부 (운동안함/가끔운동/자주운동)", "운동안함")
smoking = input_with_default("흡연여부 (비흡연/과거흡연/현재흡연)", "비흡연")
sleep_hours = input_with_default("수면시간 (시간)", "7")
sleep_disorder = input_with_default("수면장애 (없음/있음)", "없음")
diabetes = input_with_default("당뇨 (없음/있음)", "없음")
hypertension = input_with_default("고혈압 (없음/있음)", "없음")

print("\n테스트 실행 중...")

# ================================================================
# 테스트 실행
# ================================================================

# 🔐 AUTH
res = safe_request("post", f"{BASE_URL}/auth/signup", json={"email": email, "password": password, "nickname": nickname})
run_test("회원가입", res, 201)

res = safe_request("post", f"{BASE_URL}/auth/login", json={"email": email, "password": password})
run_test("로그인 성공", res, 200)
token = res.json().get("access_token", "") if res.status_code == 200 else ""
headers = {"Authorization": f"Bearer {token}"}

res = safe_request("post", f"{BASE_URL}/auth/login", json={"email": email, "password": "WrongPassword!"})
run_test("로그인 실패 - 비밀번호 오류", res, 401)

res = safe_request("get", f"{BASE_URL}/auth/check-email?email={email}")
run_test("이메일 중복 확인 - 중복", res, 409)

res = safe_request("get", f"{BASE_URL}/auth/check-nickname?nickname={nickname}")
run_test("닉네임 중복 확인 - 중복", res, 409)

res = safe_request("post", f"{BASE_URL}/auth/logout")
run_test("로그아웃", res, 200)

res = safe_request("get", f"{BASE_URL}/auth/token/refresh")
run_test("토큰 갱신 실패 - refresh_token 없음", res, 401)

# 👤 USER
res = safe_request("get", f"{BASE_URL}/users/me", headers=headers)
run_test("내 정보 조회", res, 200)

res = safe_request("get", f"{BASE_URL}/users/me")
run_test("내 정보 조회 실패 - 토큰 없음", res, 401)

res = safe_request("patch", f"{BASE_URL}/users/me", headers=headers, json={"nickname": new_nickname})
run_test("유저 정보 수정", res, 200)

# 📅 APPOINTMENT
res = safe_request(
    "post",
    f"{BASE_URL}/appointments",
    headers=headers,
    json={"hospital_name": hospital_name, "visit_date": visit_date, "memo": memo},
)
run_test("진료 예약 생성", res, 201)
appointment_id = res.json().get("id") if res.status_code == 201 else None

res = safe_request("get", f"{BASE_URL}/appointments/me", headers=headers)
run_test("예약 목록 조회", res, 200)

res = safe_request("delete", f"{BASE_URL}/appointments/99999", headers=headers)
run_test("예약 삭제 실패 - 없는 예약", res, 404)

if appointment_id:
    res = safe_request("delete", f"{BASE_URL}/appointments/{appointment_id}", headers=headers)
    run_test("예약 삭제 성공", res, 200)

# 🏆 BADGE
res = safe_request("get", f"{BASE_URL}/badges/me", headers=headers)
run_test("내 뱃지 목록", res, 200)

res = safe_request("get", f"{BASE_URL}/badges/me/count", headers=headers)
run_test("내 뱃지 개수", res, 200)

# 🎯 CHALLENGE
res = safe_request("get", f"{BASE_URL}/challenges", headers=headers)
run_test("챌린지 목록", res, 200)

res = safe_request("post", f"{BASE_URL}/challenges/99999/join", headers=headers)
run_test("챌린지 참여 실패 - 없는 챌린지", res, 404)

res = safe_request(
    "post",
    f"{BASE_URL}/challenges/custom",
    headers=headers,
    json={
        "title": challenge_title,
        "description": challenge_desc,
        "category": challenge_category,
        "duration_days": int(challenge_days),
    },
)
run_test("커스텀 챌린지 생성", res, 201)

# 📋 HEALTH LOG
res = safe_request("get", f"{BASE_URL}/health-logs/me?year={log_year}&month={log_month}", headers=headers)
run_test("건강 로그 조회", res, 200)

res = safe_request("get", f"{BASE_URL}/health-logs/me?year=2025&month=13", headers=headers)
run_test("건강 로그 조회 실패 - 잘못된 month", res, 422)

res = safe_request(
    "post",
    f"{BASE_URL}/health-logs",
    headers=headers,
    json={
        "log_date": log_date,
        "weight": float(weight),
        "exercise_duration": int(exercise_duration),
        "alcohol_amount": float(alcohol_amount),
        "smoking_amount": int(smoking_amount),
    },
)
run_test("건강 로그 저장", res, 200)

# 💊 MEDICATION
res = safe_request(
    "post",
    f"{BASE_URL}/medications",
    headers=headers,
    json={"name": med_name, "dosage": med_dosage, "times": med_times.split(",")},
)
run_test("복약 생성", res, 201)
medication_id = res.json().get("id") if res.status_code == 201 else None

res = safe_request("get", f"{BASE_URL}/medications/me", headers=headers)
run_test("복약 목록", res, 200)

if medication_id:
    res = safe_request("delete", f"{BASE_URL}/medications/{medication_id}", headers=headers)
    run_test("복약 삭제 성공", res, 200)

res = safe_request("delete", f"{BASE_URL}/medications/99999", headers=headers)
run_test("복약 삭제 실패 - 없는 복약", res, 404)

# 🔔 NOTIFICATION
res = safe_request("get", f"{BASE_URL}/notifications/settings", headers=headers)
run_test("알림 설정 조회", res, 200)

res = safe_request(
    "put",
    f"{BASE_URL}/notifications/settings",
    headers=headers,
    json={
        "challenge_notification": challenge_noti.lower() == "true",
        "prediction_notification": prediction_noti.lower() == "true",
    },
)
run_test("알림 설정 수정", res, 200)

# 📊 SURVEY
res = safe_request(
    "post",
    f"{BASE_URL}/surveys",
    headers=headers,
    json={
        "age": int(age),
        "gender": gender,
        "height": float(height),
        "weight": float(weight_survey),
        "waist": float(waist),
        "drinking": drinking,
        "drink_amount": 0.0,
        "weekly_drink_freq": 0.0,
        "exercise": exercise,
        "weekly_exercise_count": 0,
        "smoking": smoking,
        "current_smoking": "안함",
        "sleep_hours": float(sleep_hours),
        "sleep_disorder": sleep_disorder,
        "diet_questions": [1, 1, 1, 1, 1, 1, 1],
        "diabetes": diabetes,
        "hypertension": hypertension,
    },
)
run_test("설문 생성", res, 201)

res = safe_request("get", f"{BASE_URL}/surveys/me", headers=headers)
run_test("설문 조회", res, 200)

# 🤖 PREDICTION
res = safe_request("post", f"{BASE_URL}/predictions", headers=headers)
run_test("건강 예측 생성", res, 200)

res = safe_request("get", f"{BASE_URL}/predictions/me", headers=headers)
run_test("예측 목록 조회", res, 200)

# 📈 ACTIVITY
res = safe_request("get", f"{BASE_URL}/activity/me", headers=headers)
run_test("활동 조회", res, 200)

# 🏠 DASHBOARD
res = safe_request("get", f"{BASE_URL}/dashboard", headers=headers)
run_test("대시보드 조회", res, 200)

# ================================================================
# 📊 결과 요약
# ================================================================
print_summary()

# ================================================================
# 🗑️ 더미데이터 삭제
# ================================================================
print()
delete_yn = input("더미데이터를 삭제하시겠습니까? (y/n): ").strip().lower()
if delete_yn == "y":
    delete_dummy_data(email)
else:
    print("더미데이터를 유지합니다.")