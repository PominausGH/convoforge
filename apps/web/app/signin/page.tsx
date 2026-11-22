'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { requestSignInLink } from '@/lib/api';
import { getUserId, isSignedIn, signedInEmail, signOut } from '@/lib/identity';
import { trackEvent, ANALYTICS_EVENTS } from '@/lib/analytics';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export default function SignInPage() {
    const [email, setEmail] = useState('');
    const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
    const [error, setError] = useState('');
    const [current, setCurrent] = useState<string | null>(null);
    const [signedIn, setSignedIn] = useState(false);

    useEffect(() => {
        setSignedIn(isSignedIn());
        setCurrent(signedInEmail());
        try {
            setEmail(localStorage.getItem('cf_email') || '');
        } catch {
            /* ignore */
        }
    }, []);

    const send = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = email.trim();
        if (!EMAIL_RE.test(trimmed)) {
            setState('error');
            setError('Please enter a valid email address.');
            return;
        }
        setState('sending');
        try {
            await requestSignInLink(trimmed, getUserId());
            setState('sent');
            trackEvent(ANALYTICS_EVENTS.signInLinkRequested);
        } catch (err) {
            setState('error');
            setError(err instanceof Error ? err.message : 'Could not send the email.');
        }
    };

    return (
        <main className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
            <nav className="max-w-md mx-auto px-4 py-5">
                <Link href="/" className="font-black text-lg tracking-tight">ConvoForge</Link>
            </nav>
            <div className="max-w-md mx-auto px-4 pt-6 pb-16">
                {signedIn ? (
                    <>
                        <h1 className="text-3xl font-black tracking-tight mb-3">You&rsquo;re signed in</h1>
                        <p className="text-base text-zinc-600 dark:text-zinc-300 leading-relaxed">
                            {current ? <>Signed in as <b>{current}</b>. </> : null}
                            Your streak, history and Pro are saved to your email, so you can sign in on any other
                            device too.
                        </p>
                        <div className="mt-6 flex flex-col gap-3">
                            <Link
                                href="/forge"
                                className="text-center bg-black dark:bg-white text-white dark:text-black font-bold py-3 rounded-xl"
                            >
                                Back to practice
                            </Link>
                            <button
                                onClick={() => {
                                    signOut();
                                    trackEvent(ANALYTICS_EVENTS.signOut);
                                    setSignedIn(false);
                                    setCurrent(null);
                                    setState('idle');
                                }}
                                className="text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:underline"
                            >
                                Sign out on this device
                            </button>
                        </div>
                    </>
                ) : state === 'sent' ? (
                    <>
                        <h1 className="text-3xl font-black tracking-tight mb-3">Check your email</h1>
                        <p className="text-base text-zinc-600 dark:text-zinc-300 leading-relaxed">
                            We sent a sign-in link to <b>{email.trim()}</b>. Open it on this device. It works once
                            and expires in 30 minutes.
                        </p>
                        <p className="text-sm text-zinc-500 mt-4">
                            Nothing there? Check your spam folder, or{' '}
                            <button onClick={() => setState('idle')} className="font-semibold underline">
                                try again
                            </button>
                            .
                        </p>
                    </>
                ) : (
                    <>
                        <h1 className="text-3xl font-black tracking-tight mb-3">Sign in</h1>
                        <p className="text-base text-zinc-600 dark:text-zinc-300 leading-relaxed mb-6">
                            Keep your streak, practice history and Pro on every device. No password: we&rsquo;ll
                            email you a link.
                        </p>
                        <form onSubmit={send} noValidate className="space-y-3">
                            <label htmlFor="signin-email" className="block font-bold">
                                Your email
                            </label>
                            <input
                                id="signin-email"
                                type="email"
                                inputMode="email"
                                autoComplete="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (state === 'error') setState('idle');
                                }}
                                placeholder="you@example.com"
                                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600"
                            />
                            {state === 'error' && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
                            <button
                                type="submit"
                                disabled={state === 'sending'}
                                className="w-full bg-black dark:bg-white text-white dark:text-black font-bold py-3 rounded-xl text-base disabled:opacity-50"
                            >
                                {state === 'sending' ? 'Sending…' : 'Email me a sign-in link'}
                            </button>
                        </form>
                        <p className="text-xs text-zinc-500 mt-4 leading-relaxed">
                            New here? The same link creates your account and keeps what you&rsquo;ve done so far on
                            this device. We only use your email for sign-in and receipts. See our{' '}
                            <Link href="/privacy" className="underline">privacy policy</Link>.
                        </p>
                    </>
                )}
            </div>
        </main>
    );
}
