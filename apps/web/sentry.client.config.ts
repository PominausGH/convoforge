import * as Sentry from '@sentry/nextjs'

const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN

if (DSN) {
    Sentry.init({
        dsn: DSN,
        tracesSampleRate: 0.1,
        // GlitchTip supports error reporting but not replay/profiling — keep the bundle small.
        integrations: [],
        ignoreErrors: [
            'ResizeObserver loop completed with undelivered notifications',
            'ResizeObserver loop limit exceeded',
            'Non-Error promise rejection captured',
            // MediaPipe sometimes throws when the user denies the camera mid-session.
            'NotAllowedError',
        ],
        beforeSend(event) {
            // Tag every event with the anonymous UUID so we can filter per-user.
            try {
                const uid =
                    typeof window !== 'undefined'
                        ? window.localStorage.getItem('cf_user_id')
                        : null
                if (uid) {
                    event.user = { ...(event.user ?? {}), id: uid }
                }
            } catch {
                /* storage unavailable */
            }
            return event
        },
    })
}
