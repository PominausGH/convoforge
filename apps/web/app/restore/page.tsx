import type { Metadata } from 'next'
import RestoreProgress from '@/components/RestoreProgress'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

export const metadata: Metadata = {
    title: 'Restore your progress',
    robots: { index: false, follow: false },
}

export default function RestorePage() {
    return (
        <div className="min-h-screen flex flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
            <SiteHeader />
            <main className="flex-1 w-full mx-auto max-w-md px-6 py-12">
                <h1 className="text-2xl font-semibold mb-2">Use ConvoForge on another device</h1>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-8">
                    Your progress lives in this browser. Link it to an email and you can pick it up
                    anywhere with a one-time sign-in link — no password.
                </p>
                <RestoreProgress />
            </main>
            <SiteFooter />
        </div>
    )
}
