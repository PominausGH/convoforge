"""Passwordless email sign-in.

People use ConvoForge anonymously (a random ID in their browser). Signing in
links that ID to a verified email so they can pick up their streak, history
and Pro on another device:

1. POST /request-link  -> we email a one-time link (valid 30 minutes)
2. They tap it; the page POSTs /verify with the token and this device's ID
3. We pick the account for that email and the device switches to it

The welcome and Pro emails also carry a link (valid 7 days) that confirms the
address for the account it was sent from.
"""
import hashlib
import os
import re
import secrets
import time
import uuid
from collections import defaultdict, deque
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db
from mailer import send_email, sign_in_email
from models.login_token import LoginToken
from models.session import Session
from models.user import User

router = APIRouter()

APP_URL = os.getenv("APP_URL", "https://convoforge.app").rstrip("/")
SIGN_IN_TTL = timedelta(minutes=30)
CONFIRM_TTL = timedelta(days=7)

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
UUID_RE = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", re.I)

# In-memory caps on link requests so the endpoint can't be used to spam inboxes.
HOUR = 3600
PER_EMAIL_HOURLY = 5
PER_IP_HOURLY = 20
_hits: dict[str, deque] = defaultdict(deque)


def _allow(key: str, limit: int, now: float) -> bool:
    q = _hits[key]
    while q and now - q[0] > HOUR:
        q.popleft()
    if len(q) >= limit:
        return False
    q.append(now)
    return True


def _hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _now() -> datetime:
    return datetime.utcnow()


def normalize_email(email: str) -> str:
    return (email or "").strip().lower()


async def create_login_link(
    db: AsyncSession, email: str, requested_by: Optional[str], ttl: timedelta = SIGN_IN_TTL
) -> str:
    """Store a one-time token for `email` and return the link to email out.
    The caller commits."""
    token = secrets.token_urlsafe(32)
    db.add(
        LoginToken(
            token_hash=_hash(token),
            email=normalize_email(email),
            requested_by=requested_by,
            expires_at=_now() + ttl,
        )
    )
    return f"{APP_URL}/auth/verify?token={token}"


async def confirm_link_for(db: AsyncSession, user: User) -> Optional[str]:
    """A longer-lived link that verifies `user.email` for this account, for the
    welcome and Pro emails. None if there's nothing to confirm."""
    if not user.email or user.email_verified_at:
        return None
    return await create_login_link(db, user.email, user.user_id, CONFIRM_TTL)


class LinkRequest(BaseModel):
    email: str = Field(max_length=254)
    user_id: Optional[str] = None  # this device's anonymous ID, if any


@router.post("/request-link", status_code=204)
async def request_link(data: LinkRequest, request: Request, db: AsyncSession = Depends(get_db)):
    email = normalize_email(data.email)
    if not EMAIL_RE.match(email):
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")

    now = time.time()
    forwarded = request.headers.get("x-forwarded-for", "")
    ip = forwarded.split(",")[0].strip() or (request.client.host if request.client else "unknown")
    if not _allow(f"e:{email}", PER_EMAIL_HOURLY, now) or not _allow(f"ip:{ip}", PER_IP_HOURLY, now):
        raise HTTPException(status_code=429, detail="Too many sign-in emails. Please wait a while and try again.")

    device = data.user_id if data.user_id and UUID_RE.match(data.user_id) else None
    link = await create_login_link(db, email, device)
    await db.commit()

    # Same response whether or not the email has an account, so this can't be
    # used to find out who uses ConvoForge.
    subject, html = sign_in_email(link)
    await send_email(email, subject, html)
    return None


class VerifyRequest(BaseModel):
    token: str = Field(min_length=20, max_length=200)
    user_id: Optional[str] = None  # the device opening the link


class VerifyResponse(BaseModel):
    user_id: str
    email: str
    tier: str
    streak_days: int
    switched_account: bool
    moved_sessions: int


async def _session_count(db: AsyncSession, user_id: str) -> int:
    return int((await db.execute(select(func.count(Session.id)).where(Session.user_id == user_id))).scalar_one() or 0)


async def _pick_account(db: AsyncSession, email: str, requested_by: Optional[str]) -> Optional[User]:
    """Which account an email signs in to.

    A verified account always wins. Otherwise choose among accounts that have
    this email unverified, plus the account the link was sent for: Pro first
    (so nobody loses a subscription), then the one with the most practice."""
    verified = (
        await db.execute(
            select(User).where(func.lower(User.email) == email, User.email_verified_at.isnot(None))
        )
    ).scalars().all()
    pool = list(verified)
    if not pool:
        pool = list(
            (await db.execute(select(User).where(func.lower(User.email) == email))).scalars().all()
        )
        if requested_by and all(u.user_id != requested_by for u in pool):
            requester = (await db.execute(select(User).where(User.user_id == requested_by))).scalar_one_or_none()
            if requester:
                pool.append(requester)
    if not pool:
        return None

    scored = []
    for u in pool:
        scored.append(
            (
                u.tier == "pro",
                await _session_count(db, u.user_id),
                u.last_session_at or datetime.min,
                u,
            )
        )
    scored.sort(key=lambda t: t[:3], reverse=True)
    return scored[0][3]


@router.post("/verify", response_model=VerifyResponse)
async def verify(data: VerifyRequest, db: AsyncSession = Depends(get_db)):
    row = (
        await db.execute(select(LoginToken).where(LoginToken.token_hash == _hash(data.token)).with_for_update())
    ).scalar_one_or_none()
    if not row or row.used_at is not None or row.expires_at < _now():
        raise HTTPException(
            status_code=400,
            detail="This sign-in link has expired or was already used. Ask for a new one.",
        )
    row.used_at = _now()
    email = row.email

    device_id = data.user_id if data.user_id and UUID_RE.match(data.user_id) else None
    target = await _pick_account(db, email, row.requested_by)

    if target is None:
        # Brand-new email: attach it to this device's account, creating one if needed.
        target_id = device_id or row.requested_by
        target = None
        if target_id:
            target = (await db.execute(select(User).where(User.user_id == target_id))).scalar_one_or_none()
        if target is None:
            target = User(user_id=target_id or str(uuid.uuid4()), tier="free", streak_days=0, persona_id="global_pro")
            db.add(target)

    target.email = email
    if not target.email_verified_at:
        target.email_verified_at = _now()
    if not target.email_captured_at:
        target.email_captured_at = _now()

    # If this device has been practicing anonymously, bring that progress along
    # rather than stranding it. Only for a device account with no email of its own.
    moved = 0
    if device_id and device_id != target.user_id:
        device = (await db.execute(select(User).where(User.user_id == device_id))).scalar_one_or_none()
        if device and not device.email and device.tier != "pro":
            moved = await _session_count(db, device_id)
            if moved:
                await db.execute(update(Session).where(Session.user_id == device_id).values(user_id=target.user_id))
            target.streak_days = max(target.streak_days or 0, device.streak_days or 0)
            if device.last_session_at and (not target.last_session_at or device.last_session_at > target.last_session_at):
                target.last_session_at = device.last_session_at
            if device.friend_challenges:
                merged = dict(device.friend_challenges)
                merged.update(target.friend_challenges or {})
                target.friend_challenges = merged

    await db.commit()
    return VerifyResponse(
        user_id=target.user_id,
        email=email,
        tier=target.tier or "free",
        streak_days=target.streak_days or 0,
        switched_account=bool(device_id) and device_id != target.user_id,
        moved_sessions=moved,
    )
