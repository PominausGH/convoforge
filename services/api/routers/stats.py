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


# --- Private retention stats (founder dashboard) -------------------------------
# Protected by ADMIN_STATS_TOKEN. If it isn't set, the endpoint 404s so it
# doesn't advertise itself. Session times are stored as naive UTC, hence the
# (NOW() AT TIME ZONE 'UTC') comparisons. Counts are per anonymous ID, so someone who switches
# device or clears their browser shows up as a new user (numbers run low).

import hmac
import os
from typing import Optional

from fastapi import Header, HTTPException
from sqlalchemy import text

RETURNING_MIN_AGE_DAYS = 7  # ignore users too new to have had a chance to return
COHORT_WEEKS = 8


class Cohort(BaseModel):
    week_start: str
    users: int
    week_1_pct: Optional[float]  # None = that week hasn't finished yet
    week_2_pct: Optional[float]
    week_4_pct: Optional[float]


class RetentionStats(BaseModel):
    total_users: int
    users_with_a_session: int
    pro_users: int
    active_7d: int
    active_30d: int
    eligible_users: int  # had a first session 7+ days ago
    returning_users: int  # of eligible: practiced on 2+ different days
    returning_pct: float
    regulars_5plus_days: int
    avg_sessions_per_user: float
    cohorts: list[Cohort]


def _check_admin(token: Optional[str]) -> None:
    expected = os.getenv("ADMIN_STATS_TOKEN", "").strip()
    if not expected:
        raise HTTPException(status_code=404, detail="Not found")
    if not token or not hmac.compare_digest(token.encode(), expected.encode()):
        raise HTTPException(status_code=401, detail="Wrong admin key")


def _pct(part: int, whole: int) -> float:
    return round(100.0 * part / whole, 1) if whole else 0.0


@router.get("/retention", response_model=RetentionStats)
async def retention_stats(
    x_admin_token: Optional[str] = Header(default=None),
    db: AsyncSession = Depends(get_db),
) -> RetentionStats:
    _check_admin(x_admin_token)

    totals = (
        await db.execute(
            text(
                """
                SELECT
                  (SELECT COUNT(*) FROM cf_users)                               AS total_users,
                  (SELECT COUNT(*) FROM cf_users WHERE tier = 'pro')            AS pro_users,
                  (SELECT COUNT(DISTINCT user_id) FROM cf_sessions)             AS with_session,
                  (SELECT COUNT(DISTINCT user_id) FROM cf_sessions
                     WHERE created_at >= (NOW() AT TIME ZONE 'UTC') - INTERVAL '7 days')             AS active_7d,
                  (SELECT COUNT(DISTINCT user_id) FROM cf_sessions
                     WHERE created_at >= (NOW() AT TIME ZONE 'UTC') - INTERVAL '30 days')            AS active_30d
                """
            )
        )
    ).mappings().one()

    ret = (
        await db.execute(
            text(
                """
                WITH per_user AS (
                  SELECT user_id,
                         COUNT(*)                         AS sessions,
                         COUNT(DISTINCT created_at::date) AS active_days,
                         MIN(created_at)                  AS first_seen
                  FROM cf_sessions
                  GROUP BY user_id
                )
                SELECT
                  COUNT(*)                                   AS eligible,
                  COUNT(*) FILTER (WHERE active_days >= 2)   AS returning,
                  COUNT(*) FILTER (WHERE active_days >= 5)   AS regulars,
                  COALESCE(AVG(sessions), 0)                 AS avg_sessions
                FROM per_user
                WHERE first_seen < (NOW() AT TIME ZONE 'UTC') - make_interval(days => :min_age)
                """
            ),
            {"min_age": RETURNING_MIN_AGE_DAYS},
        )
    ).mappings().one()

    cohort_rows = (
        await db.execute(
            text(
                """
                WITH firsts AS (
                  SELECT user_id, date_trunc('week', MIN(created_at)) AS cohort
                  FROM cf_sessions GROUP BY user_id
                ),
                act AS (
                  SELECT DISTINCT user_id, date_trunc('week', created_at) AS wk FROM cf_sessions
                )
                SELECT
                  f.cohort,
                  COUNT(*) AS users,
                  COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM act a WHERE a.user_id = f.user_id
                                                 AND a.wk = f.cohort + INTERVAL '1 week')) AS w1,
                  COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM act a WHERE a.user_id = f.user_id
                                                 AND a.wk = f.cohort + INTERVAL '2 weeks')) AS w2,
                  COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM act a WHERE a.user_id = f.user_id
                                                 AND a.wk = f.cohort + INTERVAL '4 weeks')) AS w4,
                  date_trunc('week', (NOW() AT TIME ZONE 'UTC')) AS this_week
                FROM firsts f
                WHERE f.cohort >= date_trunc('week', (NOW() AT TIME ZONE 'UTC')) - make_interval(weeks => :weeks)
                GROUP BY f.cohort
                ORDER BY f.cohort DESC
                """
            ),
            {"weeks": COHORT_WEEKS},
        )
    ).mappings().all()

    cohorts = []
    for r in cohort_rows:
        # A later week only counts once it has fully ended.
        weeks_done = (r["this_week"] - r["cohort"]).days // 7 - 1

        def pct_or_none(n: int, offset: int) -> Optional[float]:
            return _pct(n, r["users"]) if weeks_done >= offset else None

        cohorts.append(
            Cohort(
                week_start=r["cohort"].date().isoformat(),
                users=r["users"],
                week_1_pct=pct_or_none(r["w1"], 1),
                week_2_pct=pct_or_none(r["w2"], 2),
                week_4_pct=pct_or_none(r["w4"], 4),
            )
        )

    eligible = int(ret["eligible"])
    returning = int(ret["returning"])
    return RetentionStats(
        total_users=int(totals["total_users"]),
        users_with_a_session=int(totals["with_session"]),
        pro_users=int(totals["pro_users"]),
        active_7d=int(totals["active_7d"]),
        active_30d=int(totals["active_30d"]),
        eligible_users=eligible,
        returning_users=returning,
        returning_pct=_pct(returning, eligible),
        regulars_5plus_days=int(ret["regulars"]),
        avg_sessions_per_user=round(float(ret["avg_sessions"]), 1),
        cohorts=cohorts,
    )
