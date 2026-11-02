import type { Metadata } from 'next'
import RestoreProgress from '@/components/RestoreProgress'

export const metadata: Metadata = {
    title: 'Restore your progress',
    robots: { index: false, follow: false },
}

export default function RestorePage() {
    return (
        <main className="mx-auto max-w-md px-6 py-20">
            <h1 className="text-2xl font-semibold mb-2">Use ConvoForge on another device</h1>
            <p className="text-sm text-slate-600 mb-8">
                Your progress lives in this browser. Link it to an email and you can pick it up
                anywhere with a one-time sign-in link — no password.
            </p>
            <RestoreProgress />
        </main>
    )
}
