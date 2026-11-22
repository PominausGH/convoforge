'use client';

import { useCallback, useEffect, useState } from 'react';

type Cohort = {
    week_start: string;
    users: number;
    week_1_pct: number | null;
    week_2_pct: number | null;
    week_4_pct: number | null;
};

type Stats = {
    total_users: number;
    users_with_a_session: number;
    pro_users: number;
    active_7d: number;
    active_30d: number;
    eligible_users: number;
    returning_users: number;
    returning_pct: number;
    regulars_5plus_days: number;
    avg_sessions_per_user: number;
    cohorts: Cohort[];
};

const KEY_STORAGE = 'cf_admin_token';

function Tile({ label, value, note }: { label: string; value: string | number; note?: string }) {
    return (
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{label}</div>
            <div className="text-3xl font-black mt-1 tabular-nums">{value}</div>
            {note && <div className="text-xs text-zinc-500 mt-1">{note}</div>}
        </div>
    );
}

const pct = (v: number | null) => (v == null ? '…' : `${v}%`);

export default function AdminStatsPage() {
    const [token, setToken] = useState('');
    const [input, setInput] = useState('');
    const [stats, setStats] = useState<Stats | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const load = useCallback(async (key: string) => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/admin/stats', { headers: { 'x-admin-token': key }, cache: 'no-store' });
            const data = await res.json().catch(() => ({}));
            if (res.status === 401) {
                setError('That key is wrong.');
                setToken('');
                try { localStorage.removeItem(KEY_STORAGE); } catch { /* ignore */ }
                return;
            }
            if (res.status === 404) {
                setError('Stats are switched off: ADMIN_STATS_TOKEN is not set on the server.');
                return;
            }
            if (!res.ok) throw new Error(data?.detail || `Error ${res.status}`);
            setStats(data);
            setToken(key);
            try { localStorage.setItem(KEY_STORAGE, key); } catch { /* ignore */ }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not load stats');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        try {
            const saved = localStorage.getItem(KEY_STORAGE);
            if (saved) load(saved);
        } catch { /* ignore */ }
    }, [load]);

    return (
        <main className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
            <div className="max-w-3xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-black">Usage stats</h1>
                    {token && (
                        <div className="flex gap-3 text-sm">
                            <button onClick={() => load(token)} disabled={loading} className="font-semibold hover:underline disabled:opacity-50">
                                {loading ? 'Loading…' : 'Refresh'}
                            </button>
                            <button
                                onClick={() => {
                                    setToken('');
                                    setStats(null);
                                    try { localStorage.removeItem(KEY_STORAGE); } catch { /* ignore */ }
                                }}
                                className="text-zinc-500 hover:underline"
                            >
                                Sign out
                            </button>
                        </div>
                    )}
                </div>

                {!token && (
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (input.trim()) load(input.trim());
                        }}
                        className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 max-w-md"
                    >
                        <label htmlFor="admin-key" className="block font-bold mb-2">Admin key</label>
                        <input
                            id="admin-key"
                            type="password"
                            autoComplete="current-password"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-base"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || loading}
                            className="mt-3 w-full bg-black dark:bg-white text-white dark:text-black font-bold py-2.5 rounded-xl disabled:opacity-40"
                        >
                            {loading ? 'Checking…' : 'Show stats'}
                        </button>
                    </form>
                )}

                {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

                {stats && (
                    <>
                        <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mt-2 mb-3">Coming back</h2>
                        <div className="grid grid-cols-2 gap-3">
                            <Tile
                                label="Returning"
                                value={`${stats.returning_pct}%`}
                                note={`${stats.returning_users} of ${stats.eligible_users} practiced on 2+ days`}
                            />
                            <Tile label="Regulars" value={stats.regulars_5plus_days} note="practiced on 5+ days" />
                            <Tile label="Sessions per user" value={stats.avg_sessions_per_user} note="average" />
                            <Tile label="Pro users" value={stats.pro_users} />
                        </div>

                        <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mt-8 mb-3">Activity</h2>
                        <div className="grid grid-cols-2 gap-3">
                            <Tile label="Active, 7 days" value={stats.active_7d} />
                            <Tile label="Active, 30 days" value={stats.active_30d} />
                            <Tile label="Did a session" value={stats.users_with_a_session} note="ever" />
                            <Tile label="All visitors" value={stats.total_users} note="opened the app" />
                        </div>

                        <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mt-8 mb-1">Weekly groups</h2>
                        <p className="text-xs text-zinc-500 mb-3">
                            Users grouped by the week of their first session, and the share who practiced again 1, 2
                            and 4 weeks later. &ldquo;…&rdquo; means that week hasn&rsquo;t finished yet.
                        </p>
                        {stats.cohorts.length === 0 ? (
                            <p className="text-sm text-zinc-500">No sessions in the last 8 weeks.</p>
                        ) : (
                            <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
                                <table className="w-full text-sm tabular-nums">
                                    <thead className="bg-zinc-50 dark:bg-zinc-900 text-zinc-500 text-xs uppercase">
                                        <tr>
                                            <th className="text-left font-semibold px-3 py-2">Week of</th>
                                            <th className="text-right font-semibold px-3 py-2">New</th>
                                            <th className="text-right font-semibold px-3 py-2">+1 wk</th>
                                            <th className="text-right font-semibold px-3 py-2">+2 wk</th>
                                            <th className="text-right font-semibold px-3 py-2">+4 wk</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                        {stats.cohorts.map((c) => (
                                            <tr key={c.week_start}>
                                                <td className="px-3 py-2">
                                                    {new Date(`${c.week_start}T00:00:00Z`).toLocaleDateString(undefined, {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        timeZone: 'UTC',
                                                    })}
                                                </td>
                                                <td className="text-right px-3 py-2">{c.users}</td>
                                                <td className="text-right px-3 py-2">{pct(c.week_1_pct)}</td>
                                                <td className="text-right px-3 py-2">{pct(c.week_2_pct)}</td>
                                                <td className="text-right px-3 py-2">{pct(c.week_4_pct)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <p className="text-xs text-zinc-500 mt-6 leading-relaxed">
                            &ldquo;Returning&rdquo; only counts people whose first session was 7+ days ago. Users are
                            anonymous browser IDs, so someone who switches device or clears their browser counts as a
                            new user, which makes these numbers run low.
                        </p>
                    </>
                )}
            </div>
        </main>
    );
}
