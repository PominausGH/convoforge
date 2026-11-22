import type { PauseStats } from './pauses'

export type UserProfile = {
  user_id: string
  tier: 'free' | 'pro'
  streak_days: number
  last_session_at: string | null
  persona_id: string
  weekly_session_count: number
  weekly_session_limit: number | null
  completed_module_ids: number[]
  signed_in?: boolean
  email_hint?: string | null
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
    pauses?: PauseStats | null
  }
  visual: {
    eye_contact_pct?: number
    smile_frequency?: number
    posture?: string
  }
  carnegie: Record<string, unknown> & {
    structure_score?: number
    beats_present?: string[]
    hook_quality?: number
    energy_score?: number
    pacing_score?: number
    accuracy_score?: number
    validation_score?: number
    paraphrase_quality?: number
    key_points_captured?: string[]
    key_points_missed?: string[]
    warmth_score?: number
    curiosity_score?: number
    next_step_score?: number
  }
  overall_forge_score: number
  top_insight: string
  next_session_focus: string
  rewrite_example?: string | null
}

export async function analyzeSession(payload: {
  user_id: string
  module_id: number
  transcript: string
  visual: Record<string, unknown>
  duration_seconds: number
  tier: 'free' | 'pro'
  track?: string
  stimulus?: string
  pauses?: PauseStats | null
  practice_prompt?: string
  success_criteria?: string[]
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

export type GroupSuggestion = {
  group_type: string
  why: string
  first_step: string
  search_query: string
}

export async function suggestGroups(payload: {
  user_id: string
  area: string
  interests: string[]
  life_stage: 'later_life' | 'starting_out'
}): Promise<{ suggestions: GroupSuggestion[]; encouragement?: string | null }> {
  const res = await fetch('/api/friends/suggest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(typeof data?.detail === 'string' ? data.detail : 'Suggestions failed')
  }
  return data
}

export async function requestSignInLink(email: string, userId: string | null): Promise<void> {
  const res = await fetch('/api/auth/request-link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, user_id: userId }),
  })
  if (res.status === 204) return
  const data = await res.json().catch(() => ({}))
  throw new Error(typeof data?.detail === 'string' ? data.detail : 'Could not send the email')
}

export type SignInResult = {
  user_id: string
  email: string
  tier: 'free' | 'pro'
  streak_days: number
  switched_account: boolean
  moved_sessions: number
}

export async function verifySignIn(token: string, userId: string | null): Promise<SignInResult> {
  const res = await fetch('/api/auth/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, user_id: userId }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(typeof data?.detail === 'string' ? data.detail : 'Sign-in failed')
  return data
}

export async function fetchFriendChallenges(userId: string): Promise<Record<string, { done_at: string; feeling?: string }>> {
  const res = await fetch(`/api/users/${userId}/friend-challenges`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`sync unavailable (${res.status})`)
  return res.json()
}

export async function saveFriendChallenges(
  userId: string,
  progress: Record<string, { done_at: string; feeling?: string }>,
): Promise<void> {
  await fetch(`/api/users/${userId}/friend-challenges`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(progress),
  })
}
