'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { curriculum } from '@/lib/curriculum';
import { fetchUserProfile, type UserProfile } from '@/lib/api';
import UpgradeButton from '@/components/UpgradeButton';
import ThemeToggle from '@/components/ThemeToggle';
import { trackEvent, ANALYTICS_EVENTS } from '@/lib/analytics';

type Stage = 'later_life' | 'starting_out';

const STAGES: Record<Stage, { label: string; blurb: string; places: { name: string; search: string; why: string }[] }> = {
    later_life: {
        label: 'Later in life',
        blurb:
            'Retired, moved, newly on your own, or just finding the old circle has shrunk? You are not the only one, and most groups are glad to see new faces.',
        places: [
            { name: 'Walking groups', search: 'walking group', why: 'Easy pace, side-by-side chat, same faces each week.' },
            { name: 'Volunteering', search: 'volunteer opportunities', why: 'A role to play, so there is no awkward small talk.' },
            { name: 'Classes & lifelong learning', search: 'adult education classes', why: 'Art, languages, history, or tech. You learn alongside the same people.' },
            { name: 'Community & senior centers', search: 'community center', why: 'Clubs, lunches, and events all in one place.' },
            { name: 'Choirs & music groups', search: 'community choir', why: 'Singing together builds closeness quickly.' },
            { name: 'Faith & cultural groups', search: 'community groups', why: 'Built-in regular meetings and people who look out for each other.' },
        ],
    },
    starting_out: {
        label: 'Starting out',
        blurb:
            "New city, finished school, or your friends have scattered? Making friends as an adult doesn't happen by accident. You choose a group and keep going back.",
        places: [
            { name: 'Run & walk clubs', search: 'run club', why: 'Free, weekly, and usually followed by coffee.' },
            { name: 'Rec sports leagues', search: 'social sports league', why: "Same team every week. You don't need to be good." },
            { name: 'Climbing & fitness classes', search: 'bouldering gym', why: 'Lots of downtime between climbs, so talking is natural.' },
            { name: 'Board-game & quiz nights', search: 'board game night', why: 'The game gives you something to talk about.' },
            { name: 'Hobby meetups', search: 'meetup groups', why: 'Book clubs, coding, crafts, photography: pick what you already like.' },
            { name: 'Volunteering', search: 'volunteer opportunities', why: 'Meet people who care about the same things you do.' },
        ],
    },
};

const LADDER = [
    { step: 'Show up', detail: 'Pick one group that meets weekly. Regular beats exciting.' },
    { step: 'Come back', detail: 'Go at least 4 times. Most friendships start from seeing the same faces again and again.' },
    { step: 'Remember one thing', detail: 'Use their name and mention something they told you last time.' },
    { step: 'Follow up', detail: 'A short message within a day: "Great chatting about X. See you Thursday?"' },
    { step: 'Invite', detail: 'Suggest something specific outside the group, like a coffee or a walk. Leave an easy out.' },
];

const lessonsFor = (stage: Stage) =>
    curriculum
        .filter((l) => l.track === 'new_friends' && l.life_stage === stage)
        .slice()
        .sort((a, b) => (a.sort_order ?? a.lesson_id) - (b.sort_order ?? b.lesson_id));

const mapsSearch = (q: string) => `https://www.google.com/maps/search/${encodeURIComponent(`${q} near me`)}`;

