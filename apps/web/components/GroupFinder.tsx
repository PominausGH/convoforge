'use client';

import { useEffect, useState } from 'react';
import { suggestGroups, type GroupSuggestion } from '@/lib/api';
import { trackEvent, ANALYTICS_EVENTS } from '@/lib/analytics';
import type { LifeStage } from '@/lib/friendChallenges';

const INTERESTS: Record<LifeStage, string[]> = {
    later_life: [
        'Walking', 'Gardening', 'Books', 'History', 'Singing', 'Art & crafts', 'Cooking',
        'Card & board games', 'Dancing', 'Languages', 'Faith', 'Bowls & golf', 'Volunteering',
    ],
    starting_out: [
        'Running', 'Climbing', 'Team sports', 'Board games', 'Books', 'Video games', 'Music',
        'Hiking', 'Cooking', 'Art', 'Tech & coding', 'Dancing', 'Photography', 'Volunteering',
    ],
};

const STORAGE_KEY = 'cf_group_finder';

type Saved = {
    area: string;
    interests: string[];
    ai?: { key: string; suggestions: GroupSuggestion[]; encouragement?: string | null };
};

const enc = encodeURIComponent;

/** Search links for a query in an area. Meetup/Eventbrite go via a site: search so any area format works. */
function searchLinks(query: string, area: string) {
    const q = `${query} ${area}`;
    return [
        { label: 'Maps', href: `https://www.google.com/maps/search/${enc(`${query} in ${area}`)}` },
        { label: 'Web', href: `https://www.google.com/search?q=${enc(q)}` },
        { label: 'Meetup', href: `https://www.google.com/search?q=${enc(`site:meetup.com ${q}`)}` },
        { label: 'Eventbrite', href: `https://www.google.com/search?q=${enc(`site:eventbrite.com ${q}`)}` },
        { label: 'Facebook', href: `https://www.facebook.com/search/groups/?q=${enc(q)}` },
    ];
}

function LinkRow({ query, area }: { query: string; area: string }) {
    return (
        <div className="flex flex-wrap gap-2 mt-2">
            {searchLinks(query, area).map((l) => (
                <a
                    key={l.label}
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-full px-3 py-1 hover:underline"
                >
                    {l.label} ↗
                </a>
            ))}
        </div>
    );
}

function getUserId(): string {
    let id = localStorage.getItem('cf_user_id');
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem('cf_user_id', id);
    }
    return id;
}

