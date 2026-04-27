import requests

BASE_URL = "http://localhost:8000/api/v1"

# ================================================================
# 테스트 유저 5명 데이터
# ================================================================
users = [
    {
        "email": "user001@example.com",
        "password": "Test1234!",
        "nickname": "테스트유저001",
        "survey": {
            "age": 25,
            "gender": "male",
            "height": 175.0,
            "weight": 80.0,
            "waist": 85.0,
            "drinking": "가끔음주",
            "drink_amount": 2.0,
            "weekly_drink_freq": 1.0,
            "exercise": "가끔운동",
            "weekly_exercise_count": 2,
            "smoking": "비흡연",
            "current_smoking": "안함",
            "sleep_hours": 6.5,
            "sleep_disorder": "없음",
            "diet_questions": [1, 2, 1, 1, 2, 1, 1],
            "diabetes": "없음",
            "hypertension": "없음",
        },
    },
    {
        "email": "user002@example.com",
        "password": "Test1234!",
        "nickname": "테스트유저002",
        "survey": {
            "age": 35,
            "gender": "female",
            "height": 160.0,
            "weight": 55.0,
            "waist": 65.0,
            "drinking": "음주안함",
            "drink_amount": 0.0,
            "weekly_drink_freq": 0.0,
            "exercise": "자주운동",
            "weekly_exercise_count": 5,
            "smoking": "비흡연",
            "current_smoking": "안함",
            "sleep_hours": 8.0,
            "sleep_disorder": "없음",
            "diet_questions": [2, 2, 2, 2, 2, 2, 2],
            "diabetes": "없음",
            "hypertension": "없음",
        },
    },
    {
        "email": "user003@example.com",
        "password": "Test1234!",
        "nickname": "테스트유저003",
        "survey": {
            "age": 45,
            "gender": "male",
            "height": 170.0,
            "weight": 90.0,
            "waist": 95.0,
            "drinking": "자주음주",
            "drink_amount": 5.0,
            "weekly_drink_freq": 3.0,
            "exercise": "운동안함",
            "weekly_exercise_count": 0,
            "smoking": "현재흡연",
            "current_smoking": "피움",
            "sleep_hours": 5.0,
            "sleep_disorder": "있음",
            "diet_questions": [0, 0, 1, 0, 1, 0, 0],
            "diabetes": "있음",
            "hypertension": "있음",
        },
    },
    {
        "email": "user004@example.com",
        "password": "Test1234!",
        "nickname": "테스트유저004",
        "survey": {
            "age": 28,
            "gender": "female",
            "height": 165.0,
            "weight": 60.0,
            "waist": 70.0,
            "drinking": "가끔음주",
            "drink_amount": 1.0,
            "weekly_drink_freq": 1.0,
            "exercise": "가끔운동",
            "weekly_exercise_count": 3,
            "smoking": "과거흡연",
            "current_smoking": "안함",
            "sleep_hours": 7.5,
            "sleep_disorder": "없음",
            "diet_questions": [2, 1, 2, 1, 2, 1, 2],
            "diabetes": "없음",
            "hypertension": "없음",
        },
    },
    {
        "email": "user005@example.com",
        "password": "Test1234!",
        "nickname": "테스트유저005",
        "survey": {
            "age": 55,
            "gender": "male",
            "height": 168.0,
            "weight": 75.0,
            "waist": 88.0,
            "drinking": "가끔음주",
            "drink_amount": 3.0,
            "weekly_drink_freq": 2.0,
            "exercise": "운동안함",
            "weekly_exercise_count": 0,
            "smoking": "비흡연",
            "current_smoking": "안함",
            "sleep_hours": 6.0,
            "sleep_disorder": "있음",
            "diet_questions": [1, 1, 0, 1, 1, 0, 1],
            "diabetes": "없음",
            "hypertension": "있음",
        },
    },
]

# ================================================================
# 유저 생성
# ================================================================
print("🚀 테스트 유저 생성 시작!\n")

created = []

for user in users:
    # 회원가입
    res = requests.post(
        f"{BASE_URL}/auth/signup",
        json={"email": user["email"], "password": user["password"], "nickname": user["nickname"]},
    )

    if res.status_code == 201:
        # 로그인
        login_res = requests.post(f"{BASE_URL}/auth/login", json={"email": user["email"], "password": user["password"]})
        token = login_res.json().get("access_token", "")
        headers = {"Authorization": f"Bearer {token}"}

        # 설문 생성
        survey_res = requests.post(f"{BASE_URL}/surveys", headers=headers, json=user["survey"])
        survey_status = "✅" if survey_res.status_code == 201 else "❌"

        print(f"✅ {user['nickname']} ({user['email']}) 생성 완료! 설문: {survey_status}")
        created.append(user["email"])
    else:
        print(f"❌ {user['nickname']} ({user['email']}) 생성 실패! ({res.status_code})")

print(f"\n🎉 총 {len(created)}명 생성 완료!")
print("\n생성된 유저 목록:")
for email in created:
    print(f"  - {email} / 비밀번호: Test1234!")
