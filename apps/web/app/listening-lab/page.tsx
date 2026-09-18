'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { curriculum } from '@/lib/curriculum';
import { fetchUserProfile, type UserProfile } from '@/lib/api';
import { ListeningStimulusGuide } from '@/components/ListeningStimulusGuide';
import UpgradeButton from '@/components/UpgradeButton';
import ThemeToggle from '@/components/ThemeToggle';
import { trackEvent, ANALYTICS_EVENTS } from '@/lib/analytics';

const LISTENING_LESSONS = curriculum
    .filter((l) => l.track === 'active_listening')
    .slice()
    .sort((a, b) => (a.sort_order ?? a.lesson_id) - (b.sort_order ?? b.lesson_id));

export default function ListeningLabPage() {
    const [profile, setProfile] = useState<UserProfile | null>(null);

    useEffect(() => {
        trackEvent(ANALYTICS_EVENTS.listeningLabView);
        const id = typeof window !== 'undefined' ? localStorage.getItem('cf_user_id') : null;
        if (id) fetchUserProfile(id).then(setProfile).catch(() => undefined);
    }, []);

    const isPro = profile?.tier === 'pro';

    return (
        <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
            <nav className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
                <Link href="/" className="font-black text-lg tracking-tight">ConvoForge</Link>
                <div className="flex items-center gap-4">
                    <ThemeToggle />
                    <Link
                        href="/forge"
                        className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-full text-sm font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                    >
                        Open app
                    </Link>
                </div>
            </nav>

            <header className="max-w-3xl mx-auto px-6 pt-6 pb-10">
                <div className="text-[10px] uppercase tracking-[0.3em] text-rose-600 font-bold mb-2">
                    Listening Lab
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.05] mb-4">
                    Hear it. Feel it.<br />Reflect it back.
                </h1>
                <p className="text-zinc-600 dark:text-zinc-300 text-base leading-relaxed max-w-xl">
                    The avatar tells you a short story or complaint. Your job isn&rsquo;t to respond to
                    it or fix it &mdash; it&rsquo;s to reflect it back, accurately and with the feeling
                    intact. An AI coach scores your accuracy, whether you named the emotion, and how much
                    you paraphrased versus parroted.
                </p>
            </header>

            <section className="max-w-3xl mx-auto px-6 pb-14">
                <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">
                    What a good reflection covers
                </h2>
                <ListeningStimulusGuide />
            </section>

            <section className="max-w-3xl mx-auto px-6 pb-20">
                <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">
                    Practice a reflection now
                </h2>

                {!isPro && (
                    <div className="bg-gradient-to-br from-violet-500/10 to-blue-500/10 border border-violet-500/20 rounded-2xl p-5 mb-5">
                        <div className="text-violet-600 dark:text-violet-400 text-xs font-bold uppercase mb-1">
                            Listening Lab is a Pro feature
                        </div>
                        <p className="text-zinc-700 dark:text-zinc-300 text-sm mb-3">
                            Accuracy, validation, and paraphrase-quality scoring on every reflection &mdash;
                            plus all 173+ Pro lessons and unlimited sessions.
                        </p>
                        <UpgradeButton className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-2.5 rounded-xl text-sm transition-colors">
                            Upgrade to Pro &mdash; $9/month
                        </UpgradeButton>
                    </div>
                )}

                <div className="divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-100 dark:border-zinc-800 rounded-2xl overflow-hidden">
                    {LISTENING_LESSONS.map((lesson) => (
                        <div key={lesson.lesson_id} className="flex items-start gap-4 p-4 bg-white dark:bg-zinc-950">
                            <div className="flex-1 min-w-0">
                                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                    {lesson.title}
                                </span>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-2">
                                    {lesson.modern_context}
                                </p>
                            </div>
                            {isPro ? (
                                <Link
                                    href={`/session?lesson=${lesson.lesson_id}`}
                                    onClick={() =>
                                        trackEvent(ANALYTICS_EVENTS.lessonStart, {
                                            lesson_id: lesson.lesson_id,
                                            tier: 'pro',
                                            source: 'listening_lab',
                                        })
                                    }
                                    className="shrink-0 text-xs font-semibold text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 rounded-full px-3 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    Practice →
                                </Link>
                            ) : (
                                <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-violet-500 dark:text-violet-400 mt-0.5">
                                    Pro
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
