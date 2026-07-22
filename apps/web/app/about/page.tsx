import Link from 'next/link'
import type { Metadata } from 'next'
import { curriculum } from '@/lib/curriculum'

export const metadata: Metadata = {
    title: 'About — How ConvoForge coaches you every day',
    description:
        'ConvoForge uses on-device body-language analysis, streaming speech-to-text, and Carnegie-grounded lessons to coach you in five-minute sessions.',
    alternates: { canonical: '/about' },
    openGraph: {
        title: 'About ConvoForge — Daily AI communication coaching',
        description:
            'ConvoForge uses on-device body-language analysis, streaming speech-to-text, and Carnegie-grounded lessons to coach you in five-minute sessions.',
        url: '/about',
        images: [{ url: '/opengraph-image', width: 1200, height: 630 }],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'About ConvoForge — Daily AI communication coaching',
        description:
            'On-device body-language analysis, streaming speech-to-text, and Carnegie-grounded lessons. Five minutes a day.',
    },
}

export default function AboutPage() {
    const freeLessons = curriculum.filter((l) => l.tier_required === 'free')

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Course',
        name: 'ConvoForge — Carnegie Communication Curriculum',
        description:
            '45 daily micro-lessons that translate Dale Carnegie principles into modern digital communication practice, with AI coaching on voice and body language.',
        provider: {
            '@type': 'Organization',
            name: 'ConvoForge',
            url: 'https://convoforge.app',
        },
        hasCourseInstance: {
            '@type': 'CourseInstance',
            courseMode: 'online',
            courseWorkload: 'PT5M',
        },
        offers: [
            {
                '@type': 'Offer',
                name: 'Free',
                price: 0,
                priceCurrency: 'USD',
            },
            {
                '@type': 'Offer',
                name: 'Pro',
                priceCurrency: 'USD',
                description: 'Unlimited sessions and the full 30-lesson curriculum.',
            },
        ],
    }

    return (
        <main className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 max-w-3xl mx-auto p-6 md:p-10 leading-relaxed">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <nav className="text-sm mb-8">
                <Link href="/" className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                    ← ConvoForge
                </Link>
            </nav>

            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                Five minutes a day. Measurable communication gains.
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-300 mb-10 max-w-2xl">
                ConvoForge is a daily coaching practice, not a course you binge.
                Each session gives you a one-minute Carnegie lesson, a 90-second
                practice prompt, and an honest score with one concrete thing to
                work on tomorrow.
            </p>

            <section className="grid md:grid-cols-3 gap-4 mb-12">
                <Stat label="Lessons" value="45" />
                <Stat label="Free tier" value="3 / week" />
                <Stat label="Per session" value="≤ 5 min" />
            </section>

            <h2 className="text-2xl font-bold mt-12 mb-4">How it works</h2>
            <ol className="space-y-5 text-zinc-800 dark:text-zinc-200 list-decimal list-inside">
                <li>
                    <b>Lesson.</b> An AI avatar reads a 60-second lesson drawn
                    from a Carnegie principle, reframed for modern remote work.
                </li>
                <li>
                    <b>Practice.</b> You speak your answer to a short prompt.
                    Your camera analyzes posture and eye contact{' '}
                    <em>entirely on-device</em> — frames never leave your browser.
                </li>
                <li>
                    <b>Feedback.</b> A Forge Score from 0–100 with one specific
                    insight: the filler you repeat, the hedge you lean on, the
                    moment you broke eye contact.
                </li>
                <li>
                    <b>Streak.</b> Do it tomorrow. The lessons compound.
                </li>
            </ol>

            <h2 className="text-2xl font-bold mt-12 mb-4">What we measure</h2>
            <ul className="space-y-3 text-zinc-800 dark:text-zinc-200 list-disc list-inside">
                <li>
                    <b>Verbal:</b> filler rate (um / uh / like), hedging,
                    words-per-minute, conciseness.
                </li>
                <li>
                    <b>Visual:</b> eye-contact percentage, smile frequency,
                    posture openness — all via Google MediaPipe running locally.
                </li>
                <li>
                    <b>Contextual:</b> Carnegie alignment and sincerity, scored
                    by Anthropic Claude on your transcript.
                </li>
            </ul>

            <h2 className="text-2xl font-bold mt-12 mb-4">Privacy by design</h2>
            <p className="text-zinc-800 dark:text-zinc-200 max-w-2xl">
                No account, no email, no PII. A random UUID in your browser is
                the only identifier we keep. Video stays on your device. Audio is
                transcribed in real time and not retained.
                {' '}
                <Link href="/privacy" className="underline">
                    Read the policy
                </Link>
                .
            </p>

            <h2 className="text-2xl font-bold mt-12 mb-4">The free curriculum</h2>
            <p className="text-zinc-700 dark:text-zinc-300 mb-4">
                Anyone can do the first five lessons. Each is a self-contained
                principle and practice prompt:
            </p>
            <ol className="space-y-2 text-zinc-800 dark:text-zinc-200">
                {freeLessons.map((l) => (
                    <li key={l.lesson_id} className="flex gap-3">
                        <span className="text-zinc-400 font-mono text-sm w-6">
                            #{l.lesson_id}
                        </span>
                        <div>
                            <div className="font-semibold">{l.title}</div>
                            <div className="text-sm text-zinc-600 dark:text-zinc-400">
                                {l.modern_context}
                            </div>
                        </div>
                    </li>
                ))}
            </ol>

            <div className="mt-16 flex flex-col items-center gap-3">
                <Link
                    href="/"
                    className="bg-black text-white px-8 py-3 rounded-full font-semibold shadow-lg active:scale-95 transition-transform"
                >
                    Start your first Forge Session
                </Link>
                <div className="flex gap-4 text-sm text-zinc-500 dark:text-zinc-400 mt-2">
                    <Link href="/privacy" className="hover:underline">
                        Privacy
                    </Link>
                    <Link href="/terms" className="hover:underline">
                        Terms
                    </Link>
                </div>
            </div>
        </main>
    )
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-center">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400 font-semibold">
                {label}
            </div>
            <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-1">{value}</div>
        </div>
    )
}
