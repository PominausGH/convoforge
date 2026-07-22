'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('[convoforge] unhandled error', error)
    }, [error])

    return (
        <main className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col items-center justify-center p-8 text-center space-y-6">
            <div className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-bold">
                Something broke
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                That wasn&apos;t supposed to happen.
            </h1>
            <p className="text-zinc-600 dark:text-zinc-300 max-w-md">
                We logged the error. Try again, or head home and start a fresh
                session.
            </p>
            {error.digest && (
                <code className="text-xs text-zinc-400 font-mono">
                    ref: {error.digest}
                </code>
            )}
            <div className="flex gap-3">
                <button
                    onClick={reset}
                    className="bg-black text-white px-6 py-3 rounded-full font-semibold active:scale-95 transition-transform"
                >
                    Try again
                </button>
                <Link
                    href="/"
                    className="border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 px-6 py-3 rounded-full font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-900"
                >
                    Back to home
                </Link>
            </div>
        </main>
    )
}
