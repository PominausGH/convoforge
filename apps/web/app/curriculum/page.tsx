import type { Metadata } from 'next'
import Link from 'next/link'
import { curriculum } from '@/lib/curriculum'
import UpgradeButton from '@/components/UpgradeButton'

export const metadata: Metadata = {
    title: 'Full Curriculum — 158 Communication Lessons | ConvoForge',
    description:
        'Browse all 158 ConvoForge lessons across Carnegie, Chris Voss, Cialdini, NVC, Crucial Conversations, and more. 10 free lessons. 148 Pro lessons with AI coaching.',
    alternates: { canonical: '/curriculum' },
}

const TRACK_META: Record<string, { label: string; author: string; description: string }> = {
    carnegie: {
        label: 'Carnegie Foundations',
        author: 'Dale Carnegie',
        description: 'The timeless principles from How to Win Friends and Influence People, reframed for Slack, Zoom, and modern remote work.',
    },
    voss: {
        label: 'Never Split the Difference',
        author: 'Chris Voss',
        description: 'FBI hostage negotiation tactics applied to salary conversations, stakeholder pushback, and client escalations.',
    },
    cialdini: {
        label: 'Influence',
        author: 'Robert Cialdini',
        description: 'The six principles of persuasion — reciprocity, commitment, social proof, authority, liking, scarcity — used ethically in professional contexts.',
    },
    nvc: {
        label: 'Nonviolent Communication',
        author: 'Marshall Rosenberg',
        description: 'Observations vs. evaluations, feelings vs. judgements, needs vs. strategies. The framework for feedback that lands without defensiveness.',
    },
    storytelling: {
        label: 'Storytelling',
        author: 'Multiple frameworks',
        description: 'Structure, tension, and delivery for pitches, all-hands updates, and the stories that make your ideas stick.',
    },
    rhetoric: {
        label: 'Rhetoric & Persuasion',
        author: 'Aristotle → modern',
        description: 'Ethos, pathos, logos applied to presentations, proposals, and written communication.',
    },
    fisher_ury: {
        label: 'Getting to Yes',
        author: 'Fisher & Ury',
        description: 'Principled negotiation — separating people from problems, focusing on interests not positions, finding mutual gain.',
    },
    crucial_conversations: {
        label: 'Crucial Conversations',
        author: 'Patterson, Grenny et al.',
        description: 'What to do when stakes are high, opinions differ, and emotions run strong. The STATE framework for high-stakes dialogue.',
    },
    duarte: {
        label: 'Visual Storytelling',
        author: 'Nancy Duarte',
        description: "The hero's journey structure for presentations. How the world is → what could be → the call to action.",
    },
    lencioni: {
        label: 'Team Dynamics',
        author: 'Patrick Lencioni',
        description: 'Trust, conflict, commitment, accountability, results — the five dysfunctions and how to work through them as a manager or peer.',
    },
    kahneman: {
        label: 'Thinking, Fast and Slow',
        author: 'Daniel Kahneman',
        description: 'System 1 vs. System 2 thinking, cognitive biases, and how to communicate in ways that account for how decisions are actually made.',
    },
    cuddy: {
        label: 'Presence',
        author: 'Amy Cuddy',
        description: 'Body language, power poses, and how your physical state changes the way you communicate — especially under pressure.',
    },
    peterson: {
        label: 'Maps of Meaning',
        author: 'Jordan Peterson',
        description: 'Clarity, responsibility, and precision in language. How to say exactly what you mean and mean exactly what you say.',
    },
    real_world: {
        label: 'Real-World Scenarios',
        author: 'Applied practice',
        description: "Cold outreach, delivering bad news, networking, client escalations, returning to work — the situations that don't fit neatly into a framework.",
    },
}

const TRACK_ORDER = [
    'carnegie', 'voss', 'cialdini', 'nvc', 'storytelling', 'rhetoric',
    'fisher_ury', 'crucial_conversations', 'duarte', 'lencioni',
    'kahneman', 'cuddy', 'peterson', 'real_world',
]

