'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { fetchUserProfile } from '@/lib/api'

type Mode = 'unknown' | 'first_time' | 'returning'

export default function LandingCTA({
    variant = 'hero',
}: {
    variant?: 'hero' | 'final'
}) {
    const [mode, setMode] = useState<Mode>('unknown')
    const [streak, setStreak] = useState(0)

    useEffect(() => {
        const id =
            typeof window !== 'undefined'
                ? window.localStorage.getItem('cf_user_id')
                : null
        if (!id) {
            setMode('first_time')
            return
        }
        // Returning user — fetch profile (non-blocking). If the server doesn't know
        // them (cleared DB or first visit from a new device), treat as first-time.
        fetchUserProfile(id)
            .then((p) => {
                setMode('returning')
                setStreak(p.streak_days || 0)
            })
            .catch(() => setMode('first_time'))
    }, [])

    if (variant === 'hero') {
        return (
            <div className="flex flex-col sm:flex-row items-center gap-3">
                <Link
                    href="/forge"
                    className="bg-white text-black font-bold px-8 py-4 rounded-full text-base shadow-xl hover:scale-105 active:scale-95 transition-transform"
                >
                    {mode === 'returning' && streak > 0
                        ? `Continue your ${streak}-day streak →`
                        : 'Start your first Forge Session'}
                </Link>
                <a
                    href="#how"
                    className="text-zinc-300 text-sm font-semibold hover:text-white transition-colors px-4 py-2"
                >
                    See how it works ↓
                </a>
                {mode === 'first_time' && (
                    <span className="sm:ml-2 text-xs text-zinc-500">
                        No signup. No credit card.
                    </span>
                )}
            </div>
        )
    }

    return (
        <Link
            href="/forge"
            className="inline-block bg-white text-black font-bold px-10 py-4 rounded-full text-base shadow-2xl hover:scale-105 active:scale-95 transition-transform"
        >
            {mode === 'returning' && streak > 0
                ? `Continue your ${streak}-day streak →`
                : 'Start Forging →'}
        </Link>
    )
}
