'use client'

import { useState } from 'react'
import { ensureUser } from '@/lib/api'
import { initiateProPayment } from '@/lib/stripe'
import { trackEvent, ANALYTICS_EVENTS } from '@/lib/analytics'

export default function UpgradeButton({
    className,
    children,
}: {
    className?: string
    children: React.ReactNode
}) {
    const [busy, setBusy] = useState(false)

    const go = async () => {
        if (busy) return
        setBusy(true)
        try {
            let id = localStorage.getItem('cf_user_id')
            if (!id) {
                id = crypto.randomUUID()
                localStorage.setItem('cf_user_id', id)
                trackEvent(ANALYTICS_EVENTS.signup)
            }
            // Ensure the user row exists so the Stripe session can bind to it.
            await ensureUser(id).catch(() => undefined)
            trackEvent(ANALYTICS_EVENTS.upgradeClick, { source: 'landing_pricing' })
            await initiateProPayment(id)
        } catch (err) {
            console.error('[upgrade] failed:', err)
            setBusy(false)
            alert(
                'We couldn’t open the checkout just now. Please try again in a moment, or open the app and upgrade from there.',
            )
        }
    }

    return (
        <button
            onClick={go}
            disabled={busy}
            className={`${className} ${busy ? 'opacity-60 cursor-wait' : ''}`}
        >
            {busy ? 'Opening checkout…' : children}
        </button>
    )
}
