import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Terms of Service',
    description: 'Terms for using ConvoForge.',
    alternates: { canonical: '/terms' },
}

const EFFECTIVE_DATE = 'April 2026'

export default function TermsPage() {
    return (
        <main className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 max-w-2xl mx-auto p-6 md:p-10 leading-relaxed">
            <nav className="text-sm mb-8">
                <Link href="/" className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                    ← ConvoForge
                </Link>
            </nav>

            <h1 className="text-4xl font-black mb-2">Terms of Service</h1>
            <p className="text-zinc-500 text-sm mb-2">
                Effective {EFFECTIVE_DATE}
            </p>
            <p className="text-zinc-500 text-xs mb-10">
                ConvoForge · ABN 65 366 917 788 · Australia. These terms are governed by
                the laws of Australia.
            </p>

            <section className="space-y-4 text-zinc-800 dark:text-zinc-200">
                <p>
                    By using ConvoForge you agree to these terms. If you do not
                    agree, do not use the service.
                </p>

                <h2 className="text-xl font-bold mt-8 mb-3">The service</h2>
                <p>
                    ConvoForge is a communication-coaching tool that uses your
                    microphone and camera (with your permission) to give you
                    feedback on short practice sessions. It is not professional
                    speech therapy, medical advice, or legal/financial advice.
                </p>

                <h2 className="text-xl font-bold mt-8 mb-3">Account</h2>
                <p>
                    Your &ldquo;account&rdquo; is an anonymous UUID stored in your
                    browser. Clearing browser storage ends your session permanently
                    and cannot be recovered.
                </p>

                <h2 className="text-xl font-bold mt-8 mb-3">Free and Pro tiers</h2>
                <p>
                    The free tier allows three sessions per rolling 7-day window
                    and access to the first five lessons. Pro unlocks unlimited
                    sessions and all 45 lessons. Pro is billed through Stripe at
                    localized prices. Subscriptions auto-renew until cancelled.
                </p>

                <h2 className="text-xl font-bold mt-8 mb-3">Refunds</h2>
                <p>
                    Full refund within 7 days of purchase, no questions asked.
                    Request via the contact channel below.
                </p>

                <h2 className="text-xl font-bold mt-8 mb-3">Acceptable use</h2>
                <p>
                    You agree not to: (a) attempt to scrape or reverse-engineer the
                    service, (b) upload content that violates law or third-party
                    rights, (c) use ConvoForge to record a third party without
                    their consent, (d) abuse the session endpoints with automated
                    traffic.
                </p>

                <h2 className="text-xl font-bold mt-8 mb-3">Disclaimer</h2>
                <p>
                    The service is provided &ldquo;as is&rdquo;. We disclaim all
                    implied warranties to the maximum extent permitted by law.
                    Coaching scores are guidance, not guarantees of real-world
                    outcomes.
                </p>

                <h2 className="text-xl font-bold mt-8 mb-3">Liability</h2>
                <p>
                    To the maximum extent permitted by law, ConvoForge&apos;s total
                    liability for any claim arising from your use of the service
                    is capped at the amount you paid in the 12 months preceding
                    the claim.
                </p>

                <h2 className="text-xl font-bold mt-8 mb-3">Changes</h2>
                <p>
                    We may update these terms; the new effective date will appear
                    at the top of this page. Continued use after a change
                    constitutes acceptance.
                </p>

                <h2 className="text-xl font-bold mt-8 mb-3">Contact</h2>
                <p>
                    Reach out via the signalreads.com contact channel.
                </p>
            </section>

            <div className="mt-16 pt-6 border-t border-zinc-200 dark:border-zinc-800 text-sm text-zinc-500 dark:text-zinc-400">
                <Link href="/privacy" className="hover:underline">
                    Privacy Policy →
                </Link>
            </div>
        </main>
    )
}
