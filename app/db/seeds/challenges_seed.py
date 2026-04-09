"""
챌린지 초기 데이터 시딩 스크립트

실행:
    uv run python -m app.db.seeds.challenges_seed
"""

import asyncio

from sqlalchemy import select

from app.db.databases import async_session_maker
from app.models.challenges import Challenge

CHALLENGES = [
    {
        "type": "운동",
        "name": "주 3회 유산소 운동",
        "description": "매주 3회 이상 30분 이상 유산소 운동하기 (걷기, 달리기, 자전거 등)",
        "duration_days": 14,
        "required_logs": 6,
        "shap_feature": "주당운동횟수",
    },
    {
        "type": "운동",
        "name": "매일 만보 걷기",
        "description": "하루 1만 보 이상 걷기",
        "duration_days": 7,
        "required_logs": 7,
        "shap_feature": "주당운동횟수",
    },
    {
        "type": "금주",
        "name": "1주일 금주 도전",
        "description": "7일 동안 알코올 섭취 없이 생활하기",
        "duration_days": 7,
        "required_logs": 7,
        "shap_feature": "주당음주빈도",
    },
    {
        "type": "금주",
        "name": "음주량 줄이기",
        "description": "주당 음주 횟수를 현재보다 절반으로 줄이기",
        "duration_days": 14,
        "required_logs": 6,
        "shap_feature": "1회음주량",
    },
    {
        "type": "식단",
        "name": "야식 끊기",
        "description": "저녁 9시 이후 음식 섭취 없이 생활하기",
        "duration_days": 7,
        "required_logs": 6,
        "shap_feature": "식습관자가평가",
    },
    {
        "type": "식단",
        "name": "채소 매일 먹기",
        "description": "매 끼니마다 채소 1가지 이상 섭취하기",
        "duration_days": 7,
        "required_logs": 7,
        "shap_feature": "식습관자가평가",
    },
    {
        "type": "수면",
        "name": "규칙적인 수면 습관",
        "description": "매일 같은 시간에 자고 7시간 이상 수면하기",
        "duration_days": 7,
        "required_logs": 7,
        "shap_feature": "평균수면시간",
    },
]


async def seed():
    async with async_session_maker() as session:
        for data in CHALLENGES:
            exists = await session.execute(select(Challenge).where(Challenge.name == data["name"]))
            if exists.scalar_one_or_none():
                print(f"[SKIP] {data['name']}")
                continue

            session.add(Challenge(**data))
            print(f"[INSERT] {data['name']}")

        await session.commit()
        print("시딩 완료")


if __name__ == "__main__":
    asyncio.run(seed())
