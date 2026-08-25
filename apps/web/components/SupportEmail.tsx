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

    // First click both opens the mail client immediately and swaps in the
    // real link as a fallback, so it's a single click for the visitor but
    // the address is still never present in the static HTML/JSON-LD.
    function handleClick() {
        window.location.href = `mailto:${USER}@${DOMAIN}`
        setRevealed(true)
    }

    return (
        <button type="button" onClick={handleClick} className={className}>
            Support
        </button>
    )
}
