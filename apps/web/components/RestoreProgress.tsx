'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ensureUser } from '@/lib/api'

const USER_KEY = 'cf_user_id'
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

type Status = { kind: 'ok' | 'error'; text: string } | null

export default function RestoreProgress() {
    const [token, setToken] = useState<string | null>(null)
    const [restored, setRestored] = useState(false)
    const [saveEmail, setSaveEmail] = useState('')
    const [sendEmail, setSendEmail] = useState('')
    const [busy, setBusy] = useState<string | null>(null)
    const [saveStatus, setSaveStatus] = useState<Status>(null)
    const [sendStatus, setSendStatus] = useState<Status>(null)
    const [confirmStatus, setConfirmStatus] = useState<Status>(null)

    useEffect(() => {
        setToken(new URLSearchParams(window.location.search).get('token'))
    }, [])

    // Save this browser's account against an email (do this on the old device).
    const save = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaveStatus(null)
        if (!EMAIL_RE.test(saveEmail)) {
            setSaveStatus({ kind: 'error', text: 'Enter a valid email.' })
            return
        }
        setBusy('save')
        try {
            let id = localStorage.getItem(USER_KEY)
            if (!id) {
                id = crypto.randomUUID()
                localStorage.setItem(USER_KEY, id)
            }
            await ensureUser(id)
            const res = await fetch(`/api/users/${id}/email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: saveEmail, opt_in: false }),
            })
            if (!res.ok) throw new Error()
            setSaveStatus({ kind: 'ok', text: 'Saved. You can now restore this from any device.' })
        } catch {
            setSaveStatus({ kind: 'error', text: 'Couldn’t save that — try again.' })
        } finally {
            setBusy(null)
        }
    }

    // Ask for a sign-in link (do this on the new device).
    const send = async (e: React.FormEvent) => {
        e.preventDefault()
        setSendStatus(null)
        if (!EMAIL_RE.test(sendEmail)) {
            setSendStatus({ kind: 'error', text: 'Enter a valid email.' })
            return
        }
        setBusy('send')
        try {
            const res = await fetch('/api/users/recover', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: sendEmail }),
            })
            if (!res.ok) throw new Error()
            setSendStatus({
                kind: 'ok',
                text: 'If that email is linked to an account, a link is on its way. It expires in 30 minutes.',
            })
        } catch {
            setSendStatus({ kind: 'error', text: 'Something went wrong — try again.' })
        } finally {
            setBusy(null)
        }
    }

    // Opening the emailed link. Needs a click so mail scanners can't spend the token.
    const confirm = async () => {
        setConfirmStatus(null)
        setBusy('confirm')
        try {
            const res = await fetch('/api/users/recover/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token }),
            })
            if (res.status === 400) {
                setConfirmStatus({ kind: 'error', text: 'This link is invalid or has expired. Request a new one below.' })
                return
            }
            if (!res.ok) throw new Error()
            const data = await res.json()
            localStorage.setItem(USER_KEY, data.user_id)
            setRestored(true)
        } catch {
            setConfirmStatus({ kind: 'error', text: 'Something went wrong — try again.' })
        } finally {
            setBusy(null)
        }
    }

    const msg = (s: Status) =>
        s && (
            <p role={s.kind === 'error' ? 'alert' : 'status'} className={`text-sm ${s.kind === 'error' ? 'text-red-600' : 'text-emerald-700'}`}>
                {s.text}
            </p>
        )

    const input = 'rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 px-3 py-2'
    const button = 'rounded bg-black dark:bg-white text-white dark:text-black px-4 py-2 disabled:opacity-50'

    if (restored) {
        return (
            <p className="text-sm">
                Your progress is restored on this device.{' '}
                <Link href="/forge" className="underline font-medium">Start a session</Link>
            </p>
        )
    }

    return (
        <div className="flex flex-col gap-10">
            {token && (
                <section className="flex flex-col gap-3">
                    <h2 className="font-medium">Restore your progress here</h2>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        This replaces any progress currently in this browser.
                    </p>
                    <button onClick={confirm} disabled={busy === 'confirm'} className={button}>
                        {busy === 'confirm' ? 'Restoring…' : 'Restore my progress'}
                    </button>
                    {msg(confirmStatus)}
                </section>
            )}

            <section className="flex flex-col gap-3">
                <h2 className="font-medium">1. On the device you use now: link an email</h2>
                <form onSubmit={save} className="flex flex-col gap-3">
                    <input type="email" value={saveEmail} onChange={(e) => setSaveEmail(e.target.value)} placeholder="you@example.com" aria-label="Email to link" className={input} required />
                    <button disabled={busy === 'save'} className={button}>
                        {busy === 'save' ? 'Saving…' : 'Link this email'}
                    </button>
                    {msg(saveStatus)}
                </form>
            </section>

            <section className="flex flex-col gap-3">
                <h2 className="font-medium">2. On the new device: get a sign-in link</h2>
                <form onSubmit={send} className="flex flex-col gap-3">
                    <input type="email" value={sendEmail} onChange={(e) => setSendEmail(e.target.value)} placeholder="the same email" aria-label="Email to send the link to" className={input} required />
                    <button disabled={busy === 'send'} className={button}>
                        {busy === 'send' ? 'Sending…' : 'Email me a link'}
                    </button>
                    {msg(sendStatus)}
                </form>
            </section>
        </div>
    )
}
