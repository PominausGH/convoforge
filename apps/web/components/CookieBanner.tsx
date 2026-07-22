'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'cf_consent_v1'

export default function CookieBanner() {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        try {
            if (!localStorage.getItem(STORAGE_KEY)) setVisible(true)
        } catch {
            /* storage unavailable, don't block the UI */
        }
    }, [])

    const acknowledge = () => {
        try {
            localStorage.setItem(STORAGE_KEY, new Date().toISOString())
        } catch {
            /* noop */
        }
        setVisible(false)
    }

    if (!visible) return null

    return (
        <div
            role="dialog"
            aria-live="polite"
            aria-label="Privacy notice"
            className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 bg-zinc-900 text-white rounded-2xl shadow-2xl border border-white/10 p-4 text-sm"
        >
            <p className="leading-relaxed">
                ConvoForge stores one anonymous ID in your browser and uses your
                camera and microphone only while you practice. No tracking cookies,
                no account required.{' '}
                <Link href="/privacy" className="underline font-semibold">
                    Read our privacy policy
                </Link>
                .
            </p>
            <div className="mt-3 flex justify-end">
                <button
                    onClick={acknowledge}
                    className="bg-white text-black font-semibold px-4 py-1.5 rounded-full text-sm active:scale-95 transition-transform"
                >
                    Got it
                </button>
            </div>
        </div>
    )
}
