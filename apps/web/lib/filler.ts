/**
 * Client-side incremental filler/hedge/WPM tracker.
 * Mirrors modules/filler_detection.py for parity with the server-side analyzer.
 */
const FILLER_PATTERNS: RegExp[] = [
    /\bum\b/g, /\bah\b/g, /\buh\b/g, /\ber\b/g,
    /\blike\b/g, /\byou know\b/g, /\bactually\b/g,
];

const HEDGES: string[] = [
    'i think maybe',
    "i'm not sure but",
    'sort of',
    'kind of',
    'just my opinion',
    'i guess',
    'probably',
];

const NUDGE_COOLDOWN_MS = 10_000;

export type FillerState = {
    transcript: string;
    totalWords: number;
    totalFillers: number;
    totalHedges: number;
    wpm: number;
    nudge: string | null;
};

export class FillerMonitor {
    private startMs = Date.now();
    private transcript = '';
    private totalWords = 0;
    private totalFillers = 0;
    private totalHedges = 0;
    private lastNudgeAt = 0;

    reset() {
        this.startMs = Date.now();
        this.transcript = '';
        this.totalWords = 0;
        this.totalFillers = 0;
        this.totalHedges = 0;
        this.lastNudgeAt = 0;
    }

    ingest(segment: string): FillerState {
        const clean = segment.toLowerCase().trim();
        if (clean) {
            this.transcript = this.transcript ? `${this.transcript} ${clean}` : clean;
        }

        const words = clean.split(/\s+/).filter(Boolean);
        this.totalWords += words.length;

        let segmentFillers = 0;
        for (const pat of FILLER_PATTERNS) {
            segmentFillers += (clean.match(pat) || []).length;
        }
        this.totalFillers += segmentFillers;

        let segmentHedges = 0;
        for (const h of HEDGES) {
            if (clean.includes(h)) segmentHedges += 1;
        }
        this.totalHedges += segmentHedges;

        const minutes = Math.max((Date.now() - this.startMs) / 60_000, 1 / 60);
        const wpm = Math.round((this.totalWords / minutes) * 10) / 10;

        return {
            transcript: this.transcript,
            totalWords: this.totalWords,
            totalFillers: this.totalFillers,
            totalHedges: this.totalHedges,
            wpm,
            nudge: this.computeNudge(wpm, segmentFillers, segmentHedges),
        };
    }

    private computeNudge(wpm: number, segFillers: number, segHedges: number): string | null {
        const now = Date.now();
        if (now - this.lastNudgeAt < NUDGE_COOLDOWN_MS) return null;

        let trigger: string | null = null;
        if (wpm > 180) trigger = 'Slow it down.';
        else if (segFillers >= 2) trigger = 'Take a breath.';
        else if (segHedges >= 1) trigger = 'Own that statement.';

        if (trigger) this.lastNudgeAt = now;
        return trigger;
    }

    snapshot(): FillerState {
        const minutes = Math.max((Date.now() - this.startMs) / 60_000, 1 / 60);
        return {
            transcript: this.transcript,
            totalWords: this.totalWords,
            totalFillers: this.totalFillers,
            totalHedges: this.totalHedges,
            wpm: Math.round((this.totalWords / minutes) * 10) / 10,
            nudge: null,
        };
    }
}
