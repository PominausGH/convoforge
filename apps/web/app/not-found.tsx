import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Page not found',
    robots: { index: false, follow: false },
}

export default function NotFound() {
    return (
        <main className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col items-center justify-center p-8 text-center space-y-6">
            <div className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-bold">
                404
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                We couldn&apos;t find that lesson.
            </h1>
            <p className="text-zinc-600 dark:text-zinc-300 max-w-md">
                The page you&apos;re looking for has moved or was never here. Head
                back to your daily Forge Session.
            </p>
            <Link
                href="/"
                className="bg-black text-white px-8 py-3 rounded-full font-semibold shadow-lg active:scale-95 transition-transform"
            >
                Back to ConvoForge
            </Link>
            <div className="flex gap-4 text-sm text-zinc-500 dark:text-zinc-400 mt-4">
                <Link href="/about" className="hover:text-zinc-900 dark:hover:text-white hover:underline">
                    About
                </Link>
                <Link href="/privacy" className="hover:text-zinc-900 dark:hover:text-white hover:underline">
                    Privacy
                </Link>
                <Link href="/terms" className="hover:text-zinc-900 dark:hover:text-white hover:underline">
                    Terms
                </Link>
            </div>
        </main>
    )
}
