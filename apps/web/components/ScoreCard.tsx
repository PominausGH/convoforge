'use client';

import React, { useState } from 'react';
import { captureEmail } from '@/lib/api';
import { initiateProPayment } from '@/lib/stripe';

interface ScoreCardProps {
    score: number;
    streak?: number | null;
    tier?: 'free' | 'pro';
    verbal: { filler_rate: number; wpm: number; hedging_count: number };
    visual: { eye_contact_pct: number; smile_frequency: number };
    insight: string;
    saveError?: string;
    onClose: () => void;
    onRetry?: () => void;
}

export default function ScoreCard({
    score,
    streak,
    tier = 'free',
    verbal,
    visual,
    insight,
    saveError,
    onClose,
    onRetry,
}: ScoreCardProps) {
    const [shareState, setShareState] = useState<'idle' | 'copied' | 'shared' | 'error'>('idle');
    const [email, setEmail] = useState('');
    const [emailState, setEmailState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [upgradeLoading, setUpgradeLoading] = useState(false);

    const handleUpgrade = async () => {
        const uid = typeof window !== 'undefined' ? window.localStorage.getItem('cf_user_id') : null;
        if (!uid) return;
        setUpgradeLoading(true);
        await initiateProPayment(uid);
    };

    const shareText = `I scored ${score} on my Daily Forge 🔥 #ConvoForge`;

    const saveEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = email.trim();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed)) {
            setEmailState('error');
            return;
        }
        setEmailState('saving');
        try {
            const uid =
                typeof window !== 'undefined'
                    ? window.localStorage.getItem('cf_user_id')
                    : null;
            if (!uid) throw new Error('no user id');
            await captureEmail(uid, trimmed, true);
            setEmailState('saved');
        } catch {
            setEmailState('error');
        }
    };

    const handleShare = async () => {
        const nav = navigator as Navigator & {
            share?: (data: ShareData) => Promise<void>;
        };
        try {
            if (typeof nav.share === 'function') {
                await nav.share({ title: 'ConvoForge', text: shareText });
                setShareState('shared');
                return;
            }
            await nav.clipboard.writeText(shareText);
            setShareState('copied');
        } catch (err) {
            const aborted = err instanceof DOMException && err.name === 'AbortError';
            setShareState(aborted ? 'idle' : 'error');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-lg z-[100] flex items-center justify-center p-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-md w-full shadow-2xl">
                <div className="text-center mb-8">
                    <h2 className="text-zinc-500 text-sm font-bold uppercase tracking-[0.2em] mb-2">Forge Score</h2>
                    <div className="text-7xl font-black text-white">{score}</div>
                    {streak != null && (
                        <div className="mt-2 text-orange-400 text-sm font-semibold">
                            🔥 {streak}-day streak
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <Metric label="Fillers" value={`${verbal.filler_rate.toFixed(1)}%`} />
                    <Metric label="Eye Contact" value={`${visual.eye_contact_pct}%`} />
                    <Metric label="WPM" value={`${verbal.wpm}`} />
                    <Metric label="Smile Rate" value={visual.smile_frequency.toFixed(2)} />
                </div>

                {tier === 'free' && (
                    <div className="bg-gradient-to-br from-violet-500/10 to-blue-500/10 border border-violet-500/20 p-4 rounded-2xl mb-4">
                        <div className="text-violet-400 text-xs font-bold uppercase mb-1">Unlock Pro</div>
                        <p className="text-zinc-300 text-sm mb-3">Sincerity scoring, Carnegie alignment flags, and 148 Pro lessons — unlimited sessions.</p>
                        <button
                            onClick={handleUpgrade}
                            disabled={upgradeLoading}
                            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white font-bold py-2 rounded-xl text-sm transition-colors"
                        >
                            {upgradeLoading ? 'Redirecting…' : 'Upgrade to Pro — $9/month'}
                        </button>
                    </div>
                )}

                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl mb-4">
                    <div className="text-blue-400 text-xs font-bold uppercase mb-1">Top Insight</div>
                    <p className="text-blue-100 text-sm leading-relaxed">{insight}</p>
                </div>

                {saveError && (
                    <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-2xl mb-4 text-red-200 text-xs">
                        Couldn&apos;t save this session: {saveError}
                    </div>
                )}

                {/* Non-mandatory email capture — survives browser clears + weekly lesson email */}
                {emailState === 'saved' ? (
                    <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-2xl mb-4 text-green-200 text-xs text-center">
                        Saved. We&apos;ll send you a new lesson once a week — nothing else.
                    </div>
                ) : (
                    <form
                        onSubmit={saveEmail}
                        className="bg-zinc-800/50 border border-zinc-700/60 p-4 rounded-2xl mb-4"
                    >
                        <label className="block text-zinc-300 text-xs font-semibold mb-2">
                            Save your streak across devices (optional)
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (emailState !== 'idle') setEmailState('idle');
                                }}
                                placeholder="you@work.com"
                                aria-label="Your email"
                                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                            />
                            <button
                                type="submit"
                                disabled={emailState === 'saving'}
                                className="bg-white text-black text-sm font-bold px-4 py-2 rounded-xl hover:bg-zinc-200 disabled:opacity-60"
                            >
                                {emailState === 'saving' ? '…' : 'Save'}
                            </button>
                        </div>
                        {emailState === 'error' && (
                            <div className="text-red-300 text-[11px] mt-2">
                                Couldn&apos;t save that. Check the address and try again.
                            </div>
                        )}
                        <div className="text-zinc-500 text-[11px] mt-2">
                            Weekly lesson email. No tracking, no resale. Unsubscribe in one click.
                        </div>
                    </form>
                )}

                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleShare}
                        className="w-full bg-zinc-800 text-white font-semibold py-3 rounded-2xl border border-zinc-700 hover:bg-zinc-700 transition-colors"
                    >
                        {shareState === 'copied' && 'Copied to clipboard ✓'}
                        {shareState === 'shared' && 'Shared ✓'}
                        {shareState === 'error' && 'Share unavailable'}
                        {shareState === 'idle' && 'Share Forge Score'}
                    </button>

                    {onRetry && (
                        <button
                            onClick={onRetry}
                            className="w-full bg-zinc-800 text-white font-semibold py-3 rounded-2xl border border-zinc-700 hover:bg-zinc-700 transition-colors"
                        >
                            Try this lesson again
                        </button>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-[2] bg-white text-black font-bold py-4 rounded-2xl hover:bg-zinc-200 transition-colors"
                        >
                            Continue Journey
                        </button>
                        <button
                            onClick={onClose}
                            aria-label="Quit and return home"
                            className="flex-1 bg-transparent border border-zinc-700 text-zinc-300 font-semibold py-4 rounded-2xl hover:bg-zinc-800 transition-colors"
                        >
                            Quit
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-zinc-800/50 p-4 rounded-2xl border border-zinc-700/50">
            <div className="text-zinc-500 text-xs font-bold uppercase mb-1">{label}</div>
            <div className="text-xl font-bold text-white">{value}</div>
        </div>
    );
}
