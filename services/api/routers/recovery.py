"""Magic-link account restore for anonymous users.

Identity is a browser-local UUID, so a new device starts blank. A user who
attached an email can request a one-time link; opening it on the new device
hands back the user_id for that account. Possession of the inbox is the proof,
so an email typed into the capture form is never enough on its own.

Registered before routers.users so "/recover" isn't swallowed by "/{user_id}".
"""
import hashlib
import os
import re
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import case, select
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db
from mailer import recovery_email, send_email
from models.recovery_token import RecoveryToken
from models.user import User

router = APIRouter()

APP_URL = os.getenv("APP_URL", "https://convoforge.app").rstrip("/")
TOKEN_TTL = timedelta(minutes=30)
RESEND_COOLDOWN = timedelta(seconds=60)
_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


class RecoverRequest(BaseModel):
    email: str


@router.post("/recover", status_code=204)
async def request_recovery(data: RecoverRequest, db: AsyncSession = Depends(get_db)):
    """Always 204, whether or not the email matches, so it can't be used to
    probe which emails have accounts."""
    email = (data.email or "").strip().lower()
    if not _EMAIL_RE.match(email):
        raise HTTPException(status_code=400, detail="Invalid email")

    # Several anonymous browsers can carry the same email. Prefer Pro, then the
    # most recently active account.
    user = (
        await db.execute(
            select(User)
            .where(User.email == email)
            .order_by(
                case((User.tier == "pro", 0), else_=1),
                User.last_session_at.desc().nulls_last(),
                User.created_at.desc(),
            )
            .limit(1)
        )
    ).scalar_one_or_none()
    if not user:
        return None

    now = _now()
    recent = (
        await db.execute(
            select(RecoveryToken.token_hash)
            .where(
                RecoveryToken.user_id == user.user_id,
                RecoveryToken.created_at > now - RESEND_COOLDOWN,
            )
            .limit(1)
        )
    ).scalar_one_or_none()
    if recent:
        return None

    token = secrets.token_urlsafe(32)
    db.add(
        RecoveryToken(
            token_hash=_hash(token),
            user_id=user.user_id,
            created_at=now,
            expires_at=now + TOKEN_TTL,
        )
    )
    await db.commit()

    subject, html = recovery_email(f"{APP_URL}/restore?token={token}")
    await send_email(email, subject, html)
    return None


class ConfirmRequest(BaseModel):
    token: str


class ConfirmResponse(BaseModel):
    user_id: str


@router.post("/recover/confirm", response_model=ConfirmResponse)
async def confirm_recovery(data: ConfirmRequest, db: AsyncSession = Depends(get_db)):
    row = (
        await db.execute(
            select(RecoveryToken)
            .where(RecoveryToken.token_hash == _hash((data.token or "").strip()))
            .with_for_update()
        )
    ).scalar_one_or_none()
    if not row or row.used_at is not None or row.expires_at < _now():
        raise HTTPException(status_code=400, detail="Link is invalid or expired")
    row.used_at = _now()
    await db.commit()
    return ConfirmResponse(user_id=row.user_id)
