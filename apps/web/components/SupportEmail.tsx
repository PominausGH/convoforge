'use client'

import { useState } from 'react'

// Split so the address isn't sitting in the HTML/JS as a plain string for
// scrapers to skim — assembled client-side only after the user clicks.
const USER = 'support'
const DOMAIN = ['convoforge', 'app'].join('.')

export default function SupportEmail({ className }: { className?: string }) {
    const [revealed, setRevealed] = useState(false)

    if (revealed) {
        return (
            <a href={`mailto:${USER}@${DOMAIN}`} className={className}>
                {USER}@{DOMAIN}
            </a>
        )
    }

    return (
        <button type="button" onClick={() => setRevealed(true)} className={className}>
            Support
        </button>
    )
}
