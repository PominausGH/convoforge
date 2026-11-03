import Link from 'next/link'

export default function SiteHeader() {
    return (
        <nav className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
            <Link href="/" className="font-black text-lg tracking-tight">ConvoForge</Link>
            <div className="flex items-center gap-4 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                <Link href="/story-lab" className="hover:text-zinc-900 dark:hover:text-zinc-100 hover:underline">
                    Story Lab
                </Link>
                <Link href="/listening-lab" className="hover:text-zinc-900 dark:hover:text-zinc-100 hover:underline">
                    Listening Lab
                </Link>
                <Link href="/forge" className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-full hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors">
                    Open app
                </Link>
            </div>
        </nav>
    )
}
