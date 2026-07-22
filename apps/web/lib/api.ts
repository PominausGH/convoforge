export type UserProfile = {
  user_id: string
  tier: 'free' | 'pro'
  streak_days: number
  last_session_at: string | null
  persona_id: string
  weekly_session_count: number
  weekly_session_limit: number | null
  completed_module_ids: number[]
}

export type SessionCreateResponse = {
  id: string
  forge_score: number
  streak_days: number
  created_at: string
}

export async function fetchUserProfile(userId: string): Promise<UserProfile> {
  const res = await fetch(`/api/users/${userId}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Failed to load profile (${res.status})`)
  return res.json()
}

export async function captureEmail(
  userId: string,
  email: string,
  optIn = true,
): Promise<void> {
  const res = await fetch(`/api/users/${userId}/email`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, opt_in: optIn }),
  })
  if (!res.ok && res.status !== 204) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data?.detail || `Email capture failed (${res.status})`)
  }
}

/**
 * Idempotent — safe to call on every first visit. Backend 201s on first
 * create and 201s again (with existing row) on subsequent calls.
 */
export async function ensureUser(userId: string): Promise<UserProfile> {
  const res = await fetch(`/api/users/${userId}`, {
    method: 'POST',
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Failed to register user (${res.status})`)
  return res.json()
}

export type FeedbackResponse = {
  verbal: {
    filler_count?: number
    filler_rate?: number
    wpm?: number
    hedging_count?: number
    conciseness_score?: number
    word_count?: number
  }
  visual: {
    eye_contact_pct?: number
    smile_frequency?: number
    posture?: string
  }
  carnegie: Record<string, unknown>
  overall_forge_score: number
  top_insight: string
  next_session_focus: string
}

export async function analyzeSession(payload: {
  user_id: string
  module_id: number
  transcript: string
  visual: Record<string, unknown>
  duration_seconds: number
  tier: 'free' | 'pro'
}): Promise<FeedbackResponse> {
  const res = await fetch('/api/analyze-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.detail || `Analyze failed (${res.status})`)
  return data
}

export async function createSession(payload: {
  user_id: string
  module_id: number
  forge_score: number
  verbal_json?: unknown
  visual_json?: unknown
  carnegie_json?: unknown
}): Promise<SessionCreateResponse> {
  const res = await fetch('/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) {
    const detail = typeof data?.detail === 'string' ? data.detail : 'Session save failed'
    throw new Error(detail)
  }
  return data
}
