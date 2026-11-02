import type { Metadata } from 'next'
import TesterRedeem from '@/components/TesterRedeem'

export const metadata: Metadata = {
    title: 'Tester access',
    robots: { index: false, follow: false },
}

export default function TestersPage() {
    return (
        <main className="mx-auto max-w-md px-6 py-20">
            <h1 className="text-2xl font-semibold mb-2">ConvoForge tester access</h1>
            <p className="text-sm text-slate-600 mb-6">
                Thanks for helping shape ConvoForge. Enter your code for free Pro access — all
                lessons, unlimited sessions. In return: tell us what&apos;s confusing, boring or broken.
            </p>
            <TesterRedeem />
        </main>
    )
}
