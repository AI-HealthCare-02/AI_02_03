import json
import re
import sys
from collections.abc import AsyncGenerator
from urllib.parse import quote_plus

import httpx
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.core import config
from app.db import databases
from app.db.databases import Base, get_db
from app.main import app

sys.stdout.reconfigure(encoding="utf-8")

TEST_BASE_URL = "http://test"
TEST_DATABASE_URL = (
    f"postgresql+asyncpg://{config.DB_USER}:{quote_plus(config.DB_PASSWORD)}@{config.DB_HOST}:{config.DB_PORT}/test"
)


def _mask_jwt(text: str) -> str:
    return re.sub(r"eyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+", "<JWT>", text)


def _pretty(text: str, limit: int = 300) -> str:
    try:
        obj = json.loads(text)
        pretty = json.dumps(obj, ensure_ascii=False, indent=2)
        if len(pretty) > limit:
            pretty = pretty[:limit] + "\n  ..."
        return _mask_jwt(pretty)
    except Exception:
        return _mask_jwt(text[:limit])


async def _log_request(request: httpx.Request) -> None:
    body = request.content.decode("utf-8", errors="replace") if request.content else ""
    print(f"\n┌─ {request.method} {request.url}")
    if body:
        print(f"│  {_pretty(body)}")


async def _log_response(response: httpx.Response) -> None:
    await response.aread()
    try:
        body = _pretty(response.text)
    except Exception:
        body = "(unreadable)"
    print(f"└─ {response.status_code}  {body}")


@pytest_asyncio.fixture
async def engine():
    _engine = create_async_engine(TEST_DATABASE_URL, poolclass=NullPool)

    # 메인 앱 엔진도 교체 (lifespan에서 사용)
    databases.engine = _engine
    databases.async_session_maker = async_sessionmaker(_engine, expire_on_commit=False)

    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield _engine
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await _engine.dispose()


@pytest_asyncio.fixture
async def db_session(engine) -> AsyncGenerator[AsyncSession, None]:
    session_maker = async_sessionmaker(engine, expire_on_commit=False)
    async with session_maker() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url=TEST_BASE_URL,
        event_hooks={"request": [_log_request], "response": [_log_response]},
    ) as c:
        yield c
    app.dependency_overrides.clear()
