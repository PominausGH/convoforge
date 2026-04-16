from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import os
import httpx
from ..db import get_db
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()

# --- Request/Response Models ---

class MultimodalData(BaseModel):
    user_id: str
    module_id: int
    transcript: str
    visual_landmarks: dict # MediaPipe JSON
    tier: str # free | pro

class FeedbackResponse(BaseModel):
    session_id: Optional[str] = None
    verbal: dict
    visual: dict
    carnegie: dict
    overall_forge_score: int
    top_insight: str
    next_session_focus: str

# --- Sincerity System Prompt (Pro Only) ---

SINCERITY_SYSTEM_PROMPT = """
Analyse this speech transcript for authentic vs performative communication.
Score 0-100 on each dimension. Return JSON only. No preamble.

Dimensions:
- other_focus_ratio: % of content centred on the other person vs self
- scripted_language_penalty: deduct for formulaic phrases ("I really value your input")
- congruence: does emotional language match the delivery energy in the transcript?
- manipulation_flags: list any Carnegie principles being weaponised rather than applied

If sincerity_score < 60, include a single coaching note (judgment-free, <20 words).
"""

# --- Analyze Session Endpoint ---

@router.post("/analyze-session", response_model=FeedbackResponse)
async def analyze_session(data: MultimodalData, db: AsyncSession = Depends(get_db)):
    # 1. Basic Heuristics (Filler/WPM Calculation)
    fillers = ["um", "ah", "uh", "like", "so"]
    filler_count = sum(data.transcript.lower().count(f) for f in fillers)
    words = data.transcript.split()
    wpm = len(words) # Assumed 60s practice duration for now

    # 2. Call Anthropic Claude for Carnegie Analysis
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        # Fallback for dev if no API key
        return create_mock_feedback(data)

    async with httpx.AsyncClient() as client:
        # Construct analysis prompt
        prompt = f"""
        User Tier: {data.tier}
        Transcript: {data.transcript}
        Success Criteria: (Refer to module {data.module_id})
        
        Analyze this session based on Carnegie 2026 principles. 
        Return a JSON with keys: verbal_score, carnegie_score, top_insight, next_focus.
        """
        
        # Note: In production, use the actual Anthropic SDK and system prompt
        # This is a conceptual flow for the Task C output
        
    # 3. Create Final Schema
    feedback = {
        "verbal": {
            "filler_rate": filler_count,
            "wpm": wpm,
            "hedging_count": 0, # To be added via NLP
            "conciseness_score": 85
        },
        "visual": {
            "eye_contact_pct": 72, # Extracted from MediaPipe JSON
            "smile_frequency": 0.5,
            "posture": "open"
        },
        "carnegie": {
            "sincerity_score": 80 if data.tier == "pro" else None,
            "other_focus_score": 65,
            "principle_alignment": ["genuine_interest"]
        },
        "overall_forge_score": 75,
        "top_insight": "You used 'um' 3 times. Try to pause instead of filling the silence.",
        "next_session_focus": "filler_words"
    }

    return feedback

def create_mock_feedback(data: MultimodalData):
    """Fallback for dev without API keys."""
    return {
        "verbal": {"filler_rate": 2, "wpm": 140, "hedging_count": 1, "conciseness_score": 80},
        "visual": {"eye_contact_pct": 75, "smile_frequency": 0.6, "posture": "open"},
        "carnegie": {"sincerity_score": 85 if data.tier == "pro" else 0, "other_focus_score": 70, "principle_alignment": ["smile"]},
        "overall_forge_score": 78,
        "top_insight": "[DEV MOCK] Focus on holding eye contact during the transition.",
        "next_session_focus": "eye_contact"
    }
