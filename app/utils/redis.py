import json
from datetime import datetime

import redis.asyncio as aioredis

from app.core import config


def _client() -> aioredis.Redis:
    return aioredis.Redis(host=config.REDIS_HOST, port=config.REDIS_PORT, decode_responses=True)


def seconds_until_midnight() -> int:
    from datetime import timedelta

    now = datetime.now()
    midnight = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    return max(int((midnight - now).total_seconds()), 1)


def get_time_period() -> tuple[str, int]:
    """현재 시간대와 해당 시간대 종료까지 남은 초 반환.
    아침(05~11시), 점심(11~17시), 저녁(17~05시)
    """
    from datetime import timedelta

    now = datetime.now()
    hour = now.hour
    if 5 <= hour < 11:
        end = now.replace(hour=11, minute=0, second=0, microsecond=0)
        return "morning", max(int((end - now).total_seconds()), 1)
    if 11 <= hour < 17:
        end = now.replace(hour=17, minute=0, second=0, microsecond=0)
        return "afternoon", max(int((end - now).total_seconds()), 1)
    # 저녁(17~05시) → 다음날 05시까지
    if hour >= 17:
        end = (now + timedelta(days=1)).replace(hour=5, minute=0, second=0, microsecond=0)
    else:  # 0~5시
        end = now.replace(hour=5, minute=0, second=0, microsecond=0)
    return "evening", max(int((end - now).total_seconds()), 1)


async def cache_get(key: str) -> dict | None:
    client = _client()
    try:
        data = await client.get(key)
        return json.loads(data) if data else None
    finally:
        await client.aclose()


async def cache_set(key: str, value: dict, ttl: int) -> None:
    client = _client()
    try:
        await client.setex(key, ttl, json.dumps(value, ensure_ascii=False))
    finally:
        await client.aclose()


async def cache_delete(key: str) -> None:
    client = _client()
    try:
        await client.delete(key)
    finally:
        await client.aclose()
