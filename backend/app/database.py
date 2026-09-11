from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.config import settings

# Neon requires SSL - use asyncpg driver
# Note: Remove ?sslmode=require from URL if using asyncpg
DATABASE_URL = settings.database_url.replace(
    "postgresql://", "postgresql+asyncpg://"
).split("?")[0]  # Remove sslmode params for asyncpg

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_size=10,
    max_overflow=5,
    pool_pre_ping=True,
    pool_recycle=300,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()