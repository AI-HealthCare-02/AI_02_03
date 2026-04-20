import json
import requests

BASE_URL = "http://localhost:8000/api/v1"

# ================================================================
# 헬퍼 함수
# ================================================================

def print_result(label, response):
    emoji = "✅" if response.status_code < 400 else "❌"
    print(f"\n{'='*55}")
    print(f"{emoji} {label}")
    print(f"상태코드: {response.status_code}")
    try:
        print(f"응답: {json.dumps(response.json(), ensure_ascii=False, indent=2)}")
    except Exception:
        print(f"응답: {response.text}")
    print('='*55)


def input_with_default(prompt, default):
    """기본값 있는 입력 - 그냥 Enter 치면 기본값 사용"""
    value = input(f"{prompt} (기본값: {default}): ").strip()
    return value if value else default


# ================================================================
# 🔐 AUTH (인증)
# ================================================================
print("\n\n🔐 ===== AUTH =====")
print("※ 회원가입 정보를 입력해주세요")

email = input("이메일: ").strip()
password = input("비밀번호: ").strip()
nickname = input("닉네임: ").strip()

# ✅ 회원가입
res = requests.post(f"{BASE_URL}/auth/signup", json={
    "email": email,
    "password": password,
    "nickname": nickname
})
print_result("회원가입", res)

# ✅ 로그인
res = requests.post(f"{BASE_URL}/auth/login", json={
    "email": email,
    "password": password
})
print_result("로그인", res)
token = res.json().get("access_token", "")
headers = {"Authorization": f"Bearer {token}"}

# ❌ 로그인 실패 - 비밀번호 오류
res = requests.post(f"{BASE_URL}/auth/login", json={
    "email": email,
    "password": "WrongPassword!"
})
print_result("로그인 실패 - 비밀번호 오류", res)

# ✅ 이메일 중복 확인
res = requests.get(f"{BASE_URL}/auth/check-email?email={email}")
print_result("이메일 중복 확인", res)

# ✅ 닉네임 중복 확인
res = requests.get(f"{BASE_URL}/auth/check-nickname?nickname={nickname}")
print_result("닉네임 중복 확인", res)

# ✅ 로그아웃
res = requests.post(f"{BASE_URL}/auth/logout")
print_result("로그아웃", res)

# ❌ 토큰 갱신 실패
res = requests.get(f"{BASE_URL}/auth/token/refresh")
print_result("토큰 갱신 실패 - refresh_token 없음", res)


# ================================================================
# 👤 USER (유저)
# ================================================================
print("\n\n👤 ===== USER =====")

# ✅ 내 정보 조회
res = requests.get(f"{BASE_URL}/users/me", headers=headers)
print_result("내 정보 조회", res)

# ❌ 토큰 없이 조회
res = requests.get(f"{BASE_URL}/users/me")
print_result("내 정보 조회 실패 - 토큰 없음", res)

# ✅ 유저 정보 수정
print("\n※ 유저 정보 수정")
new_nickname = input_with_default("새 닉네임", f"{nickname}_수정")
res = requests.patch(f"{BASE_URL}/users/me", headers=headers,
    json={"nickname": new_nickname})
print_result("유저 정보 수정", res)


# ================================================================
# 📅 APPOINTMENT (진료 예약)
# ================================================================
print("\n\n📅 ===== APPOINTMENT =====")
print("※ 진료 예약 정보를 입력해주세요")

hospital_name = input_with_default("병원명", "서울병원")
visit_date = input_with_default("방문날짜 (예: 2025-06-01T10:00:00)", "2025-06-01T10:00:00")
memo = input_with_default("메모", "정기검진")

# ✅ 예약 생성
res = requests.post(f"{BASE_URL}/appointments", headers=headers,
    json={
        "hospital_name": hospital_name,
        "visit_date": visit_date,
        "memo": memo
    })
print_result("진료 예약 생성", res)
appointment_id = res.json().get("id") if res.status_code == 201 else None

# ✅ 예약 목록 조회
res = requests.get(f"{BASE_URL}/appointments/me", headers=headers)
print_result("예약 목록 조회", res)

# ❌ 없는 예약 삭제
res = requests.delete(f"{BASE_URL}/appointments/99999", headers=headers)
print_result("예약 삭제 실패 - 없는 예약", res)

# ✅ 예약 삭제 (방금 만든 예약)
if appointment_id:
    res = requests.delete(f"{BASE_URL}/appointments/{appointment_id}", headers=headers)
    print_result(f"예약 삭제 성공 (id: {appointment_id})", res)


# ================================================================
# 🏆 BADGE (뱃지)
# ================================================================
print("\n\n🏆 ===== BADGE =====")

res = requests.get(f"{BASE_URL}/badges/me", headers=headers)
print_result("내 뱃지 목록", res)

res = requests.get(f"{BASE_URL}/badges/me/count", headers=headers)
print_result("내 뱃지 개수", res)


# ================================================================
# 🎯 CHALLENGE (챌린지)
# ================================================================
print("\n\n🎯 ===== CHALLENGE =====")

# ✅ 챌린지 목록
res = requests.get(f"{BASE_URL}/challenges", headers=headers)
print_result("챌린지 목록", res)

# ❌ 없는 챌린지 참여
res = requests.post(f"{BASE_URL}/challenges/99999/join", headers=headers)
print_result("챌린지 참여 실패 - 없는 챌린지", res)

