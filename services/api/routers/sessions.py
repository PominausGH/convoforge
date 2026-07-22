from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional, Any
from db import get_db
from models.session import Session
from models.user import User
from pydantic import BaseModel
from datetime import datetime, timedelta, timezone
from uuid import UUID

router = APIRouter()

FREE_TIER_WEEKLY_LIMIT = 3
STREAK_WINDOW_HOURS = 36  # gap allowed before a streak resets


class SessionCreate(BaseModel):
    user_id: str
    module_id: int
    forge_score: int
    verbal_json: Optional[dict] = None
    visual_json: Optional[dict] = None
    carnegie_json: Optional[dict] = None
    recording_r2: Optional[str] = None


class SessionSummary(BaseModel):
    id: UUID
    module_id: int
    forge_score: int
    created_at: datetime

    class Config:
        from_attributes = True


class SessionCreateResponse(BaseModel):
    id: UUID
    forge_score: int
    streak_days: int
    created_at: datetime


def _utcnow() -> datetime:
    """Naive UTC — DB columns are TIMESTAMP WITHOUT TIME ZONE."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _as_naive_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    return dt.astimezone(timezone.utc).replace(tzinfo=None) if dt.tzinfo else dt


async def _weekly_session_count(db: AsyncSession, user_id: str) -> int:
    week_ago = _utcnow() - timedelta(days=7)
    query = select(func.count(Session.id)).where(
        Session.user_id == user_id,
        Session.created_at >= week_ago,
    )
    result = await db.execute(query)
    return int(result.scalar_one() or 0)


@router.post("/", response_model=SessionCreateResponse)
async def create_session(data: SessionCreate, db: AsyncSession = Depends(get_db)):
    user_query = select(User).where(User.user_id == data.user_id)
    user = (await db.execute(user_query)).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.tier == "free":
        weekly_count = await _weekly_session_count(db, data.user_id)
        if weekly_count >= FREE_TIER_WEEKLY_LIMIT:
            raise HTTPException(
                status_code=402,
                detail="Free tier weekly session limit reached. Upgrade to Pro.",
            )

    now = _utcnow()
    last = _as_naive_utc(user.last_session_at)
    if last is None:
        user.streak_days = 1
    else:
        gap = now - last
        if gap <= timedelta(hours=STREAK_WINDOW_HOURS):
            same_calendar_day = last.date() == now.date()
            user.streak_days = user.streak_days if same_calendar_day else (user.streak_days or 0) + 1
        else:
            user.streak_days = 1
    user.last_session_at = now

    session = Session(
        user_id=data.user_id,
        module_id=data.module_id,
        forge_score=data.forge_score,
        verbal_json=data.verbal_json,
        visual_json=data.visual_json,
        carnegie_json=data.carnegie_json,
        recording_r2=data.recording_r2,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)

    return SessionCreateResponse(
        id=session.id,
        forge_score=session.forge_score,
        streak_days=user.streak_days,
        created_at=session.created_at,
    )


@router.get("/{user_id}", response_model=List[SessionSummary])
async def get_user_sessions(user_id: str, db: AsyncSession = Depends(get_db)):
    query = (
        select(Session)
        .where(Session.user_id == user_id)
        .order_by(Session.created_at.desc())
    )
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/detail/{session_id}")
async def get_session_detail(session_id: str, db: AsyncSession = Depends(get_db)) -> Any:
    query = select(Session).where(Session.id == session_id)
    session = (await db.execute(query)).scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session
