from collections.abc import AsyncGenerator
from urllib.parse import quote_plus

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core import config


class Base(DeclarativeBase):
    pass


def get_database_url() -> str:
    password = quote_plus(config.DB_PASSWORD)
    return (
        f"postgresql+asyncpg://{config.DB_USER}:{password}"
        f"@{config.DB_HOST}:{config.DB_PORT}/{config.DB_NAME}"
    )


engine = create_async_engine(
    get_database_url(),
    pool_size=config.DB_CONNECTION_POOL_MAXSIZE,
    echo=False,
)

async_session_maker = async_sessionmaker(engine, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
