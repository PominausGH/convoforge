'use client';

import React, { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Avatar from '@/components/Avatar';
import LiveNudge from '@/components/LiveNudge';
import MediaPipeCamera from '@/components/MediaPipeCamera';
import ScoreCard from '@/components/ScoreCard';
import { analyzeSession, createSession, fetchUserProfile, type FeedbackResponse } from '@/lib/api';
import { startDeepgramStream, type DeepgramSession } from '@/lib/deepgram';
import { FillerMonitor } from '@/lib/filler';
import {
    findLesson,
    buildLessonScript,
    totalLessonsFor,
    type Lesson,
} from '@/lib/curriculum';
import type { VisualMetrics } from '@/lib/mediapipe';
import { speakText } from '@/lib/tts';
import { trackEvent, ANALYTICS_EVENTS } from '@/lib/analytics';

type SessionStatus = 'idle' | 'lesson' | 'practice' | 'live_coaching' | 'feedback';

const PRACTICE_DURATION_MS = 90_000;
const LESSON_CAP_MS = 120_000;

type SessionResult = {
    feedback: FeedbackResponse;
    streak_days: number | null;
    save_error?: string;
};

export default function SessionPageWrapper() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black" />}>
            <SessionPage />
        </Suspense>
    );
}

function SessionPage() {
    const router = useRouter();
    const search = useSearchParams();
    const [userId, setUserId] = useState<string | null>(null);
    const [tier, setTier] = useState<'free' | 'pro'>('free');
    const [status, setStatus] = useState<SessionStatus>('idle');
    const requestedLessonId = Number(search.get('lesson')) || 1;
    const [lessonId] = useState(requestedLessonId);
    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [nudgeMessage, setNudgeMessage] = useState<string | null>(null);
    const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);
    const [streamError, setStreamError] = useState<string | null>(null);
    const [streamStatus, setStreamStatus] = useState<string | null>(null);
    const [transcriptPreview, setTranscriptPreview] = useState<string>('');

    const visualRef = useRef<VisualMetrics>({
        eye_contact_pct: 0,
        smile_frequency: 0,
        posture: 'open',
        frame_count: 0,
    });
    const fillerRef = useRef(new FillerMonitor());
    const interimRef = useRef('');
    const dgRef = useRef<DeepgramSession | null>(null);
    const practiceStartRef = useRef<number>(0);

    useEffect(() => {
        const id = localStorage.getItem('cf_user_id');
        setUserId(id);
        if (id) fetchUserProfile(id).then((p) => setTier(p.tier)).catch(() => undefined);
        setLesson(findLesson(lessonId));
    }, [lessonId]);

    const handleVisualUpdate = useCallback((metrics: VisualMetrics) => {
        visualRef.current = metrics;
        if (status === 'practice' && metrics.frame_count > 30 && metrics.eye_contact_pct < 50) {
            setNudgeMessage('Find your anchor.');
        }
    }, [status]);

    const completeSession = useCallback(async () => {
        await dgRef.current?.stop();
        dgRef.current = null;

        const finalState = fillerRef.current.snapshot();
        const transcript = (finalState.transcript || interimRef.current || '').trim();
        const visual = visualRef.current;
        const elapsedSeconds = (Date.now() - practiceStartRef.current) / 1000 || 90;

        if (!userId) return;

        let feedback: FeedbackResponse | null = null;
        let analyzeError: string | undefined;
        try {
            feedback = await analyzeSession({
                user_id: userId,
                module_id: lessonId,
                transcript,
                visual,
                duration_seconds: elapsedSeconds,
                tier,
            });
        } catch (err) {
            analyzeError = err instanceof Error ? err.message : 'Analysis failed';
            console.warn('[session] analyze failed, will still save', err);
        }

        // Fallback so a single analyze hiccup doesn't cost the user their progress.
        const effectiveFeedback: FeedbackResponse =
            feedback ?? {
                verbal: {},
                visual: { eye_contact_pct: visual.eye_contact_pct },
                carnegie: { error: analyzeError ?? 'analyze_unavailable' },
                overall_forge_score: 0,
                top_insight:
                    'We couldn’t score this one, but the streak still counts. Try again tomorrow.',
                next_session_focus: 'try_again',
            };

        let streak: number | null = null;
        let saveError: string | undefined = analyzeError;
        try {
            const saved = await createSession({
                user_id: userId,
                module_id: lessonId,
                forge_score: effectiveFeedback.overall_forge_score,
                verbal_json: effectiveFeedback.verbal,
                visual_json: effectiveFeedback.visual,
                carnegie_json: effectiveFeedback.carnegie,
            });
            streak = saved.streak_days;
        } catch (err) {
            saveError = err instanceof Error ? err.message : saveError ?? 'Save failed';
        }

        setSessionResult({
            feedback: effectiveFeedback,
            streak_days: streak,
            save_error: saveError,
        });
        trackEvent(ANALYTICS_EVENTS.lessonComplete, {
            lesson_id: lessonId,
            tier,
            forge_score: effectiveFeedback.overall_forge_score,
            analyze_ok: feedback !== null,
            save_ok: !saveError,
            transcript_length: transcript.length,
        });
        setStatus('feedback');
    }, [userId, lessonId, tier]);

    // LESSON: speak the script, then advance to PRACTICE on speech-end (or 120s cap)
    useEffect(() => {
        if (status !== 'lesson' || !lesson) return;
        const handle = speakText(buildLessonScript(lesson), {
            audioUrl: `/audio/lesson-${lesson.lesson_id}.mp3`,
        });
        let cancelled = false;

        const cap = setTimeout(() => {
            if (cancelled) return;
            handle.stop();
            setStatus('practice');
        }, LESSON_CAP_MS);

        handle.done.then(() => {
            if (cancelled) return;
            clearTimeout(cap);
            setStatus('practice');
        });

        return () => {
            cancelled = true;
            clearTimeout(cap);
            handle.stop();
        };
    }, [status, lesson]);

    // PRACTICE: open Deepgram stream
    useEffect(() => {
        if (status !== 'practice') return;
        practiceStartRef.current = Date.now();
        fillerRef.current.reset();
        interimRef.current = '';

        let cancelled = false;
        startDeepgramStream(
            (segment, isFinal) => {
                if (isFinal) {
                    interimRef.current = '';
                    const state = fillerRef.current.ingest(segment);
                    if (state.nudge) setNudgeMessage(state.nudge);
                    setTranscriptPreview(state.transcript.slice(-200));
                } else {
                    interimRef.current = segment;
                    setTranscriptPreview(
                        (fillerRef.current.snapshot().transcript + ' ' + segment).slice(-200),
                    );
                }
            },
            (status) => setStreamStatus(status),
        )
            .then((session) => {
                if (cancelled) {
                    session.stop();
                    return;
                }
                dgRef.current = session;
            })
            .catch((err) => {
                console.error('Deepgram stream error:', err);
                setStreamError(err instanceof Error ? err.message : 'Mic stream failed');
            });

        return () => {
            cancelled = true;
            dgRef.current?.stop();
            dgRef.current = null;
        };
    }, [status]);

    // State machine timing — idle requires an explicit click to enter 'lesson'
    // so the browser's autoplay policy sees a fresh user gesture before we
    // try to play the avatar's audio.
    useEffect(() => {
        if (status === 'practice') {
            const t = setTimeout(() => setStatus('live_coaching'), PRACTICE_DURATION_MS);
            return () => clearTimeout(t);
        }
        if (status === 'live_coaching') {
            const t = setTimeout(() => completeSession(), 800);
            return () => clearTimeout(t);
        }
    }, [status, completeSession]);

    const totalLessons = totalLessonsFor(tier);
    const progressPct = Math.min(100, Math.round((lessonId / totalLessons) * 100));

    const statusLabel: Record<SessionStatus, string> = {
        idle: '',
        lesson: 'Avatar is delivering the lesson',
        practice: 'Recording your practice response',
        live_coaching: 'Analyzing your performance',
        feedback: 'Your results are ready',
    };

    return (
        <main className="min-h-screen bg-black text-white p-4 md:p-8 flex flex-col gap-6">
            {/* Preload the lesson's pre-rendered MP3 so the first audio.play() is instant. */}
            {lesson && (
                <link
                    rel="preload"
                    as="audio"
                    href={`/audio/lesson-${lesson.lesson_id}.mp3`}
                />
            )}

            <LiveNudge message={nudgeMessage} />

            <div
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className="sr-only"
            >
                {statusLabel[status]}
            </div>

            <div className="flex justify-between items-center px-4 gap-6">
                <div className="flex flex-col min-w-0">
                    <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                        Carnegie Module {lessonId} of {totalLessons}
                    </span>
                    <h1 className="text-xl font-black truncate">
                        {lesson?.title ?? 'Loading...'}
                    </h1>
                </div>
                <div
                    className="flex-1 max-w-[180px] h-1.5 bg-zinc-800 rounded-full overflow-hidden"
                    role="progressbar"
                    aria-valuenow={progressPct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Lesson ${lessonId} of ${totalLessons}`}
                >
                    <div
                        className="h-full bg-white transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                    />
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 [&>*]:min-h-[240px] md:[&>*]:min-h-[400px]">
                <Avatar status={status} />
                <MediaPipeCamera
                    isRecording={status === 'practice'}
                    onAnalysisUpdate={handleVisualUpdate}
                />
            </div>

            {lesson && (status === 'lesson' || status === 'practice') && (
                <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-4 text-sm text-zinc-300 leading-relaxed">
                    <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mr-2">
                        {status === 'lesson' ? 'Principle' : 'Your prompt'}
                    </span>
                    {status === 'lesson' ? lesson.carnegie_principle : lesson.practice_prompt}
                </div>
            )}

            <div className="h-20 flex items-center justify-center gap-4 bg-zinc-900/50 rounded-3xl border border-white/5 backdrop-blur-md px-6">
                {status === 'idle' && lesson && (
                    <div className="flex flex-col items-center gap-2">
                        <button
                            onClick={() => setStatus('lesson')}
                            className="bg-white text-black font-bold uppercase tracking-widest text-sm px-8 py-3 rounded-full active:scale-95 transition-all shadow-lg"
                        >
                            ▶ Start Lesson
                        </button>
                        <span className="text-[11px] text-zinc-500">
                            Will ask for camera + microphone
                        </span>
                    </div>
                )}
                {status === 'idle' && !lesson && (
                    <p className="text-sm text-zinc-500 animate-pulse">Loading lesson…</p>
                )}
                {status === 'lesson' && (
                    <>
                        <p className="text-sm font-medium animate-pulse text-zinc-400">Listening to Avatar...</p>
                        <button
                            onClick={() => setStatus('practice')}
                            className="text-xs font-semibold uppercase tracking-widest text-zinc-400 border border-zinc-700 px-4 py-2 rounded-full hover:bg-zinc-800 transition-colors"
                        >
                            Skip
                        </button>
                    </>
                )}
                {status === 'practice' && (
                    <>
                        <p className="text-sm font-medium text-red-400">Recording Practice Response...</p>
                        <button
                            onClick={() => setStatus('live_coaching')}
                            className="text-xs font-bold uppercase tracking-widest bg-red-500 text-white px-5 py-2 rounded-full hover:bg-red-400 active:scale-95 transition-all"
                        >
                            End Recording
                        </button>
                    </>
                )}
                {status === 'live_coaching' && (
                    <p className="text-sm font-medium animate-pulse text-blue-400">AI Analyzing Performance...</p>
                )}
                {streamError && (
                    <p className="text-xs text-red-400 ml-4">⚠ {streamError}</p>
                )}
                {status === 'practice' && streamStatus && !streamError && (
                    <p className="text-xs text-zinc-500 ml-4">{streamStatus}</p>
                )}
            </div>

            {status === 'practice' && (
                <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-3 text-xs text-zinc-400 leading-snug min-h-[3rem]">
                    <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mr-2">
                        Live transcript
                    </span>
                    {transcriptPreview || <em className="text-zinc-600">Waiting for speech...</em>}
                </div>
            )}

            {status === 'feedback' && sessionResult && (
                <ScoreCard
                    score={sessionResult.feedback.overall_forge_score}
                    streak={sessionResult.streak_days}
                    tier={tier}
                    verbal={{
                        filler_rate: sessionResult.feedback.verbal.filler_rate ?? 0,
                        wpm: sessionResult.feedback.verbal.wpm ?? 0,
                        hedging_count: sessionResult.feedback.verbal.hedging_count ?? 0,
                    }}
                    visual={{
                        eye_contact_pct: sessionResult.feedback.visual.eye_contact_pct ?? 0,
                        smile_frequency: sessionResult.feedback.visual.smile_frequency ?? 0,
                    }}
                    insight={sessionResult.feedback.top_insight}
                    saveError={sessionResult.save_error}
                    onClose={() => router.push('/')}
                    onRetry={() => {
                        setSessionResult(null);
                        setNudgeMessage(null);
                        setStreamError(null);
                        setStreamStatus(null);
                        setTranscriptPreview('');
                        fillerRef.current.reset();
                        interimRef.current = '';
                        visualRef.current = {
                            eye_contact_pct: 0,
                            smile_frequency: 0,
                            posture: 'open',
                            frame_count: 0,
                        };
                        setStatus('lesson');
                    }}
                />
            )}

            <div className="h-8" />
        </main>
    );
}
