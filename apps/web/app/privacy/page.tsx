import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Privacy Policy',
    description:
        'How ConvoForge handles identity, camera, microphone, audio transcripts, and payments.',
    alternates: { canonical: '/privacy' },
}

const EFFECTIVE_DATE = 'April 2026'

export default function PrivacyPage() {
    return (
        <main className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 max-w-2xl mx-auto p-6 md:p-10 leading-relaxed">
            <nav className="text-sm mb-8">
                <Link href="/" className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                    ← ConvoForge
                </Link>
            </nav>

            <h1 className="text-4xl font-black mb-2">Privacy Policy</h1>
            <p className="text-zinc-500 text-sm mb-2">
                Effective {EFFECTIVE_DATE}
            </p>
            <p className="text-zinc-500 text-xs mb-10">
                ConvoForge · ABN 65 366 917 788 · Australia
            </p>

            <section className="space-y-4 text-zinc-800 dark:text-zinc-200">
                <p>
                    ConvoForge is designed to help you improve how you communicate
                    without asking you for an account or any personally identifying
                    information. This page explains exactly what we do and do not
                    collect.
                </p>
            </section>

            <h2 className="text-xl font-bold mt-10 mb-3">Identity</h2>
            <p>
                When you first visit ConvoForge, a random UUID is generated locally
                in your browser and stored in <code>localStorage</code> under the
                key <code>cf_user_id</code>. We use that UUID to remember your
                streak, weekly session count, and tier. We do not know your name,
                email, IP, or any other identifier. Clearing your browser storage
                signs you out permanently.
            </p>

            <h2 className="text-xl font-bold mt-8 mb-3">Camera</h2>
            <p>
                Camera-based body-language analysis runs entirely on your device
                using Google MediaPipe compiled to WebAssembly. Video frames never
                leave your browser. We store only aggregated, non-reversible metrics
                (for example, an eye-contact percentage) keyed to your anonymous UUID.
            </p>

            <h2 className="text-xl font-bold mt-8 mb-3">Microphone</h2>
            <p>
                Audio from your microphone is streamed over TLS to Deepgram, our
                speech-to-text provider, solely to produce a live transcript.
                Deepgram processes this audio under its own privacy terms and does
                not retain it for model training. We do not persist the raw audio.
                The transcript is stored on our servers, keyed to your anonymous
                UUID, so we can score filler words, pace, and hedging.
            </p>

            <h2 className="text-xl font-bold mt-8 mb-3">Language analysis</h2>
            <p>
                Your transcript is sent to Anthropic (Claude) for coaching feedback.
                Anthropic does not use API inputs to train its models. We store the
                resulting score and insight against your anonymous UUID.
            </p>

            <h2 className="text-xl font-bold mt-8 mb-3">Payments</h2>
            <p>
                Pro upgrades are processed by Stripe Checkout. Stripe handles all
                card data; ConvoForge never sees your card number, CVV, or billing
                address. We receive only Stripe&apos;s customer and session IDs so
                we can unlock Pro features. See{' '}
                <a
                    href="https://stripe.com/privacy"
                    className="underline"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Stripe&apos;s privacy policy
                </a>
                .
            </p>

            <h2 className="text-xl font-bold mt-8 mb-3">Recordings</h2>
            <p>
                Session recordings are off by default. If you opt in, recordings
                are uploaded to Cloudflare R2 using a presigned URL and deleted on
                a lifecycle schedule.
            </p>

            <h2 className="text-xl font-bold mt-8 mb-3">Cookies and storage</h2>
            <p>
                ConvoForge does not use tracking cookies or third-party analytics
                cookies. We store one item in <code>localStorage</code> (your
                anonymous UUID) and one item for your cookie-banner acknowledgment.
            </p>

            <h2 className="text-xl font-bold mt-8 mb-3">Your rights (GDPR / CCPA)</h2>
            <p>
                Because we do not link your UUID to any personal identifier, there
                is nothing to search or delete by name. To erase your data, clear
                your browser storage — your UUID will no longer resolve, and the
                associated rows will be purged on our regular retention cycle
                (90 days of inactivity).
            </p>

            <h2 className="text-xl font-bold mt-8 mb-3">Contact</h2>
            <p>
                Questions or requests: reach out via the signalreads.com contact
                channel. Changes to this policy will be announced on this page with
                an updated effective date.
            </p>

            <div className="mt-16 pt-6 border-t border-zinc-200 dark:border-zinc-800 text-sm text-zinc-500 dark:text-zinc-400">
                <Link href="/terms" className="hover:underline">
                    Terms of Service →
                </Link>
            </div>
        </main>
    )
}
