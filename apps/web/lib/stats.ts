export type PublicStats = {
    total_sessions: number
    sessions_last_30d: number
    total_users: number
    avg_forge_score: number
}

/**
 * Fetches aggregate counts for the landing page. Called from Server
 * Components, cached for 10 minutes. Returns null when the backend is
 * unreachable — callers should render a fallback.
 */
export async function fetchPublicStats(): Promise<PublicStats | null> {
    const backend = process.env.BACKEND_URL || 'http://localhost:8000'
    try {
        const res = await fetch(`${backend}/api/stats/public`, {
            next: { revalidate: 600 },
        })
        if (!res.ok) return null
        return (await res.json()) as PublicStats
    } catch {
        return null
    }
}