# ✅ 커스텀 챌린지 생성
print("\n※ 커스텀 챌린지 정보를 입력해주세요")
challenge_title = input_with_default("챌린지 이름", "매일 물 2L 마시기")
challenge_desc = input_with_default("설명", "건강을 위해!")
challenge_category = input_with_default("카테고리", "건강")
challenge_days = input_with_default("기간 (일)", "30")

res = requests.post(f"{BASE_URL}/challenges/custom", headers=headers,
    json={
        "title": challenge_title,
        "description": challenge_desc,
        "category": challenge_category,
        "duration_days": int(challenge_days)
    })
print_result("커스텀 챌린지 생성", res)


# ================================================================
# 📋 HEALTH LOG (건강 로그)
# ================================================================
print("\n\n📋 ===== HEALTH LOG =====")
print("※ 건강 로그 정보를 입력해주세요")

log_year = input_with_default("조회 연도", "2025")
log_month = input_with_default("조회 월 (1-12)", "5")

# ✅ 건강 로그 조회
res = requests.get(f"{BASE_URL}/health-logs/me?year={log_year}&month={log_month}", headers=headers)
print_result("건강 로그 조회", res)

# ❌ 잘못된 month
res = requests.get(f"{BASE_URL}/health-logs/me?year=2025&month=13", headers=headers)
print_result("건강 로그 조회 실패 - 잘못된 month", res)

# ✅ 건강 로그 저장
log_date = input_with_default("로그 날짜 (예: 2025-05-01)", "2025-05-01")
weight = input_with_default("체중 (kg)", "70.5")
exercise_duration = input_with_default("운동 시간 (분)", "30")
alcohol_amount = input_with_default("음주량 (잔)", "0")
smoking_amount = input_with_default("흡연량 (개)", "0")

res = requests.post(f"{BASE_URL}/health-logs", headers=headers,
    json={
        "log_date": log_date,
        "weight": float(weight),
        "exercise_duration": int(exercise_duration),
        "alcohol_amount": float(alcohol_amount),
        "smoking_amount": int(smoking_amount)
    })
print_result("건강 로그 저장", res)


# ================================================================
# 💊 MEDICATION (복약)
# ================================================================
print("\n\n💊 ===== MEDICATION =====")
print("※ 복약 정보를 입력해주세요")

med_name = input_with_default("약 이름", "혈압약")
med_dosage = input_with_default("용량", "1정")
med_schedule = input_with_default("복용 시간 (예: 아침/점심/저녁)", "아침")

# ✅ 복약 생성
res = requests.post(f"{BASE_URL}/medications", headers=headers,
    json={"name": med_name, "dosage": med_dosage, "schedule": med_schedule})
print_result("복약 생성", res)
medication_id = res.json().get("id") if res.status_code == 201 else None

# ✅ 복약 목록
res = requests.get(f"{BASE_URL}/medications/me", headers=headers)
print_result("복약 목록", res)

# ✅ 복약 삭제 (방금 만든 복약)
if medication_id:
    res = requests.delete(f"{BASE_URL}/medications/{medication_id}", headers=headers)
    print_result(f"복약 삭제 성공 (id: {medication_id})", res)

# ❌ 없는 복약 삭제
res = requests.delete(f"{BASE_URL}/medications/99999", headers=headers)
print_result("복약 삭제 실패 - 없는 복약", res)


# ================================================================
# 🔔 NOTIFICATION (알림)
# ================================================================
print("\n\n🔔 ===== NOTIFICATION =====")

# ✅ 알림 설정 조회
res = requests.get(f"{BASE_URL}/notifications/settings", headers=headers)
print_result("알림 설정 조회", res)

# ✅ 알림 설정 수정
print("\n※ 알림 설정을 입력해주세요")
challenge_noti = input_with_default("챌린지 알림 (true/false)", "true")
prediction_noti = input_with_default("예측 알림 (true/false)", "true")

res = requests.put(f"{BASE_URL}/notifications/settings", headers=headers,
    json={
        "challenge_notification": challenge_noti.lower() == "true",
        "prediction_notification": prediction_noti.lower() == "true",
    })
print_result("알림 설정 수정", res)


# ================================================================
# 📊 SURVEY (설문)
# ================================================================
print("\n\n📊 ===== SURVEY =====")
print("※ 설문 정보를 입력해주세요")

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

survey_data = {
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
    "hypertension": hypertension
}

# ✅ 설문 생성
res = requests.post(f"{BASE_URL}/surveys", headers=headers, json=survey_data)
print_result("설문 생성", res)

# ✅ 설문 조회
res = requests.get(f"{BASE_URL}/surveys/me", headers=headers)
print_result("설문 조회", res)


# ================================================================
# 🤖 PREDICTION (예측)
# ================================================================
print("\n\n🤖 ===== PREDICTION =====")

# ✅ 예측 생성
res = requests.post(f"{BASE_URL}/predictions", headers=headers)
print_result("건강 예측 생성", res)

# ✅ 예측 목록
res = requests.get(f"{BASE_URL}/predictions/me", headers=headers)
print_result("예측 목록 조회", res)


# ================================================================
# 📈 ACTIVITY (활동)
# ================================================================
print("\n\n📈 ===== ACTIVITY =====")

res = requests.get(f"{BASE_URL}/activity/me", headers=headers)
print_result("활동 조회", res)


# ================================================================
# 🏠 DASHBOARD (대시보드)
# ================================================================
print("\n\n🏠 ===== DASHBOARD =====")

res = requests.get(f"{BASE_URL}/dashboard", headers=headers)
print_result("대시보드 조회", res)


print("\n\n🎉 전체 API 확인 완료!")