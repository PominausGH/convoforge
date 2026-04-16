import time
import re
from typing import List, Dict, Optional

class FillerMonitor:
    """
    Real-time monitor for speech analytics (Fillers, Hedging, WPM).
    Designed to process incremental transcripts from Deepgram.
    """
    
    FILLERS = [
        r'\bum\b', r'\bah\b', r'\buh\b', r'\ber\b', 
        r'\blike\b', r'\byou know\b', r'\bactually\b'
    ]
    
    HEDGING_PHRASES = [
        "i think maybe",
        "i'm not sure but",
        "sort of",
        "kind of",
        "just my opinion",
        "i guess",
        "probably"
    ]

    def __init__(self):
        self.start_time = time.time()
        self.total_words = 0
        self.filler_count = 0
        self.hedging_count = 0
        self.last_nudge_time = 0
        self.processed_segments = []

    def process_incremental_text(self, text: str) -> Dict:
        """
        Process a new segment of text and return current session metrics.
        """
        clean_text = text.lower().strip()
        words = clean_text.split()
        segment_word_count = len(words)
        
        # 1. Track Counts
        self.total_words += segment_word_count
        
        # Detect Fillers
        segment_fillers = 0
        for pattern in self.FILLERS:
            segment_fillers += len(re.findall(pattern, clean_text))
        self.filler_count += segment_fillers
        
        # Detect Hedging
        segment_hedges = 0
        for phrase in self.HEDGING_PHRASES:
            if phrase in clean_text:
                segment_hedges += 1
        self.hedging_count += segment_hedges

        # 2. Calculate WPM
        elapsed_minutes = (time.time() - self.start_time) / 60
        wpm = self.total_words / elapsed_minutes if elapsed_minutes > 0 else 0

        # 3. Check for Nudge Triggers
        nudge = self._get_nudge_trigger(wpm, segment_fillers, segment_hedges)

        return {
            "wpm": round(wpm, 1),
            "total_fillers": self.filler_count,
            "total_hedges": self.hedging_count,
            "nudge_triggered": nudge
        }

    def _get_nudge_trigger(self, wpm: float, segment_fillers: int, segment_hedges: int) -> Optional[str]:
        """
        Logic to determine if a live nudge should be issued (<5 words).
        Prevents nudge spamming (cool-down of 10 seconds).
        """
        now = time.time()
        if now - self.last_nudge_time < 10:
            return None

        trigger = None
        
        if wpm > 180:
            trigger = "Slow it down."
        elif segment_fillers >= 2:
            trigger = "Take a breath."
        elif segment_hedges >= 1:
            trigger = "Own that statement."

        if trigger:
            self.last_nudge_time = now
            return trigger
            
        return None

    def get_final_report(self) -> Dict:
        """Return full session analytics for the feedback engine."""
        return {
            "duration_seconds": round(time.time() - self.start_time, 1),
            "total_words": self.total_words,
            "filler_rate": round(self.filler_count / (self.total_words/100), 2) if self.total_words > 0 else 0,
            "hedging_count": self.hedging_count,
            "avg_wpm": round(self.total_words / ((time.time() - self.start_time)/60), 1)
        }
