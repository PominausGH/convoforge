import type { Metadata } from 'next'
import Link from 'next/link'
import LandingCTA from '@/components/LandingCTA'
import ThemeToggle from '@/components/ThemeToggle'
import UpgradeButton from '@/components/UpgradeButton'
import { fetchPublicStats } from '@/lib/stats'
import { getAllPosts, formatDate } from '@/lib/blog'

export const revalidate = 300

export const metadata: Metadata = {
    alternates: { canonical: '/' },
}

const FAQS: Array<[string, string]> = [
    [
        'Do you save my voice or camera feed?',
        'No. Video runs on-device via MediaPipe WebAssembly — frames never leave your browser. Audio is transcribed in real time and not retained. Only the resulting scores and transcript are stored, keyed to an anonymous ID.',
    ],
    [
        'What if I miss a day?',
        'Your streak resets, but all your past sessions and scores stay. Pick the next lesson and keep going.',
    ],
    [
        'Does this work on mobile?',
        'Yes — any modern mobile browser with microphone and camera permissions. A native app is on the roadmap.',
    ],
    [
        'Do I need an account?',
        'No. ConvoForge uses an anonymous ID in your browser. Optional email sync for cross-device progress is coming soon.',
    ],
    [
        'Why Carnegie? That book is from 1936.',
        'The principles outlast the era. Each one is translated to modern contexts — Slack tone, Zoom presence, async feedback. We also mix in Nonviolent Communication, Radical Candor, and tactical empathy frameworks.',
    ],
    [
        'How is this different from Yoodli or Poised?',
        'Yoodli scores your meetings after they happen. Poised overlays a live meeting. ConvoForge is a daily practice — five minutes, structured, habit-forming — so the skills are already there when the real meeting starts.',
    ],
    [
        'Can I cancel Pro?',
        'Yes, anytime via Stripe. You keep Pro features until the end of your billing period. Seven-day refund, no questions asked.',
    ],
]

const jsonLdWebApp = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'ConvoForge',
    url: 'https://convoforge.app',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Any',
    description:
        'Daily AI communication coaching. Carnegie-grounded lessons plus real-time voice and body language feedback.',
    offers: [
        { '@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'USD' },
        {
            '@type': 'Offer',
            name: 'Pro',
            price: '9',
            priceCurrency: 'USD',
            priceValidUntil: '2027-01-01',
        },
    ],
}

const jsonLdCourse = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: 'ConvoForge — Carnegie + Modern Communication Curriculum',
    description:
        '158 daily micro-lessons translating Carnegie principles, Nonviolent Communication, Radical Candor, and tactical empathy into modern remote-work scenarios with live AI coaching.',
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
        { '@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'USD' },
        { '@type': 'Offer', name: 'Pro', price: '9', priceCurrency: 'USD' },
    ],
}

const jsonLdFAQ = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map(([q, a]) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
    })),
}

const jsonLd = [jsonLdWebApp, jsonLdCourse, jsonLdFAQ]

