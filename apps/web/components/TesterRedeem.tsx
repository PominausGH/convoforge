'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ensureUser } from '@/lib/api'
import { trackEvent } from '@/lib/analytics'

const USER_KEY = 'cf_user_id'

export default function TesterRedeem() {
    const [code, setCode] = useState('')
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [done, setDone] = useState(false)

    useEffect(() => {
        const c = new URLSearchParams(window.location.search).get('code')
        if (c) setCode(c.toUpperCase())
    }, [])

    const redeem = async (e: React.FormEvent) => {
        e.preventDefault()
        setBusy(true)
        setError(null)
        try {
            let id = localStorage.getItem(USER_KEY)
            if (!id) {
                id = crypto.randomUUID()
                localStorage.setItem(USER_KEY, id)
            }
            await ensureUser(id)
            const res = await fetch(`/api/users/${id}/redeem`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code }),
            })
            if (res.status === 404) throw new Error('That code isn’t valid.')
            if (res.status === 409) throw new Error('That code has already been used.')
            if (!res.ok) throw new Error('Something went wrong — try again.')
            trackEvent('tester_redeem')
            setDone(true)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong — try again.')
        } finally {
            setBusy(false)
        }
    }

    if (done) {
        return (
            <p className="text-sm">
                You&apos;re in — Pro is unlocked on this browser.{' '}
                <Link href="/forge" className="underline font-medium">Start a session</Link>
            </p>
        )
    }

    return (
        <form onSubmit={redeem} className="flex flex-col gap-3">
            <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="CF-XXXXXXXX"
                aria-label="Tester code"
                className="rounded border border-slate-300 px-3 py-2 font-mono"
                required
            />
            <button disabled={busy || !code} className="rounded bg-slate-900 text-white px-4 py-2 disabled:opacity-50">
                {busy ? 'Checking…' : 'Unlock Pro'}
            </button>
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        </form>
    )
}
