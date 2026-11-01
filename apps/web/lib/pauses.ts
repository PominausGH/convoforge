/**
 * Pause tracking from Deepgram word timestamps.
 *
 * Deepgram's word start/end times are relative to the start of the stream, so
 * gaps between consecutive final words measure real silence, across segments.
 *
 * - clean pause: a 0.5–3s silence not touching an "um"/"uh" (a deliberate beat)
 * - long gap: a silence over 3s (usually a lost thread, not a dramatic pause)
 * - run: continuous speech with no clean pause; long runs feel rushed
 */
export type WordTiming = { word: string; start: number; end: number };

export type PauseStats = {
    pause_count: number;
    long_gap_count: number;
    pauses_per_min: number;
    avg_pause_s: number;
    longest_run_s: number;
};

const PAUSE_MIN_S = 0.5;
const LONG_GAP_S = 3.0;
const RUN_NUDGE_S = 20;
const NUDGE_COOLDOWN_MS = 15_000;
const FILLER_SOUNDS = new Set(['um', 'uh', 'ah', 'er', 'hmm', 'mm']);

const isFillerSound = (w: string) => FILLER_SOUNDS.has(w.toLowerCase().replace(/[^a-z]/g, ''));

export class PauseTracker {
    private firstStart: number | null = null;
    private lastEnd: number | null = null;
    private lastWord = '';
    private runStart: number | null = null;
    private longestRun = 0;
    private pauseCount = 0;
    private pauseTotal = 0;
    private longGapCount = 0;
    private lastNudgeAt = 0;

    reset() {
        this.firstStart = null;
        this.lastEnd = null;
        this.lastWord = '';
        this.runStart = null;
        this.longestRun = 0;
        this.pauseCount = 0;
        this.pauseTotal = 0;
        this.longGapCount = 0;
        this.lastNudgeAt = 0;
    }

    /** Feed the words of one final segment. Returns a nudge if they've been talking too long without a breath. */
    ingest(words: WordTiming[]): string | null {
        for (const w of words) {
            if (!Number.isFinite(w.start) || !Number.isFinite(w.end)) continue;
            if (this.firstStart === null) this.firstStart = w.start;
            if (this.runStart === null) this.runStart = w.start;

            if (this.lastEnd !== null) {
                const gap = w.start - this.lastEnd;
                if (gap >= LONG_GAP_S) {
                    this.longGapCount += 1;
                    this.closeRun(this.lastEnd, w.start);
                } else if (gap >= PAUSE_MIN_S && !isFillerSound(w.word) && !isFillerSound(this.lastWord)) {
                    this.pauseCount += 1;
                    this.pauseTotal += gap;
                    this.closeRun(this.lastEnd, w.start);
                }
            }
            this.lastEnd = Math.max(this.lastEnd ?? w.end, w.end);
            this.lastWord = w.word;
        }

        const currentRun = this.runStart !== null && this.lastEnd !== null ? this.lastEnd - this.runStart : 0;
        const now = Date.now();
        if (currentRun >= RUN_NUDGE_S && now - this.lastNudgeAt >= NUDGE_COOLDOWN_MS) {
            this.lastNudgeAt = now;
            return 'Pause. Let it land.';
        }
        return null;
    }

    private closeRun(runEnd: number, nextStart: number) {
        if (this.runStart !== null) this.longestRun = Math.max(this.longestRun, runEnd - this.runStart);
        this.runStart = nextStart;
    }

    /** Null when no word timings arrived (e.g. Deepgram unavailable), so the server knows pacing is unmeasured. */
    snapshot(): PauseStats | null {
        if (this.firstStart === null || this.lastEnd === null) return null;
        const spoken = Math.max(this.lastEnd - this.firstStart, 1);
        const openRun = this.runStart !== null ? this.lastEnd - this.runStart : 0;
        const round1 = (n: number) => Math.round(n * 10) / 10;
        return {
            pause_count: this.pauseCount,
            long_gap_count: this.longGapCount,
            pauses_per_min: round1((this.pauseCount / spoken) * 60),
            avg_pause_s: this.pauseCount ? round1(this.pauseTotal / this.pauseCount) : 0,
            longest_run_s: round1(Math.max(this.longestRun, openRun)),
        };
    }
}
