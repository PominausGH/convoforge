from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from ..db import get_db
from ..models.session import Session
from pydantic import BaseModel
from datetime import datetime
from uuid import UUID

router = APIRouter()

class SessionSummary(BaseModel):
    id: UUID
    module_id: int
    forge_score: int
    created_at: datetime

    class Config:
        from_attributes = True

@router.get("/{user_id}", response_model=List[SessionSummary])
async def get_user_sessions(user_id: str, db: AsyncSession = Depends(get_db)):
    query = select(Session).where(Session.user_id == user_id).order_by(Session.created_at.desc())
    result = await db.execute(query)
    sessions = result.scalars().all()
    return sessions

@router.get("/detail/{session_id}")
async def get_session_detail(session_id: str, db: AsyncSession = Depends(get_db)):
    query = select(Session).where(Session.id == session_id)
    result = await db.execute(query)
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return session
