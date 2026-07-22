"""Public aggregate stats for the landing page. No PII — counts only."""
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db
from models.session import Session
from models.user import User

router = APIRouter()


class PublicStats(BaseModel):
    total_sessions: int
    sessions_last_30d: int
    total_users: int
    avg_forge_score: int


@router.get("/public", response_model=PublicStats)
async def public_stats(db: AsyncSession = Depends(get_db)) -> PublicStats:
    since = (datetime.now(timezone.utc) - timedelta(days=30)).replace(tzinfo=None)

    total_sessions = int(
        (await db.execute(select(func.count(Session.id)))).scalar_one() or 0
    )
    sessions_last_30d = int(
        (
            await db.execute(
                select(func.count(Session.id)).where(Session.created_at >= since)
            )
        ).scalar_one()
        or 0
    )
    total_users = int(
        (await db.execute(select(func.count(User.user_id)))).scalar_one() or 0
    )
    avg_raw = (
        await db.execute(
            select(func.avg(Session.forge_score)).where(Session.forge_score > 0)
        )
    ).scalar_one()
    avg_forge_score = int(round(avg_raw or 0))

    return PublicStats(
        total_sessions=total_sessions,
        sessions_last_30d=sessions_last_30d,
        total_users=total_users,
        avg_forge_score=avg_forge_score,
    )
