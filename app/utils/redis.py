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
