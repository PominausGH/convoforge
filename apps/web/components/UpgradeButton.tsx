'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ensureUser } from '@/lib/api'
import { initiateProPayment } from '@/lib/stripe'
import { trackEvent, ANALYTICS_EVENTS } from '@/lib/analytics'

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const EMAIL_KEY = 'cf_email'

export default function UpgradeButton({
    className,
    children,
    trackProps = { source: 'landing_pricing' },
    busyLabel = 'Opening checkout…',
}: {
    className?: string
    children: React.ReactNode
    trackProps?: Record<string, string | number | boolean>
    busyLabel?: string
}) {
    const [open, setOpen] = useState(false)
    const [busy, setBusy] = useState(false)
    const [email, setEmail] = useState('')
    const [error, setError] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (!open) return
        inputRef.current?.focus()
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !busy) setOpen(false)
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [open, busy])

    // Ask for an email just before Stripe, so an abandoned checkout isn't a dead end.
    const start = () => {
        trackEvent(ANALYTICS_EVENTS.upgradeClick, trackProps)
        try {
            setEmail(localStorage.getItem(EMAIL_KEY) || '')
        } catch {
            /* storage blocked — start empty */
        }
        setError(null)
        setOpen(true)
    }

    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (busy) return
        const trimmed = email.trim()
        if (!EMAIL_RE.test(trimmed)) {
            setError('Please enter a valid email address.')
            return
        }
        setBusy(true)
        setError(null)
        try {
            let id = localStorage.getItem('cf_user_id')
            if (!id) {
                id = crypto.randomUUID()
                localStorage.setItem('cf_user_id', id)
                trackEvent(ANALYTICS_EVENTS.signup)
            }
            try {
                localStorage.setItem(EMAIL_KEY, trimmed)
            } catch {
                /* non-essential prefill */
            }
            // Ensure the user row exists so the Stripe session can bind to it.
            await ensureUser(id).catch(() => undefined)
            trackEvent(ANALYTICS_EVENTS.checkoutEmail, trackProps)
            await initiateProPayment(id, trimmed)
        } catch (err) {
            console.error('[upgrade] failed:', err)
            setBusy(false)
            setError('We couldn’t open the checkout just now. Please try again in a moment.')
        }
    }

    return (
        <>
            <button onClick={start} className={className}>
                {children}
            </button>

            {open && createPortal(
                <div
                    className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 px-4"
                    onClick={() => !busy && setOpen(false)}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="upgrade-email-title"
                        className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 text-left shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2
                            id="upgrade-email-title"
                            className="text-lg font-bold text-zinc-900 dark:text-zinc-100"
                        >
                            Upgrade to ConvoForge Pro
                        </h2>
                        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                            Where should we send your receipt? We&apos;ll also use it to
                            help if anything goes wrong with your payment. No newsletter.
                        </p>
                        <form onSubmit={submit} noValidate className="mt-4 space-y-3">
                            <input
                                ref={inputRef}
                                type="email"
                                autoComplete="email"
                                inputMode="email"
                                required
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value)
                                    if (error) setError(null)
                                }}
                                placeholder="you@example.com"
                                aria-label="Your email"
                                aria-invalid={!!error}
                                disabled={busy}
                                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-4 py-2.5 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />
                            {error && (
                                <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                                    {error}
                                </p>
                            )}
                            <button
                                type="submit"
                                disabled={busy}
                                className="w-full rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:cursor-wait text-white font-bold py-2.5 transition-colors"
                            >
                                {busy ? busyLabel : 'Continue to payment'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                disabled={busy}
                                className="w-full text-sm text-zinc-500 dark:text-zinc-400 hover:underline"
                            >
                                Cancel
                            </button>
                        </form>
                    </div>
                </div>,
                document.body,
            )}
        </>
    )
}
