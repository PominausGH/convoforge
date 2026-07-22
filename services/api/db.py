import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from models.user import Base

# Using placeholder DATABASE_URL, in practice would be pulled from .env
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://andrew:convoforge@localhost:5433/postgres-main")

engine = create_async_engine(DATABASE_URL, echo=True)

async_session = async_sessionmaker(
    engine, 
    expire_on_commit=False, 
    class_=AsyncSession
)

async def get_db():
    async with async_session() as session:
        yield session
