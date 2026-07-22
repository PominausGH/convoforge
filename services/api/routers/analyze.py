import json
import os
from typing import Optional

from anthropic import AsyncAnthropic
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from utils.transcript import analyze_transcript

router = APIRouter()

ANTHROPIC_MODEL = "claude-sonnet-4-20250514"

CARNEGIE_SYSTEM_PROMPT = """You are a Carnegie 2026 communication coach analyzing a practice session.
Return JSON only, no preamble. Schema:
{
  "carnegie": {
    "other_focus_score": int 0-100,
    "principle_alignment": [string]
  },
  "overall_forge_score": int 0-100,
  "top_insight": string (one actionable sentence, judgment-free, <30 words),
  "next_session_focus": string (one of: filler_words, eye_contact, hedging, pace, sincerity, openness)
}
Weight: verbal 40%, visual 30%, carnegie 30%."""

SINCERITY_SYSTEM_PROMPT = """Analyse this speech transcript for authentic vs performative communication.
Return JSON only, no preamble. Schema:
{
  "sincerity_score": int 0-100,
  "other_focus_ratio": float 0-1,
  "scripted_language_penalty": int,
  "congruence": int 0-100,
  "manipulation_flags": [string],
  "coaching_note": string|null  // populate only when sincerity_score < 60, judgment-free, <20 words
}"""


class MultimodalData(BaseModel):
    user_id: str
    module_id: int
    transcript: str
    visual: dict  # { eye_contact_pct, smile_frequency, posture }
    duration_seconds: float = 90.0
    tier: str = "free"


class FeedbackResponse(BaseModel):
    verbal: dict
    visual: dict
    carnegie: dict
    overall_forge_score: int
    top_insight: str
    next_session_focus: str


def _mock_feedback(verbal: dict, visual: dict, tier: str) -> FeedbackResponse:
    return FeedbackResponse(
        verbal=verbal,
        visual=visual,
        carnegie={
            "sincerity_score": 80 if tier == "pro" else None,
            "other_focus_score": 65,
            "principle_alignment": ["genuine_interest"],
        },
        overall_forge_score=75,
        top_insight="[DEV MOCK] Replace 'I think maybe' with a direct statement.",
        next_session_focus="hedging",
    )


def _extract_json(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.lower().startswith("json"):
            text = text[4:]
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError(f"No JSON object in response: {text[:200]}")
    return json.loads(text[start : end + 1])


async def _call_claude(client: AsyncAnthropic, system: str, user_payload: dict) -> dict:
    msg = await client.messages.create(
        model=ANTHROPIC_MODEL,
        max_tokens=600,
        system=system,
        messages=[{"role": "user", "content": json.dumps(user_payload)}],
    )
    text = "".join(block.text for block in msg.content if hasattr(block, "text"))
    return _extract_json(text)


@router.post("/analyze-session", response_model=FeedbackResponse)
async def analyze_session(data: MultimodalData):
    verbal = analyze_transcript(data.transcript, data.duration_seconds)

    api_key = os.getenv("ANTHROPIC_API_KEY", "").strip()
    if not api_key or api_key.endswith("..."):
        return _mock_feedback(verbal, data.visual, data.tier)

    client = AsyncAnthropic(api_key=api_key)

    try:
        carnegie_payload = {
            "module_id": data.module_id,
            "transcript": data.transcript,
            "verbal_metrics": verbal,
            "visual_metrics": data.visual,
        }
        carnegie_result = await _call_claude(client, CARNEGIE_SYSTEM_PROMPT, carnegie_payload)
    except Exception as exc:
        # Don't 502 the whole session over an LLM blip — fall back to mock so the
        # user still gets a forge score and the front-end flow completes.
        print(f"[analyze] Carnegie call failed, using mock: {exc}")
        return _mock_feedback(verbal, data.visual, data.tier)

    carnegie_block = carnegie_result.get("carnegie", {})

    if data.tier == "pro":
        try:
            sincerity = await _call_claude(
                client,
                SINCERITY_SYSTEM_PROMPT,
                {"transcript": data.transcript},
            )
            carnegie_block.update(
                {
                    "sincerity_score": sincerity.get("sincerity_score"),
                    "other_focus_ratio": sincerity.get("other_focus_ratio"),
                    "manipulation_flags": sincerity.get("manipulation_flags", []),
                    "coaching_note": sincerity.get("coaching_note"),
                }
            )
        except Exception:
            carnegie_block["sincerity_score"] = None

    return FeedbackResponse(
        verbal=verbal,
        visual=data.visual,
        carnegie=carnegie_block,
        overall_forge_score=int(carnegie_result.get("overall_forge_score", 70)),
        top_insight=carnegie_result.get("top_insight", "Keep practicing daily."),
        next_session_focus=carnegie_result.get("next_session_focus", "filler_words"),
    )
