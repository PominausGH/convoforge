'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { trackEvent, ANALYTICS_EVENTS } from '@/lib/analytics';

const DISMISS_KEY = 'cf_save_prompt_dismissed_at';
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

/** Gentle "save your progress" nudge for anonymous users who have practiced at least once. */
export default function SaveProgressCard({ streak, sessions }: { streak: number; sessions: number }) {
    const [show, setShow] = useState(false);

    useEffect(() => {
        let snoozed = false;
        try {
            const at = Number(localStorage.getItem(DISMISS_KEY) || 0);
            snoozed = Date.now() - at < SNOOZE_MS;
        } catch {
            /* ignore */
        }
        if (!snoozed) {
            setShow(true);
            trackEvent(ANALYTICS_EVENTS.saveProgressPromptShown, { streak, sessions });
        }
    }, [streak, sessions]);

    if (!show) return null;

    const headline =
        streak >= 2 ? `Keep your ${streak}-day streak safe` : 'Save your progress';

    return (
        <div className="w-full bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
            <p className="text-sm font-bold text-blue-900 dark:text-blue-100">{headline}</p>
            <p className="text-sm text-blue-800 dark:text-blue-200 mt-1 leading-relaxed">
                Right now it only lives in this browser. Add your email to keep it if you change phone or use
                another device. No password needed.
            </p>
            <div className="flex items-center gap-4 mt-3">
                <Link
                    href="/signin"
                    className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-4 py-2 rounded-full"
                >
                    Save my progress
                </Link>
                <button
                    onClick={() => {
                        try {
                            localStorage.setItem(DISMISS_KEY, String(Date.now()));
                        } catch {
                            /* ignore */
                        }
                        setShow(false);
                    }}
                    className="text-sm text-blue-700 dark:text-blue-300 hover:underline"
                >
                    Not now
                </button>
            </div>
        </div>
    );
}
