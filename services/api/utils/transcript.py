"""Server-side transcript analysis. Mirrors the streaming FillerMonitor in /modules
but operates on a completed transcript for the post-session analyze pipeline."""
from __future__ import annotations

import re
from typing import Dict, List

FILLERS: List[str] = [
    r"\bum\b", r"\bah\b", r"\buh\b", r"\ber\b",
    r"\blike\b", r"\byou know\b", r"\bactually\b",
]

HEDGES: List[str] = [
    "i think maybe",
    "i'm not sure but",
    "sort of",
    "kind of",
    "just my opinion",
    "i guess",
    "probably",
]


def analyze_transcript(transcript: str, duration_seconds: float) -> Dict:
    text = transcript.lower().strip()
    words = text.split()
    word_count = len(words)

    filler_count = sum(len(re.findall(p, text)) for p in FILLERS)
    hedge_count = sum(text.count(h) for h in HEDGES)

    minutes = max(duration_seconds / 60.0, 1.0 / 60.0)
    wpm = round(word_count / minutes, 1) if word_count else 0.0
    filler_rate = round((filler_count / word_count) * 100, 2) if word_count else 0.0
    conciseness = max(0, 100 - filler_count * 5 - hedge_count * 8)

    return {
        "filler_count": filler_count,
        "filler_rate": filler_rate,
        "wpm": wpm,
        "hedging_count": hedge_count,
        "conciseness_score": conciseness,
        "word_count": word_count,
    }
