import json
import os
from typing import Optional

from anthropic import AsyncAnthropic
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

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

Judge pacing from `verbal_metrics.pauses`, measured from real word timings:
- pause_count / pauses_per_min: clean silences of 0.5-3s (not next to "um"/"uh"). A story that
  holds friends' attention breathes: roughly 4-10 clean pauses per minute, ideally one right
  before the turn and one before the takeaway/punchline.
- longest_run_s: longest stretch of speech without a clean pause. Over ~20s reads as rushed.
- long_gap_count: silences over 3s - usually a lost thread, not a dramatic beat.
If `pauses` is null, timings weren't available: estimate pacing loosely from sentence rhythm and
set pacing_score to null.

Return JSON only, no preamble. Schema:
{
  "carnegie": {
    "structure_score": int 0-100,       // how completely & cleanly the 5 beats are present
    "beats_present": [string],           // subset of ["hook","context","turn","resolution","takeaway"] clearly present
    "hook_quality": int 0-100,           // does the opening create curiosity/tension fast, with no throat-clearing
    "energy_score": int 0-100,           // vividness/specificity/rhythm variety as a passion proxy
    "pacing_score": int 0-100 | null,    // use of deliberate pauses, per the pacing guidance above
    "principle_alignment": [string]
  },
  "overall_forge_score": int 0-100,      // weight: structure 35%, hook 15%, energy 20%, pacing 15%, conciseness (from verbal_metrics) 15%; if pacing is null, fold its weight into structure
  "top_insight": string (one actionable sentence naming the weakest beat or pacing issue, judgment-free, <30 words),
  "next_session_focus": string (one of: hook, structure, energy, pauses, conciseness, takeaway),
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


FRIENDS_SYSTEM_PROMPT = """You are a warm, judgment-free social-connection coach. The speaker is practicing
how to meet people and make friends through groups: clubs, classes, volunteering, meetups. They may be
older (retired, recently moved, newly on their own) or young (new to a city, after school). The
scenario they responded to is given in `practice_prompt`, along with its `success_criteria`.

Judge the spoken response (`transcript`) on three axes:
1. Warmth: friendly, relaxed, and genuine, not apologetic, stiff, or salesy.
2. Curiosity: asks at least one genuine, specific question about the other person or group and
   gives them something easy to respond to, instead of only talking about themselves.
3. Next step: where the scenario calls for it, moves the connection forward with something concrete
   (a name, a specific plan/time/place, a reason to meet again) while leaving an easy out.

Return JSON only, no preamble. Schema:
{
  "carnegie": {
    "warmth_score": int 0-100,
    "curiosity_score": int 0-100,
    "next_step_score": int 0-100,
    "criteria_met": [string],            // which success_criteria were clearly met
    "principle_alignment": [string]
  },
  "overall_forge_score": int 0-100,      // weight: warmth 35%, curiosity 35%, next step 30%
  "top_insight": string (one encouraging, actionable sentence naming the weakest axis, <30 words),
  "next_session_focus": string (one of: warmth, curiosity, next_step, conciseness),
  "rewrite_example": string (one line they could actually say in this scenario that fixes the weakest
    axis, <30 words, or null if nothing weak stands out)
}"""


class PauseStats(BaseModel):
    pause_count: int = Field(ge=0, le=10_000)
    long_gap_count: int = Field(ge=0, le=10_000)
    pauses_per_min: float = Field(ge=0, le=1_000)
    avg_pause_s: float = Field(ge=0, le=60)
    longest_run_s: float = Field(ge=0, le=3_600)


class MultimodalData(BaseModel):
    user_id: str
    module_id: int
    transcript: str
    visual: dict  # { eye_contact_pct, smile_frequency, posture }
    duration_seconds: float = 90.0
    tier: str = "free"
    track: Optional[str] = None
    stimulus: Optional[str] = None  # original text the user was reflecting on (active_listening only)
    pauses: Optional[PauseStats] = None  # from Deepgram word timings; None if unavailable
    practice_prompt: Optional[str] = Field(default=None, max_length=2000)  # new_friends only
    success_criteria: Optional[list[str]] = Field(default=None, max_length=10)  # new_friends only


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
                "pacing_score": 60 if verbal.get("pauses") else None,
                "principle_alignment": ["tension_structure"],
            },
            overall_forge_score=72,
            top_insight="[DEV MOCK] You skipped the takeaway — end with the one line that says why this mattered.",
            next_session_focus="takeaway",
            rewrite_example="[DEV MOCK] \"...and that's why I still double-check every number before it leaves my desk.\"",
        )
    if track == "new_friends":
        return FeedbackResponse(
            verbal=verbal,
            visual=visual,
            carnegie={
                "warmth_score": 78,
                "curiosity_score": 62,
                "next_step_score": 55,
                "criteria_met": [],
                "principle_alignment": ["genuine_interest"],
            },
            overall_forge_score=66,
            top_insight="[DEV MOCK] Warm start. Next time, end with a specific plan so the connection has somewhere to go.",
            next_session_focus="next_step",
            rewrite_example="[DEV MOCK] \"I'm grabbing a coffee after next week's walk. Want to join me? No worries if not.\"",
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
    verbal["pauses"] = data.pauses.model_dump() if data.pauses else None
    is_story = data.track == "storytelling"
    is_listening = data.track == "active_listening"
    is_friends = data.track == "new_friends"

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
        if is_friends:
            result_payload["practice_prompt"] = data.practice_prompt or ""
            result_payload["success_criteria"] = data.success_criteria or []
        if is_story:
            system_prompt = STORY_SYSTEM_PROMPT
        elif is_listening:
            system_prompt = LISTENING_SYSTEM_PROMPT
        elif is_friends:
            system_prompt = FRIENDS_SYSTEM_PROMPT
        else:
            system_prompt = CARNEGIE_SYSTEM_PROMPT
        result = await _call_claude(client, system_prompt, result_payload)
    except Exception as exc:
        # Don't 502 the whole session over an LLM blip — fall back to mock so the
        # user still gets a forge score and the front-end flow completes.
        kind = "Story" if is_story else "Listening" if is_listening else "Friends" if is_friends else "Carnegie"
        print(f"[analyze] {kind} call failed, using mock: {exc}")
        return _mock_feedback(verbal, data.visual, data.tier, data.track)

    carnegie_block = result.get("carnegie", {})

    if data.tier == "pro" and not is_story and not is_listening and not is_friends:
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
        rewrite_example=result.get("rewrite_example") if (is_story or is_listening or is_friends) else None,
    )
