'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { verifySignIn, type SignInResult } from '@/lib/api';
import { adoptAccount, getUserId } from '@/lib/identity';
import { trackEvent, ANALYTICS_EVENTS } from '@/lib/analytics';

export default function VerifyPageWrapper() {
    return (
        <Suspense fallback={null}>
            <VerifyPage />
        </Suspense>
    );
}

function VerifyPage() {
    const search = useSearchParams();
    const [result, setResult] = useState<SignInResult | null>(null);
    const [error, setError] = useState('');
    const started = useRef(false);

    useEffect(() => {
        // Links are one-time: guard against React running this twice.
        if (started.current) return;
        started.current = true;
        const token = search.get('token');
        // Drop the token from the address bar and history straight away.
        window.history.replaceState(null, '', '/auth/verify');
        if (!token) {
            setError('This link is missing its code. Ask for a new one.');
            return;
        }
        verifySignIn(token, getUserId())
            .then((r) => {
                adoptAccount(r.user_id, r.email);
                setResult(r);
                trackEvent(ANALYTICS_EVENTS.signInComplete, {
                    switched: r.switched_account,
                    tier: r.tier,
                });
            })
            .catch((err) => setError(err instanceof Error ? err.message : 'Sign-in failed.'));
    }, [search]);

    return (
        <main className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
            <div className="max-w-md mx-auto px-4 pt-16 pb-16">
                {!result && !error && <p className="text-base text-zinc-500 animate-pulse">Signing you in…</p>}

                {error && (
                    <>
                        <h1 className="text-3xl font-black tracking-tight mb-3">That link didn&rsquo;t work</h1>
                        <p className="text-base text-zinc-600 dark:text-zinc-300 leading-relaxed">{error}</p>
                        <Link
                            href="/signin"
                            className="mt-6 block text-center bg-black dark:bg-white text-white dark:text-black font-bold py-3 rounded-xl"
                        >
                            Send a new link
                        </Link>
                    </>
                )}

                {result && (
                    <>
                        <h1 className="text-3xl font-black tracking-tight mb-3">You&rsquo;re signed in</h1>
                        <p className="text-base text-zinc-600 dark:text-zinc-300 leading-relaxed">
                            Signed in as <b>{result.email}</b>.
                            {result.tier === 'pro' && ' Your Pro plan is active on this device.'}
                            {result.streak_days > 0 && ` Your ${result.streak_days}-day streak is safe.`}
                            {result.moved_sessions > 0 &&
                                ` We also kept the ${result.moved_sessions} ${result.moved_sessions === 1 ? 'session' : 'sessions'} you did here before signing in.`}
                        </p>
                        <Link
                            href="/forge"
                            className="mt-6 block text-center bg-black dark:bg-white text-white dark:text-black font-bold py-3 rounded-xl"
                        >
                            Continue practicing
                        </Link>
                    </>
                )}
            </div>
        </main>
    );
}