export default async function Landing() {
    const stats = await fetchPublicStats()
    const showLiveStats = stats != null && stats.total_sessions >= 5
    const latestPosts = (await getAllPosts()).slice(0, 4)

    return (
        <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/* ── NAV ───────────────────────────────────────────── */}
            <nav className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
                <div className="font-black text-lg tracking-tight">
                    ConvoForge
                </div>
                <div className="flex items-center gap-4 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                    <a href="#how" className="hidden sm:inline hover:text-zinc-900 dark:hover:text-white">
                        How it works
                    </a>
                    <Link href="/curriculum" className="hidden sm:inline hover:text-zinc-900 dark:hover:text-white">
                        Curriculum
                    </Link>
                    <a href="#pricing" className="hidden sm:inline hover:text-zinc-900 dark:hover:text-white">
                        Pricing
                    </a>
                    <a href="#faq" className="hidden sm:inline hover:text-zinc-900 dark:hover:text-white">
                        FAQ
                    </a>
                    <Link href="/blog" className="hover:text-zinc-900 dark:hover:text-white">
                        Blog
                    </Link>
                    <ThemeToggle />
                    <Link
                        href="/forge"
                        className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-full hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                    >
                        Open app
                    </Link>
                </div>
            </nav>

            {/* ── HERO ──────────────────────────────────────────── */}
            <section aria-labelledby="hero-heading" className="relative overflow-hidden bg-gradient-to-br from-black via-zinc-900 to-zinc-950 text-white">
                <div className="max-w-6xl mx-auto px-6 py-20 md:py-32">
                    <div className="max-w-3xl">
                        <div className="text-[11px] uppercase tracking-[0.3em] text-zinc-400 font-bold mb-6">
                            Daily AI communication coaching · public speaking practice · filler-word tracker
                        </div>
                        <h1 id="hero-heading" className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05]">
                            Stop winging the conversations{' '}
                            <span className="text-rose-400">that actually matter.</span>
                        </h1>
                        <p className="text-lg md:text-xl mt-4 max-w-2xl font-semibold text-rose-300">
                            The 5-minute daily habit that makes you better in every conversation that counts.
                        </p>
                        <p className="text-zinc-300 text-base md:text-lg mt-6 max-w-2xl leading-relaxed">
                            Carnegie-grounded lessons. Real-time feedback on your verbal patterns,
                            body language, and message clarity. Five minutes a day, private by
                            design, with a Forge Score that proves you&apos;re improving.
                        </p>
                        <div className="mt-10">
                            <LandingCTA variant="hero" />
                        </div>
                        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-zinc-400">
                            <span className="flex items-center gap-1.5">
                                <span aria-hidden>📷</span> Needs camera + microphone
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span aria-hidden>🔒</span> Video stays on your device
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span aria-hidden>⏱</span> 5 minutes per session
                            </span>
                        </div>
                    </div>
                </div>

                {/* subtle grid decoration */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-[0.07]"
                    style={{
                        backgroundImage:
                            'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
                        backgroundSize: '48px 48px',
                    }}
                />
            </section>

            {/* ── WHY CONVOFORGE ────────────────────────────────── */}
            <section aria-labelledby="why-heading" className="max-w-6xl mx-auto px-6 py-20 md:py-28">
                <div className="text-center mb-14">
                    <div className="text-[11px] uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400 font-bold mb-3">
                        Why ConvoForge
                    </div>
                    <h2 id="why-heading" className="text-3xl md:text-4xl font-black tracking-tight">
                        You don&apos;t have a knowledge problem.<br className="hidden md:block" /> You have a practice problem.
                    </h2>
                    <p className="text-zinc-600 dark:text-zinc-300 mt-4 max-w-2xl mx-auto">
                        You know eye contact matters. You know not to say &ldquo;um.&rdquo; In the moment — when your manager asks the question you weren&apos;t expecting, or you&apos;re pitching on Zoom to someone who hasn&apos;t smiled once — the knowledge doesn&apos;t show up. The reps do.
                    </p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
                    <WhyPillar
                        icon="⏱"
                        title="5 minutes. Every day. That's the whole ask."
                        body="No 40-hour courses. No live coaches you need to schedule. One session before your morning coffee, and you're building the muscle memory that shows up in real conversations."
                    />
                    <WhyPillar
                        icon="🔒"
                        title="Your video never leaves your device."
                        body="On-device MediaPipe runs body language analysis in your browser. Zero cloud uploads. Zero data brokers. Practise the salary negotiation, the hard feedback — privately."
                    />
                    <WhyPillar
                        icon="📐"
                        title="A curriculum that goes somewhere."
                        body="Most feedback tools tell you what you did wrong. ConvoForge gives you a structured path — Carnegie, Radical Candor, NVC — with a clear progression, not random topics."
                    />
                    <WhyPillar
                        icon="📊"
                        title="Progress you can see."
                        body="Your Forge Score tracks Verbal, Visual, and Sincerity week over week. Watch it move. Know exactly what's improving and what to practise tomorrow."
                    />
                </div>
            </section>

            {/* ── HOW IT WORKS ──────────────────────────────────── */}
            <section id="how" aria-labelledby="how-heading" className="max-w-6xl mx-auto px-6 py-20 md:py-28">
                <div className="text-center mb-14">
                    <div className="text-[11px] uppercase tracking-[0.3em] text-zinc-500 font-bold mb-3">
                        How it works
                    </div>
                    <h2 id="how-heading" className="text-3xl md:text-4xl font-black tracking-tight">
                        Three steps. Five minutes.
                    </h2>
                </div>

                <div className="grid md:grid-cols-3 gap-5">
                    <HowStep
                        n={1}
                        title="Pick a lesson"
                        body="An AI avatar walks you through a 60-second principle — Carnegie, Radical Candor, Nonviolent Communication — reframed for modern work."
                    />
                    <HowStep
                        n={2}
                        title="Practice out loud"
                        body="Record a 90-second response to a real scenario. Your camera reads body language on-device. Your voice streams to live transcription."
                    />
                    <HowStep
                        n={3}
                        title="Get your Forge Score"
                        body="One number, three subscores, one specific thing to work on tomorrow."
                    />
                </div>
            </section>

            {/* ── WHAT GETS MEASURED ────────────────────────────── */}
            <section aria-labelledby="measure-heading" className="bg-zinc-50 dark:bg-zinc-900 border-y border-zinc-200 dark:border-zinc-800">
                <div className="max-w-6xl mx-auto px-6 py-20 md:py-28">
                    <div className="text-center mb-14">
                        <div className="text-[11px] uppercase tracking-[0.3em] text-zinc-500 font-bold mb-3">
                            What gets measured
                        </div>
                        <h2 id="measure-heading" className="text-3xl md:text-4xl font-black tracking-tight">
                            Three parallel streams of feedback.
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-5">
                        <Measure
                            label="Verbal"
                            headline="Filler, hedging, pace, conciseness."
                            body="Streaming speech-to-text picks up every 'um', every 'I think maybe', every moment you raced past 180 words per minute."
                            footnote="Powered by Deepgram Nova-3."
                        />
                        <Measure
                            label="Visual"
                            headline="Eye contact, smile, posture."
                            body="Google MediaPipe runs a face-landmark model directly in your browser, entirely on-device. Video never leaves your machine."
                            footnote="100% private. No frames uploaded."
                        />
                        <Measure
                            label="Contextual"
                            headline="Sincerity, Carnegie alignment, manipulation flags."
                            body="Anthropic Claude reviews your transcript for authentic vs. performative communication, and whether you wielded principles or weaponized them."
                            footnote="Pro tier only."
                        />
                    </div>
                </div>
            </section>

            {/* ── CURRICULUM ────────────────────────────────────── */}
            <section aria-labelledby="curriculum-heading" className="max-w-6xl mx-auto px-6 py-20 md:py-28">
                <div className="text-center mb-14">
                    <div className="text-[11px] uppercase tracking-[0.3em] text-zinc-500 font-bold mb-3">
                        The curriculum
                    </div>
                    <h2 id="curriculum-heading" className="text-3xl md:text-4xl font-black tracking-tight">
                        158 lessons. 3 tracks. Built to last.
                    </h2>
                </div>

                <div className="grid md:grid-cols-3 gap-5">
                    <Track
                        title="Carnegie Foundations"
                        count="10 lessons"
                        tier="Free + Pro"
                        samples={[
                            'Remember names',
                            'Kill the filler',
                            'Admit mistakes quickly',
                            'The 2-minute pitch',
                        ]}
                    />
                    <Track
                        title="Remote & Async"
                        count="35 lessons"
                        tier="Free + Pro"
                        samples={[
                            'The 3-sentence Slack',
                            'The email that skips the meeting',
                            'Loom in 90 seconds',
                            'Status updates that travel',
                        ]}
                    />
                    <Track
                        title="Psychology & High-Stakes"
                        count="113 lessons"
                        tier="Pro"
                        samples={[
                            'Radical Candor',
                            'NVC: observation vs. judgement',
                            'Saying no with grace',
                            'Receiving criticism without defending',
                            'Negotiating a raise in one minute',
                        ]}
                    />
                </div>
                <div className="text-center mt-8">
                    <Link
                        href="/curriculum"
                        className="inline-block text-sm font-semibold text-zinc-600 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 rounded-full px-5 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        Browse all 158 lessons across 14 frameworks →
                    </Link>
                </div>
            </section>

            {/* ── COMPARISON ────────────────────────────────────── */}
            <section id="compare" aria-labelledby="compare-heading" className="bg-zinc-50 dark:bg-zinc-900 border-y border-zinc-200 dark:border-zinc-800">
                <div className="max-w-5xl mx-auto px-6 py-20 md:py-28">
                    <div className="text-center mb-14">
                        <div className="text-[11px] uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400 font-bold mb-3">
                            How we&apos;re different
                        </div>
                        <h2 id="compare-heading" className="text-3xl md:text-4xl font-black tracking-tight">
                            ConvoForge vs. Yoodli vs. Poised
                        </h2>
                        <p className="text-zinc-600 dark:text-zinc-300 mt-4 max-w-2xl mx-auto">
                            Three tools in the AI communication space, three completely different jobs.
                        </p>
                    </div>

                    <div className="overflow-x-auto -mx-4 px-4">
                        <table className="w-full text-sm bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                            <thead className="bg-zinc-100 dark:bg-zinc-900 text-left">
                                <tr>
                                    <th scope="col" className="p-4 font-bold text-xs uppercase tracking-wider text-zinc-600 dark:text-zinc-400">Feature</th>
                                    <th scope="col" className="p-4 font-bold text-zinc-900 dark:text-zinc-100">ConvoForge</th>
                                    <th scope="col" className="p-4 font-semibold text-zinc-600 dark:text-zinc-300">Yoodli</th>
                                    <th scope="col" className="p-4 font-semibold text-zinc-600 dark:text-zinc-300">Poised</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                <CompareRow
                                    feature="Primary job"
                                    cf="Daily 5-min practice habit"
                                    yoodli="After-the-fact meeting analysis"
                                    poised="Live meeting overlay coaching"
                                />
                                <CompareRow
                                    feature="Curriculum"
                                    cf="45 lessons across 3 tracks"
                                    yoodli="Open-ended"
                                    poised="None — reactive only"
                                />
                                <CompareRow
                                    feature="Visual / body-language scoring"
                                    cf="✓ On-device (MediaPipe)"
                                    yoodli="✓"
                                    poised="—"
                                />
                                <CompareRow
                                    feature="Sincerity + Carnegie alignment"
                                    cf="✓ (Claude-scored)"
                                    yoodli="—"
                                    poised="—"
                                />
                                <CompareRow
                                    feature="Async comms practice (Slack, email, Loom)"
                                    cf="✓"
                                    yoodli="—"
                                    poised="—"
                                />
                                <CompareRow
                                    feature="Works before the meeting"
                                    cf="✓ That's the whole point"
                                    yoodli="Post-meeting review only"
                                    poised="In-meeting only"
                                />
                                <CompareRow
                                    feature="Video stays on your device"
                                    cf="✓ On-device only"
                                    yoodli="Uploads to cloud"
                                    poised="Cloud-processed"
                                />
                                <CompareRow
                                    feature="Progress tracking over time"
                                    cf="✓ Forge Score (3 dimensions)"
                                    yoodli="Limited"
                                    poised="Limited"
                                />
                                <CompareRow
                                    feature="Starting price"
                                    cf="Free · $9/mo Pro"
                                    yoodli="Free · $20+/mo Pro"
                                    poised="$8 / hour of coaching"
                                />
                                <CompareRow
                                    feature="Signup required to try"
                                    cf="No — anonymous session"
                                    yoodli="Yes (email)"
                                    poised="Yes (email + install)"
                                />
                            </tbody>
                        </table>
                    </div>

                    <p className="text-center text-xs text-zinc-500 dark:text-zinc-400 mt-8">
                        Comparisons based on public feature pages as of 2026. They&apos;re great tools — we&apos;re just a different shape.
                    </p>
                </div>
            </section>

            {/* ── PRICING ───────────────────────────────────────── */}
            <section
                id="pricing"
                aria-labelledby="pricing-heading"
                className="bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-950 border-t border-zinc-200 dark:border-zinc-800"
            >
                <div className="max-w-5xl mx-auto px-6 py-20 md:py-28">
                    <div className="text-center mb-14">
                        <div className="text-[11px] uppercase tracking-[0.3em] text-zinc-500 font-bold mb-3">
                            Pricing
                        </div>
                        <h2 id="pricing-heading" className="text-3xl md:text-4xl font-black tracking-tight">
                            Start free. Upgrade when you want the whole curriculum.
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-5 max-w-3xl mx-auto">
                        <PriceCard
                            name="Free"
                            price="$0"
                            pricePeriod="forever"
                            pitch="Build the daily habit. Five-minute sessions, three per week."
                            features={[
                                '3 sessions per week',
                                '10 lessons — Carnegie + Remote',
                                'Verbal + visual scoring',
                                'Forge Score + one insight',
                                'On-device privacy',
                            ]}
                            cta="Start free"
                            href="/forge"
                        />
                        <PriceCard
                            name="Pro"
                            price="$9"
                            pricePeriod="/ month · regional pricing via Stripe"
                            pitch="The full curriculum. Unlimited practice. Sincerity scoring."
                            features={[
                                'Unlimited sessions',
                                'All 45 lessons including Psychology & High-Stakes',
                                'Sincerity detector (Claude-scored)',
                                'Carnegie alignment + manipulation flags',
                                'Priority on new lessons',
                            ]}
                            cta="Upgrade to Pro"
                            upgrade
                            featured
                        />
                    </div>

                    <p className="text-center text-xs text-zinc-500 mt-8 max-w-lg mx-auto">
                        Regional pricing via Stripe. Cancel anytime. Seven-day refund, no questions.
                    </p>

                    {/* Pricing reinforcement */}
                    <div className="mt-16 max-w-2xl mx-auto bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 text-center">
                        <p className="text-lg font-black text-zinc-900 dark:text-zinc-100 mb-3">The $9 question.</p>
                        <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                            Is there a single conversation coming up in the next 90 days where being more prepared would be worth $27? If yes — that&apos;s your answer.
                        </p>
                        <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm text-zinc-500 dark:text-zinc-400">
                            <span>vs. 2 artisan coffees ☕☕</span>
                            <span>vs. 1/3 of a Netflix subscription 📺</span>
                            <span>vs. zero improvements to how you communicate 🙃</span>
                        </div>
                    </div>

                    <div className="mt-6 max-w-2xl mx-auto bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-3xl p-6 text-center">
                        <p className="text-sm font-bold text-rose-700 dark:text-rose-300">
                            🔒 Early adopter pricing — $9/month is locked in for life for anyone who upgrades now. Price increases as the scenario library expands.
                        </p>
                    </div>
                </div>
            </section>

            {/* ── TESTIMONIALS ──────────────────────────────────── */}
            <section aria-labelledby="testimonials-heading" className="max-w-6xl mx-auto px-6 py-20 md:py-28">
                <div className="text-center mb-14">
                    <div className="text-[11px] uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400 font-bold mb-3">
                        Early forgers
                    </div>
                    <h2 id="testimonials-heading" className="text-3xl md:text-4xl font-black tracking-tight">
                        Five minutes changed how they show up.
                    </h2>
                </div>
                <div className="grid md:grid-cols-3 gap-5">
                    <Testimonial
                        quote="I had a board presentation coming up and three days to prepare. I ran the scenario six times in ConvoForge over three mornings. My Forge Score went from 54 to 81. The board asked me to stay on the call for an extra 20 minutes."
                        name="Marcus T."
                        role="Head of Product, Series B startup"
                    />
                    <Testimonial
                        quote="I'm an introvert who works fully remote. ConvoForge helped me practise my skip-level review — including when my manager interrupted me — until I stopped freezing. The session report told me I said 'um' 14 times in the first take and twice in the fifth."
                        name="Priya S."
                        role="Senior Engineer"
                    />
                    <Testimonial
                        quote="I've tried Poised and Yoodli. Both are fine if you want to review a meeting you already bombed. ConvoForge is the only tool I've found that actually trains you before the moment."
                        name="Dan K."
                        role="Account Executive"
                    />
                </div>
                <div className="grid md:grid-cols-2 gap-5 mt-5 max-w-3xl mx-auto">
                    <Testimonial
                        quote="As a manager who gives a lot of feedback, I didn't realise how often I was being indirect. The Sincerity score kept calling it out. Uncomfortable — in the best way."
                        name="Rachel M."
                        role="Engineering Manager"
                    />
                    <Testimonial
                        quote="Five minutes a day sounds like nothing. My Forge Score went from 47 to 79 in six weeks. My team started asking if something had changed. Nothing had, except the practice."
                        name="Jordan L."
                        role="Remote Founder"
                    />
                </div>
            </section>

            {/* ── LIVE USAGE — only shown once real data exists (≥20 sessions) ── */}
            {showLiveStats && (
                <section aria-labelledby="live-heading" className="max-w-5xl mx-auto px-6 py-20 md:py-28">
                    <div className="text-center mb-14">
                        <div className="text-[11px] uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400 font-bold mb-3">
                            Live from the forge
                        </div>
                        <h2 id="live-heading" className="text-3xl md:text-4xl font-black tracking-tight">
                            Real practice happening right now.
                        </h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-5">
                        <LiveStat
                            label="Forge sessions"
                            value={stats!.total_sessions.toLocaleString()}
                            footnote="Across all users"
                        />
                        <LiveStat
                            label="Average Forge score"
                            value={`${stats!.avg_forge_score}`}
                            footnote="Across all sessions with a transcript"
                        />
                        <LiveStat
                            label="People practicing"
                            value={stats!.total_users.toLocaleString()}
                            footnote="Anonymous UUID each — no email required"
                        />
                    </div>
                    <p className="text-center text-xs text-zinc-500 dark:text-zinc-400 mt-8">
                        Numbers update hourly. Methodology:{' '}
                        <Link href="/privacy" className="underline hover:text-zinc-700 dark:hover:text-zinc-300">
                            aggregate only, no PII
                        </Link>
                        .
                    </p>
                </section>
            )}

            {/* ── FAQ ───────────────────────────────────────────── */}
            <section id="faq" aria-labelledby="faq-heading" className="bg-zinc-50 dark:bg-zinc-900 border-y border-zinc-200 dark:border-zinc-800">
                <div className="max-w-3xl mx-auto px-6 py-20 md:py-28">
                    <div className="text-center mb-14">
                        <div className="text-[11px] uppercase tracking-[0.3em] text-zinc-500 font-bold mb-3">
                            Frequently asked
                        </div>
                        <h2 id="faq-heading" className="text-3xl md:text-4xl font-black tracking-tight">
                            The short version.
                        </h2>
                    </div>

                    <div className="space-y-4">
                        <FAQ q="Do you save my voice or camera feed?">
                            No. Video runs on-device via MediaPipe WebAssembly — frames never
                            leave your browser. Audio is transcribed in real time and not
                            retained. Only the resulting scores and transcript are stored,
                            keyed to an anonymous ID.
                        </FAQ>
                        <FAQ q="What if I miss a day?">
                            Your streak resets, but all your past sessions and scores stay.
                            Pick the next lesson and keep going.
                        </FAQ>
                        <FAQ q="Does this work on mobile?">
                            Yes — any modern mobile browser with microphone and camera
                            permissions. A native app is on the roadmap.
                        </FAQ>
                        <FAQ q="Do I need an account?">
                            No. ConvoForge uses an anonymous ID in your browser. Optional
                            email sync for cross-device progress is coming soon.
                        </FAQ>
                        <FAQ q="Why Carnegie? That book is from 1936.">
                            The principles outlast the era. Each one is translated to modern
                            contexts — Slack tone, Zoom presence, async feedback. Timeless
                            bones, 2026 wrapping. We also mix in Nonviolent Communication,
                            Radical Candor, and tactical empathy frameworks.
                        </FAQ>
                        <FAQ q="How is this different from Yoodli or Poised?">
                            Yoodli scores your meetings after they happen. Poised overlays a
                            live meeting. ConvoForge is a daily <em>practice</em> — five
                            minutes, structured, habit-forming — so the skills are already
                            there when the real meeting starts.
                        </FAQ>
                        <FAQ q="Can I cancel Pro?">
                            Yes, anytime via Stripe. You keep Pro features until the end of
                            your billing period. Seven-day refund, no questions asked.
                        </FAQ>
                    </div>
                </div>
            </section>

            {/* ── FROM THE BLOG ─────────────────────────────────── */}
            {latestPosts.length > 0 && (
                <section aria-labelledby="blog-heading" className="max-w-6xl mx-auto px-6 py-20 md:py-28">
                    <div className="flex items-end justify-between mb-14 gap-4">
                        <div>
                            <div className="text-[11px] uppercase tracking-[0.3em] text-zinc-500 font-bold mb-3">
                                From the blog
                            </div>
                            <h2 id="blog-heading" className="text-3xl md:text-4xl font-black tracking-tight">
                                Practical essays on saying what you mean.
                            </h2>
                        </div>
                        <Link
                            href="/blog"
                            className="hidden sm:block text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white whitespace-nowrap"
                        >
                            All articles →
                        </Link>
                    </div>

                    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {latestPosts.map((p) => (
                            <li key={p.slug}>
                                <Link
                                    href={`/blog/${p.slug}`}
                                    className="block group h-full p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
                                >
                                    <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                                        <span className="font-semibold uppercase tracking-wider">
                                            {p.frontmatter.tag}
                                        </span>
                                        <span>·</span>
                                        <span>{formatDate(p.frontmatter.date)}</span>
                                    </div>
                                    <div className="font-bold leading-snug group-hover:text-rose-500 transition-colors">
                                        {p.frontmatter.title}
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>

                    <Link
                        href="/blog"
                        className="sm:hidden mt-8 inline-block text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white"
                    >
                        All articles →
                    </Link>
                </section>
            )}

            {/* ── FINAL CTA ─────────────────────────────────────── */}
            <section aria-labelledby="cta-heading" className="bg-gradient-to-br from-black via-zinc-900 to-zinc-950 text-white">
                <div className="max-w-3xl mx-auto px-6 py-20 md:py-28 text-center">
                    <h2 id="cta-heading" className="text-4xl md:text-6xl font-black tracking-tight leading-[1.05]">
                        Ready to forge?
                    </h2>
                    <p className="text-zinc-300 text-lg mt-6 max-w-xl mx-auto">
                        Your first session is 5 minutes and completely free. No signup. No
                        credit card.
                    </p>
                    <div className="mt-10">
                        <LandingCTA variant="final" />
                    </div>
                </div>
            </section>

            {/* ── FOOTER ────────────────────────────────────────── */}
            <footer className="max-w-6xl mx-auto px-6 py-12 text-sm text-zinc-500 dark:text-zinc-400">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
                    <div className="font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                        ConvoForge
                    </div>
                    <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
                        <Link href="/about" className="hover:text-zinc-900 dark:hover:text-zinc-100 hover:underline">
                            About
                        </Link>
                        <Link href="/curriculum" className="hover:text-zinc-900 dark:hover:text-zinc-100 hover:underline">
                            Curriculum
                        </Link>
                        <Link href="/blog" className="hover:text-zinc-900 dark:hover:text-zinc-100 hover:underline">
                            Blog
                        </Link>
                        <Link href="/privacy" className="hover:text-zinc-900 dark:hover:text-zinc-100 hover:underline">
                            Privacy
                        </Link>
                        <Link href="/terms" className="hover:text-zinc-900 dark:hover:text-zinc-100 hover:underline">
                            Terms
                        </Link>
                        <Link href="/forge" className="hover:text-zinc-900 dark:hover:text-zinc-100 hover:underline">
                            Open app
                        </Link>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row items-center justify-between gap-2 pt-6 text-xs text-zinc-500 dark:text-zinc-400">
                    <div>© {new Date().getFullYear()} ConvoForge. Built in Australia.</div>
                    <div>
                        ABN <span className="font-mono">65 366 917 788</span>
                    </div>
                    <div>
                        <a href="https://daintytrading.com" target="_blank" rel="noopener" className="hover:text-zinc-900 dark:hover:text-zinc-100 hover:underline">
                            Built by Dainty Trading
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    )
}

// ─── Section components ───────────────────────────────────────────

function HowStep({
    n,
    title,
    body,
}: {
    n: number
    title: string
    body: string
}) {
    return (
        <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6">
            <div className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400 font-bold mb-3">
                Step {n}
            </div>
            <h3 className="text-xl font-bold mb-2">{title}</h3>
            <p className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed">{body}</p>
        </div>
    )
}

function Measure({
    label,
    headline,
    body,
    footnote,
}: {
    label: string
    headline: string
    body: string
    footnote: string
}) {
    return (
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
            <div className="text-[10px] uppercase tracking-[0.3em] text-rose-600 font-bold mb-3">
                {label}
            </div>
            <h3 className="text-lg font-bold mb-2">{headline}</h3>
            <p className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed mb-4">{body}</p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 italic">{footnote}</p>
        </div>
    )
}

function Track({
    title,
    count,
    tier,
    samples,
}: {
    title: string
    count: string
    tier: string
    samples: string[]
}) {
    return (
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
            <div className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400 font-bold mb-1">
                {tier}
            </div>
            <h3 className="text-lg font-black">{title}</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">{count}</p>
            <ul className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                {samples.map((s) => (
                    <li key={s} className="flex gap-2">
                        <span className="text-rose-400">·</span>
                        <span>{s}</span>
                    </li>
                ))}
            </ul>
        </div>
    )
}

function PriceCard({
    name,
    price,
    pricePeriod,
    pitch,
    features,
    cta,
    href,
    featured,
    upgrade,
}: {
    name: string
    price: string
    pricePeriod: string
    pitch: string
    features: string[]
    cta: string
    href?: string
    featured?: boolean
    upgrade?: boolean
}) {
    return (
        <div
            className={
                featured
                    ? 'bg-black text-white rounded-3xl p-8 shadow-2xl border border-black'
                    : 'bg-white dark:bg-zinc-950 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm'
            }
        >
            <div
                className={`text-[10px] uppercase tracking-[0.3em] font-bold mb-2 ${
                    featured ? 'text-rose-400' : 'text-zinc-500'
                }`}
            >
                {name}
            </div>
            <div className="flex items-baseline gap-2 mb-1">
                <span className="text-4xl font-black">{price}</span>
                <span className={featured ? 'text-zinc-400 text-sm' : 'text-zinc-500 text-sm'}>
                    {pricePeriod}
                </span>
            </div>
            <p
                className={`text-sm mb-6 ${
                    featured ? 'text-zinc-300' : 'text-zinc-600'
                }`}
            >
                {pitch}
            </p>
            <ul className="space-y-2 text-sm mb-8">
                {features.map((f) => (
                    <li key={f} className="flex gap-2">
                        <span className={featured ? 'text-rose-400' : 'text-zinc-900'}>
                            ✓
                        </span>
                        <span>{f}</span>
                    </li>
                ))}
            </ul>
            {upgrade ? (
                <UpgradeButton
                    className={
                        featured
                            ? 'block w-full text-center bg-white text-black font-bold py-3 rounded-full hover:bg-zinc-200 transition-colors'
                            : 'block w-full text-center bg-black text-white font-bold py-3 rounded-full hover:bg-zinc-800 transition-colors'
                    }
                >
                    {cta}
                </UpgradeButton>
            ) : (
                <Link
                    href={href ?? '/forge'}
                    className={
                        featured
                            ? 'block text-center bg-white text-black font-bold py-3 rounded-full hover:bg-zinc-200 transition-colors'
                            : 'block text-center bg-black text-white font-bold py-3 rounded-full hover:bg-zinc-800 transition-colors'
                    }
                >
                    {cta}
                </Link>
            )}
        </div>
    )
}

function CompareRow({
    feature,
    cf,
    yoodli,
    poised,
}: {
    feature: string
    cf: string
    yoodli: string
    poised: string
}) {
    return (
        <tr>
            <td className="p-4 font-semibold text-zinc-900 dark:text-zinc-100">{feature}</td>
            <td className="p-4 text-zinc-900 dark:text-zinc-100 font-semibold bg-rose-50/50 dark:bg-rose-950/10">{cf}</td>
            <td className="p-4 text-zinc-600 dark:text-zinc-300">{yoodli}</td>
            <td className="p-4 text-zinc-600 dark:text-zinc-300">{poised}</td>
        </tr>
    )
}

function LiveStat({
    label,
    value,
    footnote,
}: {
    label: string
    value: string
    footnote: string
}) {
    return (
        <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 text-center">
            <div className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400 font-bold mb-2">
                {label}
            </div>
            <div className="text-5xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 mb-3">
                {value}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">{footnote}</div>
        </div>
    )
}

function WhyPillar({
    icon,
    title,
    body,
}: {
    icon: string
    title: string
    body: string
}) {
    return (
        <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6">
            <div className="text-2xl mb-4" aria-hidden>{icon}</div>
            <h3 className="text-base font-black mb-2 leading-snug">{title}</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">{body}</p>
        </div>
    )
}

function Testimonial({
    quote,
    name,
    role,
}: {
    quote: string
    name: string
    role: string
}) {
    return (
        <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 flex flex-col">
            <blockquote className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed flex-1 mb-4">
                &ldquo;{quote}&rdquo;
            </blockquote>
            <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{name}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{role}</p>
            </div>
        </div>
    )
}

function FAQ({ q, children }: { q: string; children: React.ReactNode }) {
    return (
        <details className="group bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
            <summary className="flex items-center justify-between cursor-pointer list-none">
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{q}</span>
                <span aria-hidden="true" className="text-zinc-400 group-open:rotate-45 transition-transform">
                    +
                </span>
            </summary>
            <div className="mt-3 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{children}</div>
        </details>
    )
}
