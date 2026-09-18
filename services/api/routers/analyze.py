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

STORY_SYSTEM_PROMPT = """You are a storytelling coach. The speaker is practicing telling a short,
personal or professional story out loud, judged against a five-beat structure:
Hook (grabs attention in the first ~8s, no procedural opener) -> Context (one sentence of
who/where/when) -> Turn (the complication or tension - the "but") -> Resolution (the specific
action taken - the "therefore") -> Takeaway (the one-line "so what").

Also judge delivery energy from the transcript itself: concrete/sensory language vs abstract
corporate-speak, varied sentence rhythm vs monotone strings of short flat clauses, and specific
emotion named plainly vs hedged or absent. This is a proxy for vocal passion since only the
transcript is available, not audio.

Return JSON only, no preamble. Schema:
{
  "carnegie": {
    "structure_score": int 0-100,       // how completely & cleanly the 5 beats are present
    "beats_present": [string],           // subset of ["hook","context","turn","resolution","takeaway"] clearly present
    "hook_quality": int 0-100,           // does the opening create curiosity/tension fast, with no throat-clearing
    "energy_score": int 0-100,           // vividness/specificity/rhythm variety as a passion proxy
    "principle_alignment": [string]
  },
  "overall_forge_score": int 0-100,      // weight: structure 40%, hook 20%, energy 25%, conciseness (from verbal_metrics) 15%
  "top_insight": string (one actionable sentence naming the weakest beat, judgment-free, <30 words),
  "next_session_focus": string (one of: hook, structure, energy, conciseness, takeaway),
  "rewrite_example": string (a single rewritten line demonstrating a stronger version of the
    speaker's weakest beat, in their own scenario, <30 words, or null if nothing weak stands out)
}"""

LISTENING_SYSTEM_PROMPT = """You are an active-listening coach. The speaker just heard a short story or
complaint read aloud (given to you as `stimulus`), and then spoke a reflection of it back — their job was
to paraphrase what they heard, not deliver an unrelated monologue.

Judge the reflection (`transcript`) against the original `stimulus` on two distinct axes:
1. Accuracy: did they capture the key facts/events and the speaker's actual point, in their own words
   (not verbatim repetition, but not missing or inventing key details either)?
2. Validation: did they name or acknowledge the underlying feeling/perspective (e.g. frustration, pride,
   dread) explicitly, rather than only reciting facts back? A factually accurate but emotionally flat
   recap should score low on validation even if accuracy is high.

Return JSON only, no preamble. Schema:
{
  "carnegie": {
    "accuracy_score": int 0-100,          // how well the key facts/point were captured, in the user's own words
    "key_points_captured": [string],       // which specific facts/points from the stimulus were reflected back
    "key_points_missed": [string],         // notable facts/points from the stimulus that were left out
    "validation_score": int 0-100,         // how clearly the emotional/perspective layer was acknowledged, not just facts
    "paraphrase_quality": int 0-100,       // own-words paraphrase vs verbatim repetition of the stimulus
    "principle_alignment": [string]
  },
  "overall_forge_score": int 0-100,        // weight: accuracy 40%, validation 35%, paraphrase quality 25%
  "top_insight": string (one actionable sentence naming the weakest axis, judgment-free, <30 words),
  "next_session_focus": string (one of: accuracy, validation, paraphrasing, conciseness),
  "rewrite_example": string (a single rewritten line demonstrating a stronger reflection combining an
    unmet fact and the named feeling, <30 words, or null if nothing weak stands out)
}"""


class MultimodalData(BaseModel):
    user_id: str
    module_id: int
    transcript: str
    visual: dict  # { eye_contact_pct, smile_frequency, posture }
    duration_seconds: float = 90.0
    tier: str = "free"
    track: Optional[str] = None
    stimulus: Optional[str] = None  # original text the user was reflecting on (active_listening only)


class FeedbackResponse(BaseModel):
    verbal: dict
    visual: dict
    carnegie: dict
    overall_forge_score: int
    top_insight: str
    next_session_focus: str
    rewrite_example: Optional[str] = None


def _mock_feedback(verbal: dict, visual: dict, tier: str, track: Optional[str] = None) -> FeedbackResponse:
    if track == "storytelling":
        return FeedbackResponse(
            verbal=verbal,
            visual=visual,
            carnegie={
                "structure_score": 70,
                "beats_present": ["hook", "turn", "resolution"],
                "hook_quality": 65,
                "energy_score": 72,
                "principle_alignment": ["tension_structure"],
            },
            overall_forge_score=72,
            top_insight="[DEV MOCK] You skipped the takeaway — end with the one line that says why this mattered.",
            next_session_focus="takeaway",
            rewrite_example="[DEV MOCK] \"...and that's why I still double-check every number before it leaves my desk.\"",
        )
    if track == "active_listening":
        return FeedbackResponse(
            verbal=verbal,
            visual=visual,
            carnegie={
                "accuracy_score": 68,
                "key_points_captured": ["reorg happening", "effective immediately"],
                "key_points_missed": ["manager also wasn't told why"],
                "validation_score": 55,
                "paraphrase_quality": 72,
                "principle_alignment": ["active_listening"],
            },
            overall_forge_score=64,
            top_insight="[DEV MOCK] You got the facts — now name how they felt about it, not just what happened.",
            next_session_focus="validation",
            rewrite_example="[DEV MOCK] \"It sounds like this whole thing left you feeling blindsided and a little powerless.\"",
        )
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
    is_story = data.track == "storytelling"
    is_listening = data.track == "active_listening"

    api_key = os.getenv("ANTHROPIC_API_KEY", "").strip()
    if not api_key or api_key.endswith("..."):
        return _mock_feedback(verbal, data.visual, data.tier, data.track)

    client = AsyncAnthropic(api_key=api_key)

    try:
        result_payload = {
            "module_id": data.module_id,
            "transcript": data.transcript,
            "verbal_metrics": verbal,
            "visual_metrics": data.visual,
        }
        if is_listening:
            result_payload["stimulus"] = data.stimulus or ""
        if is_story:
            system_prompt = STORY_SYSTEM_PROMPT
        elif is_listening:
            system_prompt = LISTENING_SYSTEM_PROMPT
        else:
            system_prompt = CARNEGIE_SYSTEM_PROMPT
        result = await _call_claude(client, system_prompt, result_payload)
    except Exception as exc:
        # Don't 502 the whole session over an LLM blip — fall back to mock so the
        # user still gets a forge score and the front-end flow completes.
        kind = "Story" if is_story else "Listening" if is_listening else "Carnegie"
        print(f"[analyze] {kind} call failed, using mock: {exc}")
        return _mock_feedback(verbal, data.visual, data.tier, data.track)

    carnegie_block = result.get("carnegie", {})

    if data.tier == "pro" and not is_story and not is_listening:
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
        overall_forge_score=int(result.get("overall_forge_score", 70)),
        top_insight=result.get("top_insight", "Keep practicing daily."),
        next_session_focus=result.get("next_session_focus", "filler_words"),
        rewrite_example=result.get("rewrite_example") if (is_story or is_listening) else None,
    )
