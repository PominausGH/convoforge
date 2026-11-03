import type { Metadata } from 'next'
import TesterRedeem from '@/components/TesterRedeem'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

export const metadata: Metadata = {
    title: 'Tester access',
    robots: { index: false, follow: false },
}

export default function TestersPage() {
    return (
        <div className="min-h-screen flex flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
            <SiteHeader />
            <main className="flex-1 w-full mx-auto max-w-md px-6 py-12">
                <h1 className="text-2xl font-semibold mb-2">ConvoForge tester access</h1>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
                    Thanks for helping shape ConvoForge. Enter your code for free Pro access — all
                    lessons, unlimited sessions. In return: tell us what&apos;s confusing, boring or broken.
                </p>
                <TesterRedeem />
            </main>
            <SiteFooter />
        </div>
    )
}
