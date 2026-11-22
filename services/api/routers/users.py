import re
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db
from mailer import send_email, welcome_email
from routers.auth import confirm_link_for, normalize_email
from models.session import Session
from models.user import User

router = APIRouter()

FREE_TIER_WEEKLY_LIMIT = 3

_UUID_RE = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
    re.IGNORECASE,
)


def _validate_uuid(user_id: str) -> None:
    if not _UUID_RE.match(user_id or ""):
        raise HTTPException(status_code=400, detail="Invalid user_id format")


class UserProfile(BaseModel):
    user_id: str
    tier: str
    streak_days: int
    last_session_at: Optional[datetime]
    persona_id: str
    weekly_session_count: int
    weekly_session_limit: Optional[int]
    completed_module_ids: List[int]
    signed_in: bool = False  # has a confirmed email
    email_hint: Optional[str] = None  # masked, e.g. "ge•••@gmail.com"


def _mask(email: Optional[str]) -> Optional[str]:
    if not email or "@" not in email:
        return None
    name, domain = email.split("@", 1)
    return f"{name[:2]}•••@{domain}"


async def _build_profile(user: User, db: AsyncSession) -> UserProfile:
    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).replace(tzinfo=None)
    weekly_count = int(
        (
            await db.execute(
                select(func.count(Session.id)).where(
                    Session.user_id == user.user_id,
                    Session.created_at >= week_ago,
                )
            )
        ).scalar_one()
        or 0
    )

    completed_rows = (
        await db.execute(
            select(Session.module_id)
            .where(Session.user_id == user.user_id, Session.module_id.isnot(None))
            .distinct()
        )
    ).scalars().all()
    completed_ids = sorted({int(m) for m in completed_rows if m is not None})

    return UserProfile(
        user_id=user.user_id,
        tier=user.tier,
        streak_days=user.streak_days or 0,
        last_session_at=user.last_session_at,
        persona_id=user.persona_id or "global_pro",
        weekly_session_count=weekly_count,
        weekly_session_limit=FREE_TIER_WEEKLY_LIMIT if user.tier == "free" else None,
        completed_module_ids=completed_ids,
        signed_in=bool(user.email_verified_at),
        email_hint=_mask(user.email) if user.email_verified_at else None,
    )


@router.get("/{user_id}", response_model=UserProfile)
async def get_user(user_id: str, db: AsyncSession = Depends(get_db)):
    """Read-only. Returns 404 if the user doesn't exist so unauthenticated
    crawlers can't inflate the users table via GET."""
    _validate_uuid(user_id)
    user = (
        await db.execute(select(User).where(User.user_id == user_id))
    ).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return await _build_profile(user, db)


@router.post("/{user_id}", response_model=UserProfile, status_code=201)
async def create_user(user_id: str, db: AsyncSession = Depends(get_db)):
    """Idempotent create. Returns existing profile if already present."""
    _validate_uuid(user_id)
    user = (
        await db.execute(select(User).where(User.user_id == user_id))
    ).scalar_one_or_none()
    if not user:
        user = User(
            user_id=user_id, tier="free", streak_days=0, persona_id="global_pro"
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    return await _build_profile(user, db)


_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class EmailCapture(BaseModel):
    email: str
    opt_in: bool = True


@router.post("/{user_id}/email", status_code=204)
async def capture_email(
    user_id: str, data: EmailCapture, db: AsyncSession = Depends(get_db)
):
    """Attach an email to an existing anonymous user for newsletter / cross-device
    recovery. Idempotent — re-posting the same email is a no-op."""
    _validate_uuid(user_id)
    if not _EMAIL_RE.match(data.email or ""):
        raise HTTPException(status_code=400, detail="Invalid email")
    user = (
        await db.execute(select(User).where(User.user_id == user_id))
    ).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    new_email = normalize_email(data.email)
    if user.email_verified_at and user.email != new_email:
        # Changing a verified email has to go through sign-in, so it can't be
        # swapped by anyone who learns this ID.
        raise HTTPException(status_code=409, detail="This account already has a confirmed email.")
    user.email = new_email
    user.newsletter_opt_in = data.opt_in
    user.email_captured_at = datetime.now(timezone.utc).replace(tzinfo=None)
    await db.commit()

    confirm_link = await confirm_link_for(db, user)
    await db.commit()
    subject, html = welcome_email(data.opt_in, confirm_link)
    await send_email(user.email, subject, html)

    return None


class PersonaUpdate(BaseModel):
    persona_id: str


@router.patch("/{user_id}/persona", response_model=UserProfile)
async def update_persona(
    user_id: str, data: PersonaUpdate, db: AsyncSession = Depends(get_db)
):
    _validate_uuid(user_id)
    user = (
        await db.execute(select(User).where(User.user_id == user_id))
    ).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.persona_id = data.persona_id
    await db.commit()
    await db.refresh(user)
    return await _build_profile(user, db)


_CHALLENGE_ID_RE = re.compile(r"^[a-z0-9-]{1,40}$")
_FEELINGS = {"easier", "expected", "harder"}


class ChallengeEntry(BaseModel):
    done_at: str
    feeling: Optional[str] = None


async def _signed_in_user(user_id: str, db: AsyncSession) -> User:
    _validate_uuid(user_id)
    user = (await db.execute(select(User).where(User.user_id == user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.email_verified_at:
        # Progress stays on the device until someone signs in.
        raise HTTPException(status_code=403, detail="Sign in to sync progress")
    return user


@router.get("/{user_id}/friend-challenges")
async def get_friend_challenges(user_id: str, db: AsyncSession = Depends(get_db)):
    user = await _signed_in_user(user_id, db)
    return user.friend_challenges or {}


@router.put("/{user_id}/friend-challenges")
async def put_friend_challenges(
    user_id: str, data: dict[str, ChallengeEntry], db: AsyncSession = Depends(get_db)
):
    user = await _signed_in_user(user_id, db)
    if len(data) > 100:
        raise HTTPException(status_code=422, detail="Too many entries")
    clean = {}
    for cid, entry in data.items():
        if not _CHALLENGE_ID_RE.match(cid):
            continue
        clean[cid] = {
            "done_at": entry.done_at[:40],
            **({"feeling": entry.feeling} if entry.feeling in _FEELINGS else {}),
        }
    user.friend_challenges = clean
    await db.commit()
    return clean
