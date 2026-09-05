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
            className="fixed bottom-3 left-3 right-3 md:left-auto md:right-6 md:bottom-4 md:max-w-md z-[2147483647] max-h-[50vh] overflow-y-auto bg-zinc-900 text-white rounded-2xl shadow-2xl border border-white/10 p-3 text-xs sm:p-4 sm:text-sm"
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
            <div className="mt-2 flex justify-end sm:mt-3">
                <button
                    onClick={acknowledge}
                    className="bg-white text-black font-semibold px-3 py-1 rounded-full text-xs active:scale-95 transition-transform sm:px-4 sm:py-1.5 sm:text-sm"
                >
                    Got it
                </button>
            </div>
        </div>
    )
}
