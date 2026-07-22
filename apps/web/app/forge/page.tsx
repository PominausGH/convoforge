'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { initiateProPayment } from '@/lib/stripe'
import { ensureUser, type UserProfile } from '@/lib/api'
import { curriculum, nextLessonFor, totalLessonsFor, type Lesson } from '@/lib/curriculum'
import { trackEvent, ANALYTICS_EVENTS } from '@/lib/analytics'
import ThemeToggle from '@/components/ThemeToggle'

export default function AppDashboard() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)

  useEffect(() => {
    let id = localStorage.getItem('cf_user_id')
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem('cf_user_id', id)
      trackEvent(ANALYTICS_EVENTS.signup)
    }
    setUserId(id)
  }, [])

  useEffect(() => {
    if (!userId) return
    ensureUser(userId)
      .then(setProfile)
      .catch((err) => setProfileError(err.message))
  }, [userId])

  const limitReached =
    profile?.weekly_session_limit != null &&
    profile.weekly_session_count >= profile.weekly_session_limit

  const STREAK_WINDOW_MS = 36 * 60 * 60 * 1000
  const effectiveStreak = profile
    ? profile.last_session_at && Date.now() - new Date(profile.last_session_at).getTime() <= STREAK_WINDOW_MS
      ? profile.streak_days
      : 0
    : 0

  const LOCKED_PREVIEW = curriculum.filter((l) => l.tier_required === 'pro').slice(4, 8)

  const handleUpgrade = async () => {
    if (!userId) return
    trackEvent(ANALYTICS_EVENTS.upgradeClick, {
      limit_reached: limitReached ?? false,
    })
    await initiateProPayment(userId)
  }

  const nextLesson: Lesson | null = profile
    ? nextLessonFor(profile.completed_module_ids, profile.tier)
    : null
  const totalLessons = profile ? totalLessonsFor(profile.tier) : 0
  const completedCount = profile
    ? profile.completed_module_ids.filter(
        (id) => id <= totalLessons || profile.tier === 'pro',
      ).length
    : 0

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-8 pt-8 space-y-6">
      <div className="w-full max-w-md flex items-center justify-between">
        <Link
          href="/"
          className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400 font-bold hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          ← ConvoForge
        </Link>
        <ThemeToggle />
      </div>

      <h1 className="text-3xl md:text-4xl font-black text-center tracking-tight">
        Your Forge
      </h1>
      <p className="text-zinc-600 dark:text-zinc-300 text-center max-w-md">
        Five minutes. One Carnegie principle. One real practice.
      </p>

      {userId && (
        <div className="flex flex-col items-center space-y-4 w-full max-w-md">
          {profile && (
            <div className="grid grid-cols-3 gap-3 w-full">
              <Stat label="Tier" value={profile.tier.toUpperCase()} />
              <Stat label="Streak" value={effectiveStreak > 0 ? `${effectiveStreak}d` : '–'} />
              <Stat
                label="This week"
                value={
                  profile.weekly_session_limit
                    ? `${profile.weekly_session_count}/${profile.weekly_session_limit}`
                    : `${profile.weekly_session_count}`
                }
              />
            </div>
          )}

          {!profile && !profileError && (
            <div className="w-full space-y-3" aria-live="polite">
              <div className="h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl animate-pulse" />
              <div className="h-20 bg-zinc-100 dark:bg-zinc-800 rounded-2xl animate-pulse" />
            </div>
          )}

          {profile && completedCount === 0 && (
            <div className="w-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2">Your first session takes about 5 minutes.</p>
              <ul className="text-xs text-amber-800 dark:text-amber-200 space-y-1">
                <li>📖 60-second Carnegie lesson from an AI avatar</li>
                <li>🎙 90-second practice — you speak, we listen</li>
                <li>📊 Forge Score: verbal, visual, and clarity feedback</li>
              </ul>
              <p className="text-xs mt-2 text-amber-700 dark:text-amber-300">Camera + microphone required. Nothing leaves your device.</p>
            </div>
          )}

          {profile && nextLesson && (
            <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400 font-semibold">
                  Next lesson
                </span>
                <span className="text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400 font-semibold">
                  {completedCount}/{totalLessons} done
                </span>
              </div>
              <div className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                #{nextLesson.lesson_id} — {nextLesson.title}
              </div>
              <div className="text-xs text-zinc-600 dark:text-zinc-300 mt-1 line-clamp-2">
                {nextLesson.modern_context}
              </div>
            </div>
          )}

          {profileError && (
            <div className="text-xs text-red-600 dark:text-red-400" role="alert">
              Profile unavailable: {profileError}
            </div>
          )}

          {limitReached && profile?.tier !== 'pro' ? (
            <div className="w-full bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border border-blue-200 dark:border-blue-800 rounded-2xl p-5 space-y-3">
              <div className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                You've used all 3 free sessions this week
              </div>
              <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                <li>✓ Unlimited sessions</li>
                <li>✓ All 30 Carnegie modules</li>
                <li>✓ Visual + sincerity scoring</li>
              </ul>
              <button
                onClick={handleUpgrade}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-semibold shadow active:scale-95 transition-transform"
              >
                Upgrade to Pro
              </button>
              <p className="text-[10px] text-blue-600 dark:text-blue-400 text-center">
                Or come back next week for 3 more free sessions
              </p>
            </div>
          ) : (
            <>
              <button
                onClick={() => {
                  const lessonId = nextLesson?.lesson_id ?? 1
                  trackEvent(ANALYTICS_EVENTS.lessonStart, {
                    lesson_id: lessonId,
                    tier: profile?.tier ?? 'free',
                  })
                  router.push(`/session?lesson=${lessonId}`)
                }}
                disabled={!nextLesson}
                className="bg-black dark:bg-white text-white dark:text-black px-8 py-3 rounded-full font-semibold shadow-lg active:scale-95 transition-transform disabled:bg-zinc-400 disabled:cursor-not-allowed"
              >
                {`Start lesson ${nextLesson?.lesson_id ?? ''}`}
              </button>

              {profile?.tier !== 'pro' && (
                <>
                  <button
                    onClick={handleUpgrade}
                    className="text-blue-600 dark:text-blue-400 font-medium hover:underline mt-2"
                  >
                    Upgrade to ConvoForge Pro
                  </button>
                  <div className="w-full mt-4">
                    <div className="text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400 font-semibold mb-2">
                      Locked — Pro only
                    </div>
                    <div className="space-y-1.5">
                      {LOCKED_PREVIEW.map((l) => (
                        <div
                          key={l.lesson_id}
                          className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl px-3 py-2"
                        >
                          <span aria-hidden>🔒</span>
                          <span>#{l.lesson_id} — {l.title}</span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={handleUpgrade}
                      className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline w-full text-center"
                    >
                      See all 148 Pro lessons →
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      <footer className="pt-10 mt-auto text-xs text-zinc-500 dark:text-zinc-400 flex flex-col items-center gap-2">
        <div className="flex gap-5">
          <Link href="/about" className="hover:text-zinc-900 dark:hover:text-zinc-100 hover:underline">
            About
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
        </div>
        <div className="text-zinc-400 dark:text-zinc-500">
          ABN <span className="font-mono">65 366 917 788</span>
        </div>
      </footer>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 text-center shadow-sm">
      <div className="text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400 font-semibold">
        {label}
      </div>
      <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{value}</div>
    </div>
  )
}