export default function FriendsLabPage() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [stage, setStage] = useState<Stage>('later_life');

    useEffect(() => {
        trackEvent(ANALYTICS_EVENTS.friendsLabView);
        const id = typeof window !== 'undefined' ? localStorage.getItem('cf_user_id') : null;
        if (id) fetchUserProfile(id).then(setProfile).catch(() => undefined);
    }, []);

    const isPro = profile?.tier === 'pro';
    const current = STAGES[stage];
    const lessons = lessonsFor(stage);

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

            <header className="max-w-3xl mx-auto px-6 pt-6 pb-8">
                <div className="text-[10px] uppercase tracking-[0.3em] text-rose-600 font-bold mb-2">Friends Lab</div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.05] mb-4">
                    Join a group.<br />Make a friend.
                </h1>
                <p className="text-zinc-600 dark:text-zinc-300 text-lg leading-relaxed max-w-xl">
                    Making friends gets harder at both ends of life, when school or work no longer puts people
                    in front of you. Find a group, practice what to say out loud, and get gentle feedback on how
                    warm and curious you sound, and whether you suggested a next step.
                </p>
            </header>

            <div className="max-w-3xl mx-auto px-6 pb-8">
                <div role="tablist" aria-label="Life stage" className="inline-flex rounded-full border border-zinc-300 dark:border-zinc-700 p-1">
                    {(Object.keys(STAGES) as Stage[]).map((key) => (
                        <button
                            key={key}
                            role="tab"
                            aria-selected={stage === key}
                            onClick={() => setStage(key)}
                            className={`px-5 py-2 rounded-full text-base font-semibold transition-colors ${
                                stage === key
                                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-black'
                                    : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                            }`}
                        >
                            {STAGES[key].label}
                        </button>
                    ))}
                </div>
                <p className="mt-4 text-base text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-xl">{current.blurb}</p>
            </div>

            <section className="max-w-3xl mx-auto px-6 pb-14">
                <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">Where to find your people</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                    {current.places.map((place) => (
                        <div key={place.name} className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col">
                            <h3 className="font-bold text-base">{place.name}</h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1 leading-relaxed flex-1">{place.why}</p>
                            <a
                                href={mapsSearch(place.search)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-3 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                Find one near me ↗
                            </a>
                        </div>
                    ))}
                </div>
            </section>

            <section className="max-w-3xl mx-auto px-6 pb-14">
                <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">From stranger to friend</h2>
                <ol className="space-y-3">
                    {LADDER.map((rung, i) => (
                        <li key={rung.step} className="flex gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4">
                            <div className="shrink-0 w-8 h-8 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-black font-black text-sm flex items-center justify-center">
                                {i + 1}
                            </div>
                            <div>
                                <h3 className="font-bold">{rung.step}</h3>
                                <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1 leading-relaxed">{rung.detail}</p>
                            </div>
                        </li>
                    ))}
                </ol>
            </section>

            <section className="max-w-3xl mx-auto px-6 pb-20">
                <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">Practice it out loud</h2>
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-100 dark:border-zinc-800 rounded-2xl overflow-hidden">
                    {lessons.map((lesson) => {
                        const unlocked = isPro || lesson.tier_required === 'free';
                        return (
                            <div key={lesson.lesson_id} className="flex items-start gap-4 p-4 bg-white dark:bg-zinc-950">
                                <div className="flex-1 min-w-0">
                                    <span className="text-base font-bold">{lesson.title}</span>
                                    {lesson.tier_required === 'free' && (
                                        <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Free</span>
                                    )}
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-2">{lesson.practice_prompt}</p>
                                </div>
                                {unlocked ? (
                                    <Link
                                        href={`/session?lesson=${lesson.lesson_id}`}
                                        onClick={() =>
                                            trackEvent(ANALYTICS_EVENTS.lessonStart, {
                                                lesson_id: lesson.lesson_id,
                                                tier: profile?.tier ?? 'free',
                                                source: 'friends_lab',
                                            })
                                        }
                                        className="shrink-0 text-sm font-semibold border border-zinc-300 dark:border-zinc-700 rounded-full px-4 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                    >
                                        Practice →
                                    </Link>
                                ) : (
                                    <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-violet-500 dark:text-violet-400 mt-1">Pro</span>
                                )}
                            </div>
                        );
                    })}
                </div>

                {!isPro && (
                    <div className="mt-6 bg-gradient-to-br from-violet-500/10 to-blue-500/10 border border-violet-500/20 rounded-2xl p-5">
                        <p className="text-zinc-700 dark:text-zinc-300 text-sm mb-3">
                            The first scenario in each path is free. Pro unlocks the rest, plus all lessons and unlimited sessions.
                        </p>
                        <UpgradeButton
                            trackProps={{ source: 'friends_lab' }}
                            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
                        >
                            Upgrade to Pro — $9/month
                        </UpgradeButton>
                    </div>
                )}
            </section>
        </div>
    );
}