export default function CurriculumPage() {
    const byTrack = TRACK_ORDER.map((trackKey) => ({
        key: trackKey,
        meta: TRACK_META[trackKey],
        lessons: curriculum.filter((l) => (l.track ?? 'carnegie') === trackKey),
    })).filter((t) => t.lessons.length > 0)

    const freeCount = curriculum.filter((l) => l.tier_required === 'free').length
    const proCount = curriculum.filter((l) => l.tier_required === 'pro').length

    return (
        <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
            {/* NAV */}
            <nav className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
                <Link href="/" className="font-black text-lg tracking-tight">ConvoForge</Link>
                <div className="flex items-center gap-4 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                    <Link href="/forge" className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-full hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors">
                        Open app
                    </Link>
                </div>
            </nav>

            {/* HEADER */}
            <section className="bg-gradient-to-br from-black via-zinc-900 to-zinc-950 text-white">
                <div className="max-w-4xl mx-auto px-6 py-16 md:py-24">
                    <div className="text-[11px] uppercase tracking-[0.3em] text-zinc-400 font-bold mb-4">
                        Full curriculum
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.05] mb-6">
                        158 lessons.<br />14 frameworks.<br />One daily habit.
                    </h1>
                    <p className="text-zinc-300 text-lg max-w-2xl leading-relaxed mb-8">
                        Carnegie, Voss, Cialdini, NVC, Crucial Conversations, Kahneman, Cuddy — every major framework in communication and persuasion, broken into five-minute practice sessions with live AI feedback.
                    </p>
                    <div className="flex flex-wrap gap-4 mb-8">
                        <span className="bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-semibold">
                            {freeCount} free lessons
                        </span>
                        <span className="bg-violet-500/20 border border-violet-500/30 rounded-full px-4 py-1.5 text-sm font-semibold text-violet-300">
                            {proCount} Pro lessons
                        </span>
                        <span className="bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-semibold">
                            14 frameworks
                        </span>
                    </div>
                    <UpgradeButton className="inline-block bg-violet-600 hover:bg-violet-500 text-white font-bold px-6 py-3 rounded-full transition-colors">
                        Unlock all 148 Pro lessons — $9/month
                    </UpgradeButton>
                </div>
            </section>

            {/* TRACK LIST */}
            <div className="max-w-4xl mx-auto px-6 py-16 space-y-20">
                {byTrack.map(({ key, meta, lessons }) => (
                    <section key={key} aria-labelledby={`track-${key}`}>
                        <div className="mb-6">
                            <div className="text-[10px] uppercase tracking-[0.3em] text-rose-600 font-bold mb-1">
                                {meta.author}
                            </div>
                            <h2 id={`track-${key}`} className="text-2xl font-black mb-2">
                                {meta.label}
                                <span className="ml-3 text-sm font-normal text-zinc-500 dark:text-zinc-400">
                                    {lessons.length} lesson{lessons.length !== 1 ? 's' : ''}
                                </span>
                            </h2>
                            <p className="text-zinc-600 dark:text-zinc-300 text-sm max-w-2xl leading-relaxed">
                                {meta.description}
                            </p>
                        </div>

                        <div className="divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-100 dark:border-zinc-800 rounded-2xl overflow-hidden">
                            {lessons.map((lesson) => (
                                <div
                                    key={lesson.lesson_id}
                                    className={`flex items-start gap-4 p-4 ${
                                        lesson.tier_required === 'pro'
                                            ? 'bg-zinc-50/50 dark:bg-zinc-900/50'
                                            : 'bg-white dark:bg-zinc-950'
                                    }`}
                                >
                                    <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500 mt-0.5 w-6 shrink-0 text-right">
                                        {lesson.lesson_id}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`text-sm font-bold ${lesson.tier_required === 'pro' ? 'text-zinc-500 dark:text-zinc-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                                                {lesson.tier_required === 'pro' && (
                                                    <span aria-hidden className="mr-1">🔒</span>
                                                )}
                                                {lesson.title}
                                            </span>
                                            {lesson.tier_required === 'free' && (
                                                <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-full px-2 py-0.5">
                                                    Free
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1">
                                            {lesson.modern_context}
                                        </p>
                                    </div>
                                    {lesson.tier_required === 'free' ? (
                                        <Link
                                            href={`/session?lesson=${lesson.lesson_id}`}
                                            className="shrink-0 text-xs font-semibold text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 rounded-full px-3 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                        >
                                            Start →
                                        </Link>
                                    ) : (
                                        <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-violet-500 dark:text-violet-400">
                                            Pro
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                ))}
            </div>

            {/* BOTTOM CTA */}
            <section className="bg-gradient-to-br from-black via-zinc-900 to-zinc-950 text-white">
                <div className="max-w-3xl mx-auto px-6 py-16 text-center">
                    <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
                        Ready to work through all 158?
                    </h2>
                    <p className="text-zinc-300 mb-8">
                        Five minutes a day. One lesson at a time. Your Forge Score tracks the progress.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/forge"
                            className="bg-white text-black font-bold px-6 py-3 rounded-full hover:bg-zinc-200 transition-colors"
                        >
                            Start free — 10 lessons, no signup
                        </Link>
                        <UpgradeButton className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-6 py-3 rounded-full transition-colors">
                            Unlock Pro — $9/month
                        </UpgradeButton>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="max-w-6xl mx-auto px-6 py-8 text-xs text-zinc-500 dark:text-zinc-400 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-zinc-200 dark:border-zinc-800">
                <div>© {new Date().getFullYear()} ConvoForge</div>
                <div className="flex gap-5">
                    <Link href="/privacy" className="hover:underline">Privacy</Link>
                    <Link href="/terms" className="hover:underline">Terms</Link>
                    <Link href="/forge" className="hover:underline">Open app</Link>
                </div>
            </footer>
        </div>
    )
}
