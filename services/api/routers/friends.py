"""Friends Lab group suggestions.

Takes a user's area, interests and life stage and asks Claude for kinds of
local groups worth trying, with a first step and a search query for each.
The area and interests are used for this request only and are never stored.
"""
import os
import time
from collections import defaultdict, deque
from typing import Literal, Optional

from anthropic import AsyncAnthropic
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from routers.analyze import ANTHROPIC_MODEL, _extract_json

router = APIRouter()

# Simple in-memory daily caps so an anonymous endpoint can't run up the LLM bill.
DAY_SECONDS = 24 * 60 * 60
PER_USER_DAILY = 10
PER_IP_DAILY = 30
_hits: dict[str, deque] = defaultdict(deque)


def _allow(key: str, limit: int, now: float) -> bool:
    q = _hits[key]
    while q and now - q[0] > DAY_SECONDS:
        q.popleft()
    if len(q) >= limit:
        return False
    q.append(now)
    return True


SUGGEST_SYSTEM_PROMPT = """You help people find local groups and communities where they can make friends.
The person is either later in life (retired, recently moved, newly on their own) or starting out
(new to a city, after school or college). You get their area, interests and life stage.

Suggest 5 kinds of group they could realistically find in or near that area. Mix direct matches for their
interests with one or two less obvious ideas. Prefer groups that meet regularly (weekly or fortnightly),
because seeing the same people again is how friendships form. Favour volunteering and classes where
people do something side by side.

Do NOT invent specific organisations, venues, addresses, dates or URLs. You can't verify them. Describe
kinds of group, and give a search query the person can use to find real ones nearby.

Return JSON only, no preamble. Schema:
{
  "suggestions": [
    {
      "group_type": string,      // e.g. "Local history society", <6 words
      "why": string,             // why it suits them, tied to their interests/stage, <25 words
      "first_step": string,      // one concrete, small action to try this week, <25 words
      "search_query": string     // what to type into a search engine, without the area, <6 words
    }
  ],
  "encouragement": string        // one warm, practical sentence, <25 words
}"""


class SuggestRequest(BaseModel):
    user_id: str = Field(min_length=1, max_length=64)
    area: str = Field(min_length=2, max_length=80)
    interests: list[str] = Field(min_length=1, max_length=12)
    life_stage: Literal["later_life", "starting_out"]


class Suggestion(BaseModel):
    group_type: str
    why: str
    first_step: str
    search_query: str


class SuggestResponse(BaseModel):
    suggestions: list[Suggestion]
    encouragement: Optional[str] = None


def _clean(text: str, limit: int) -> str:
    return " ".join(str(text).split())[:limit]


def _mock(data: SuggestRequest) -> SuggestResponse:
    first = data.interests[0]
    return SuggestResponse(
        suggestions=[
            Suggestion(
                group_type=f"{first.title()} group",
                why=f"[DEV MOCK] You said you enjoy {first}; a regular group gives you the same faces each week.",
                first_step="[DEV MOCK] Find one that meets this week and go to a single session.",
                search_query=f"{first} group",
            ),
            Suggestion(
                group_type="Volunteering",
                why="[DEV MOCK] Working side by side makes conversation easy.",
                first_step="[DEV MOCK] Email one local charity and ask how to get started.",
                search_query="volunteer opportunities",
            ),
        ],
        encouragement="[DEV MOCK] Pick one and go twice. The second visit is where it starts.",
    )


@router.post("/suggest", response_model=SuggestResponse)
async def suggest_groups(data: SuggestRequest, request: Request):
    interests = [_clean(i, 40) for i in data.interests if i.strip()]
    if not interests:
        raise HTTPException(status_code=422, detail="Add at least one interest.")
    data = data.model_copy(update={"interests": interests, "area": _clean(data.area, 80)})

    now = time.time()
    forwarded = request.headers.get("x-forwarded-for", "")
    ip = forwarded.split(",")[0].strip() or (request.client.host if request.client else "unknown")
    if not _allow(f"u:{data.user_id}", PER_USER_DAILY, now) or not _allow(f"ip:{ip}", PER_IP_DAILY, now):
        raise HTTPException(status_code=429, detail="You've had a lot of suggestions today. Try again tomorrow.")

    api_key = os.getenv("ANTHROPIC_API_KEY", "").strip()
    if not api_key or api_key.endswith("..."):
        return _mock(data)

    try:
        client = AsyncAnthropic(api_key=api_key)
        msg = await client.messages.create(
            model=ANTHROPIC_MODEL,
            max_tokens=900,
            system=SUGGEST_SYSTEM_PROMPT,
            messages=[
                {
                    "role": "user",
                    "content": (
                        f"Area: {data.area}\n"
                        f"Interests: {', '.join(data.interests)}\n"
                        f"Life stage: {data.life_stage.replace('_', ' ')}"
                    ),
                }
            ],
        )
        text = "".join(block.text for block in msg.content if hasattr(block, "text"))
        result = _extract_json(text)
        suggestions = [
            Suggestion(
                group_type=_clean(s.get("group_type", ""), 60),
                why=_clean(s.get("why", ""), 200),
                first_step=_clean(s.get("first_step", ""), 200),
                search_query=_clean(s.get("search_query", ""), 60),
            )
            for s in result.get("suggestions", [])[:6]
            if s.get("group_type") and s.get("search_query")
        ]
        if not suggestions:
            raise ValueError("no usable suggestions")
        encouragement = result.get("encouragement")
        return SuggestResponse(
            suggestions=suggestions,
            encouragement=_clean(encouragement, 200) if encouragement else None,
        )
    except Exception as exc:
        # Log without the user's area/interests.
        print(f"[friends] suggest failed: {type(exc).__name__}")
        raise HTTPException(status_code=502, detail="Couldn't get suggestions right now. Try again shortly.")
