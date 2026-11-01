'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { findLesson } from '@/lib/curriculum';
import { trackEvent, ANALYTICS_EVENTS } from '@/lib/analytics';
import {
    FRIEND_CHALLENGES,
    loadChallengeProgress,
    saveChallengeProgress,
    type ChallengeFeeling,
    type ChallengeProgress,
    type FriendChallenge,
    type LifeStage,
} from '@/lib/friendChallenges';

const FEELINGS: { key: ChallengeFeeling; label: string }[] = [
    { key: 'easier', label: 'Easier than I thought' },
    { key: 'expected', label: 'About what I expected' },
    { key: 'harder', label: 'Harder than I thought' },
];

const FEELING_REPLY: Record<ChallengeFeeling, string> = {
    easier: 'That happens a lot. Most people find it easier than they feared. Keep going.',
    expected: 'Steady progress. Each one makes the next one easier.',
    harder: "Well done for doing it anyway. That's how it gets easier.",
};

export default function FriendChallenges({ stage, isPro }: { stage: LifeStage; isPro: boolean }) {
    const [progress, setProgress] = useState<ChallengeProgress>({});
    const [loaded, setLoaded] = useState(false);
    const [askingFeeling, setAskingFeeling] = useState<string | null>(null);
    const [celebration, setCelebration] = useState<string | null>(null);
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        setProgress(loadChallengeProgress());
        setLoaded(true);
    }, []);

    useEffect(() => {
        setAskingFeeling(null);
        setCelebration(null);
    }, [stage]);

    const challenges = FRIEND_CHALLENGES.filter((c) => c.stage === stage);
    const doneCount = challenges.filter((c) => progress[c.id]).length;
    const next = challenges.find((c) => !progress[c.id]);

    const update = (nextProgress: ChallengeProgress) => {
        setProgress(nextProgress);
        saveChallengeProgress(nextProgress);
    };

    const complete = (challenge: FriendChallenge, feeling?: ChallengeFeeling) => {
        update({ ...progress, [challenge.id]: { done_at: new Date().toISOString(), feeling } });
        setAskingFeeling(null);
        setCelebration(feeling ? FEELING_REPLY[feeling] : 'Nice work. On to the next one.');
        try {
            navigator.vibrate?.([40, 60, 80]);
        } catch {
            /* haptics unsupported */
        }
        trackEvent(ANALYTICS_EVENTS.friendChallengeComplete, {
            challenge_id: challenge.id,
            stage,
            feeling: feeling ?? null,
        });
    };

    const undo = (challenge: FriendChallenge) => {
        const copy = { ...progress };
        delete copy[challenge.id];
        update(copy);
        setCelebration(null);
    };

    const rehearseLink = (challenge: FriendChallenge) => {
        if (!challenge.practiceLessonId) return null;
        const lesson = findLesson(challenge.practiceLessonId);
        if (!lesson || (!isPro && lesson.tier_required !== 'free')) return null;
        return (
            <Link
                href={`/session?lesson=${lesson.lesson_id}`}
                onClick={() =>
                    trackEvent(ANALYTICS_EVENTS.lessonStart, {
                        lesson_id: lesson.lesson_id,
                        tier: isPro ? 'pro' : 'free',
                        source: 'friend_challenge',
                    })
                }
                className="text-sm font-semibold border border-zinc-300 dark:border-zinc-700 rounded-full px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
                Rehearse it first
            </Link>
        );
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    {loaded ? `${doneCount} of ${challenges.length} done` : ' '}
                </span>
            </div>
            <div
                className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-5"
                role="progressbar"
                aria-valuenow={doneCount}
                aria-valuemin={0}
                aria-valuemax={challenges.length}
                aria-label="Challenges completed"
            >
                <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${(doneCount / challenges.length) * 100}%` }}
                />
            </div>

            {celebration && (
                <div role="status" className="mb-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 text-base text-emerald-900 dark:text-emerald-100">
                    🎉 {celebration}
                </div>
            )}

            {loaded && next && (
                <div className="border-2 border-zinc-900 dark:border-white rounded-2xl p-5">
                    <div className="text-[10px] uppercase tracking-widest font-bold text-rose-600 mb-1">
                        Your next challenge
                    </div>
                    <h3 className="text-xl font-black">{next.title}</h3>
                    <p className="text-base text-zinc-600 dark:text-zinc-300 mt-2 leading-relaxed">{next.detail}</p>

                    {askingFeeling === next.id ? (
                        <div className="mt-4">
                            <p className="text-sm font-semibold mb-2">How did it go?</p>
                            <div className="flex flex-col gap-2">
                                {FEELINGS.map((f) => (
                                    <button
                                        key={f.key}
                                        onClick={() => complete(next, f.key)}
                                        className="text-left text-base border border-zinc-300 dark:border-zinc-700 rounded-xl px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                    >
                                        {f.label}
                                    </button>
                                ))}
                                <button
                                    onClick={() => complete(next)}
                                    className="text-sm text-zinc-500 hover:underline self-start mt-1"
                                >
                                    Skip
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                            <button
                                onClick={() => {
                                    setCelebration(null);
                                    setAskingFeeling(next.id);
                                }}
                                className="bg-black dark:bg-white text-white dark:text-black font-bold text-base px-6 py-2.5 rounded-full active:scale-95 transition-transform"
                            >
                                I did it ✓
                            </button>
                            {rehearseLink(next)}
                        </div>
                    )}
                </div>
            )}

            {loaded && !next && (
                <div className="border-2 border-emerald-500 rounded-2xl p-5">
                    <h3 className="text-xl font-black">All {challenges.length} done 🎉</h3>
                    <p className="text-base text-zinc-600 dark:text-zinc-300 mt-2 leading-relaxed">
                        You went from finding a group to inviting people. Keep going back. Friendships grow with
                        time spent together.
                    </p>
                </div>
            )}

            <button
                onClick={() => setShowAll((v) => !v)}
                aria-expanded={showAll}
                className="mt-4 text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:underline"
            >
                {showAll ? 'Hide all challenges' : 'See all challenges'}
            </button>

            {showAll && (
                <ul className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-100 dark:border-zinc-800 rounded-2xl overflow-hidden">
                    {challenges.map((c, i) => {
                        const done = !!progress[c.id];
                        return (
                            <li key={c.id} className="flex items-start gap-3 p-4">
                                <button
                                    onClick={() => (done ? undo(c) : complete(c))}
                                    aria-pressed={done}
                                    aria-label={done ? `Mark "${c.title}" as not done` : `Mark "${c.title}" as done`}
                                    className={`shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-colors ${
                                        done
                                            ? 'bg-emerald-500 border-emerald-500 text-white'
                                            : 'border-zinc-300 dark:border-zinc-600 text-zinc-400'
                                    }`}
                                >
                                    {done ? '✓' : i + 1}
                                </button>
                                <div className="min-w-0">
                                    <div className={`font-bold ${done ? 'line-through text-zinc-400' : ''}`}>{c.title}</div>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">{c.detail}</p>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
