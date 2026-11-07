"""Magic-link account restore for anonymous users.

Identity is a browser-local UUID, so a new device starts blank. A user who
attached an email can request a one-time link; opening it on the new device
hands back the user_id for that account. Possession of the inbox is the proof,
so an email typed into the capture form is never enough on its own: restore
only considers emails the owner has confirmed via a 'verify' link.

Registered before routers.users so "/recover" isn't swallowed by "/{user_id}".
"""
import hashlib
import os
import re
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import case, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db
from mailer import recovery_email, send_email
from models.payment import Payment
from models.recovery_token import RecoveryToken
from models.session import Session
from models.user import User

router = APIRouter()

APP_URL = os.getenv("APP_URL", "https://convoforge.app").rstrip("/")
TOKEN_TTL = timedelta(minutes=30)
RESEND_COOLDOWN = timedelta(seconds=60)
_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
_UUID_RE = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
    re.IGNORECASE,
)


def _now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


async def issue_token(
    db: AsyncSession, user_id: str, purpose: str, email: str | None = None
) -> str | None:
    """Create a one-time token, or return None inside the resend cooldown for
    the same user and purpose (so these endpoints can't be used to spam an inbox)."""
    now = _now()
    recent = (
        await db.execute(
            select(RecoveryToken.token_hash)
            .where(
                RecoveryToken.user_id == user_id,
                RecoveryToken.purpose == purpose,
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
            user_id=user_id,
            purpose=purpose,
            email=email,
            created_at=now,
            expires_at=now + TOKEN_TTL,
        )
    )
    await db.commit()
    return token


async def _consume(db: AsyncSession, raw_token: str, purpose: str) -> RecoveryToken:
    row = (
        await db.execute(
            select(RecoveryToken)
            .where(
                RecoveryToken.token_hash == _hash((raw_token or "").strip()),
                RecoveryToken.purpose == purpose,
            )
            .with_for_update()
        )
    ).scalar_one_or_none()
    if not row or row.used_at is not None or row.expires_at < _now():
        raise HTTPException(status_code=400, detail="Link is invalid or expired")
    row.used_at = _now()
    return row


class RecoverRequest(BaseModel):
    email: str


@router.post("/recover", status_code=204)
async def request_recovery(data: RecoverRequest, db: AsyncSession = Depends(get_db)):
    """Always 204, whether or not the email matches, so it can't be used to
    probe which emails have accounts."""
    email = (data.email or "").strip().lower()
    if not _EMAIL_RE.match(email):
        raise HTTPException(status_code=400, detail="Invalid email")

    # Only verified emails count. Several browsers can share one verified email:
    # prefer Pro, then the most recently active account.
    user = (
        await db.execute(
            select(User)
            .where(User.email == email, User.email_verified_at.is_not(None))
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

    token = await issue_token(db, user.user_id, "restore")
    if token:
        subject, html = recovery_email(f"{APP_URL}/restore?token={token}")
        await send_email(email, subject, html)
    return None


class ConfirmRequest(BaseModel):
    token: str
    # The browser's current anonymous account, if any. Its practice history is
    # carried over when it is safe to (see _merge_anonymous).
    current_user_id: str | None = None


class ConfirmResponse(BaseModel):
    user_id: str
    merged_sessions: int = 0


async def _merge_anonymous(db: AsyncSession, current_id: str | None, target_id: str) -> int:
    """Move practice sessions from the browser's throwaway account onto the
    restored one. Only for a plain anonymous account: free tier, no email, no
    payments. Anything else is left untouched."""
    if not current_id or current_id == target_id or not _UUID_RE.match(current_id):
        return 0
    orphan = (
        await db.execute(select(User).where(User.user_id == current_id))
    ).scalar_one_or_none()
    if not orphan or orphan.email or orphan.tier != "free":
        return 0
    paid = (
        await db.execute(
            select(func.count()).select_from(Payment).where(Payment.user_id == current_id)
        )
    ).scalar_one()
    if paid:
        return 0
    moved = await db.execute(
        update(Session).where(Session.user_id == current_id).values(user_id=target_id)
    )
    return moved.rowcount or 0


@router.post("/recover/confirm", response_model=ConfirmResponse)
async def confirm_recovery(data: ConfirmRequest, db: AsyncSession = Depends(get_db)):
    row = await _consume(db, data.token, "restore")
    merged = await _merge_anonymous(db, data.current_user_id, row.user_id)
    await db.commit()
    return ConfirmResponse(user_id=row.user_id, merged_sessions=merged)


@router.post("/verify", status_code=204)
async def verify_email_token(data: ConfirmRequest, db: AsyncSession = Depends(get_db)):
    """Confirm the owner controls the address the token was sent to. Ignored if
    the account's email has since changed."""
    row = await _consume(db, data.token, "verify")
    user = (
        await db.execute(select(User).where(User.user_id == row.user_id))
    ).scalar_one_or_none()
    if not user or not row.email or user.email != row.email:
        await db.commit()
        raise HTTPException(status_code=400, detail="Link is invalid or expired")
    user.email_verified_at = _now()
    await db.commit()
    return None