export default function GroupFinder({ stage }: { stage: LifeStage }) {
    const [area, setArea] = useState('');
    const [interests, setInterests] = useState<string[]>([]);
    const [custom, setCustom] = useState('');
    const [searched, setSearched] = useState<{ area: string; interests: string[] } | null>(null);
    const [ai, setAi] = useState<Saved['ai'] | null>(null);
    const [aiState, setAiState] = useState<'idle' | 'loading' | 'error'>('idle');
    const [aiError, setAiError] = useState('');

    useEffect(() => {
        try {
            const saved: Saved | null = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
            if (saved?.area) {
                setArea(saved.area);
                setInterests(saved.interests ?? []);
                if (saved.interests?.length) setSearched({ area: saved.area, interests: saved.interests });
                if (saved.ai) setAi(saved.ai);
            }
        } catch {
            /* ignore bad saved state */
        }
    }, []);

    const aiKey = (a: string, list: string[]) => `${stage}|${a.toLowerCase()}|${[...list].sort().join(',').toLowerCase()}`;
    const persist = (next: Saved) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
            /* storage unavailable */
        }
    };

    const toggle = (interest: string) =>
        setInterests((prev) => (prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]));

    const addCustom = () => {
        const v = custom.trim().slice(0, 40);
        if (v && !interests.some((i) => i.toLowerCase() === v.toLowerCase()) && interests.length < 12) {
            setInterests((prev) => [...prev, v]);
        }
        setCustom('');
    };

    const canSearch = area.trim().length >= 2 && interests.length > 0;

    const search = async () => {
        if (!canSearch) return;
        const a = area.trim();
        const list = interests.slice(0, 12);
        setSearched({ area: a, interests: list });
        trackEvent(ANALYTICS_EVENTS.groupFinderSearch, { stage, interest_count: list.length });

        const key = aiKey(a, list);
        if (ai?.key === key) {
            persist({ area: a, interests: list, ai });
            return; // same request as last time — reuse, no extra AI call
        }
        persist({ area: a, interests: list });
        setAi(null);
        setAiState('loading');
        try {
            const res = await suggestGroups({ user_id: getUserId(), area: a, interests: list, life_stage: stage });
            const nextAi = { key, suggestions: res.suggestions, encouragement: res.encouragement };
            setAi(nextAi);
            setAiState('idle');
            persist({ area: a, interests: list, ai: nextAi });
        } catch (err) {
            setAiState('error');
            setAiError(err instanceof Error ? err.message : 'Suggestions failed');
        }
    };

    const options = Array.from(new Set([...INTERESTS[stage], ...interests]));
    const showAi = ai && searched && ai.key === aiKey(searched.area, searched.interests);

    return (
        <div>
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
                <label htmlFor="gf-area" className="block text-base font-bold mb-2">
                    Where do you live?
                </label>
                <input
                    id="gf-area"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    maxLength={80}
                    placeholder="Town, city, or postcode"
                    autoComplete="address-level2"
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600"
                />

                <p className="text-base font-bold mt-5 mb-2">What are you into?</p>
                <div className="flex flex-wrap gap-2">
                    {options.map((interest) => {
                        const on = interests.includes(interest);
                        return (
                            <button
                                key={interest}
                                onClick={() => toggle(interest)}
                                aria-pressed={on}
                                className={`text-sm font-semibold px-3.5 py-2 rounded-full border transition-colors ${
                                    on
                                        ? 'bg-zinc-900 dark:bg-white text-white dark:text-black border-zinc-900 dark:border-white'
                                        : 'border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                }`}
                            >
                                {on ? '✓ ' : ''}
                                {interest}
                            </button>
                        );
                    })}
                </div>
                <div className="flex gap-2 mt-3">
                    <input
                        value={custom}
                        onChange={(e) => setCustom(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                addCustom();
                            }
                        }}
                        maxLength={40}
                        placeholder="Something else? e.g. birdwatching"
                        aria-label="Add your own interest"
                        className="flex-1 min-w-0 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-base focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600"
                    />
                    <button
                        onClick={addCustom}
                        disabled={!custom.trim()}
                        className="shrink-0 text-sm font-semibold border border-zinc-300 dark:border-zinc-700 rounded-xl px-4 disabled:opacity-40"
                    >
                        Add
                    </button>
                </div>

                <button
                    onClick={search}
                    disabled={!canSearch || aiState === 'loading'}
                    className="mt-5 w-full bg-black dark:bg-white text-white dark:text-black font-bold py-3 rounded-xl text-base disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {aiState === 'loading' ? 'Finding ideas…' : 'Find groups near me'}
                </button>
                <p className="text-xs text-zinc-500 mt-2">
                    Your area and interests stay on this device. They&rsquo;re sent once to make suggestions and
                    aren&rsquo;t saved on our servers.
                </p>
            </div>

            {searched && (
                <div className="mt-8">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">
                        Ideas for you
                    </h3>
                    {aiState === 'loading' && (
                        <p className="text-base text-zinc-500 animate-pulse">Thinking about groups that suit you…</p>
                    )}
                    {aiState === 'error' && (
                        <p className="text-sm text-red-600 dark:text-red-400">
                            {aiError} The searches below still work.
                        </p>
                    )}
                    {showAi && (
                        <div className="space-y-3">
                            {ai.encouragement && (
                                <p className="text-base text-zinc-700 dark:text-zinc-300 leading-relaxed">{ai.encouragement}</p>
                            )}
                            {ai.suggestions.map((s) => (
                                <div key={s.group_type} className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4">
                                    <h4 className="font-bold text-base">{s.group_type}</h4>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1 leading-relaxed">{s.why}</p>
                                    {s.first_step && (
                                        <p className="text-sm mt-2 leading-relaxed">
                                            <span className="font-semibold">This week: </span>
                                            {s.first_step}
                                        </p>
                                    )}
                                    <LinkRow query={s.search_query} area={searched.area} />
                                </div>
                            ))}
                            <p className="text-xs text-zinc-500">
                                These are ideas, not listings. Use the links to find real groups and check meeting times.
                            </p>
                        </div>
                    )}

                    <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mt-8 mb-3">
                        Search by interest in {searched.area}
                    </h3>
                    <div className="space-y-3">
                        {searched.interests.map((interest) => (
                            <div key={interest} className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4">
                                <h4 className="font-bold text-base">{interest}</h4>
                                <LinkRow query={`${interest} group`} area={searched.area} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
