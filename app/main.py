from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import ORJSONResponse

import app.models  # noqa: F401 — ensure all models are registered before create_all

from app.apis.v1 import v1_routers
from app.db.databases import Base, engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    from ai_worker.tasks.predict import _load_model
    _load_model()  # 서버 시작 시 모델 1회 로딩
    yield
    await engine.dispose()


app = FastAPI(
    lifespan=lifespan,
    default_response_class=ORJSONResponse,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.include_router(v1_routers)
