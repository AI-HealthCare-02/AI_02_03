from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import ORJSONResponse

import app.models  # noqa: F401
from app.apis.v1 import v1_routers
from app.db.databases import Base, engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    try:
        from ai_worker.tasks.predict import _load_model
        _load_model()
    except Exception as e:
        print(f"Warning: 모델 로딩 실패 - {e}")
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