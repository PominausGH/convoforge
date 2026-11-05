import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'

const link = 'hover:text-zinc-900 dark:hover:text-zinc-100 hover:underline'

/**
 * The one public-site header. `anchors` adds in-page links (landing page only).
 * Not used on the app screens (/forge, /session).
 */
export default function SiteHeader({
    anchors,
}: {
    anchors?: { href: string; label: string }[]
}) {
    return (
        <nav className="w-full max-w-6xl mx-auto px-6 py-5 flex items-center justify-between gap-4">
            <Link href="/" className="font-black text-lg tracking-tight whitespace-nowrap">ConvoForge</Link>
            <div className="flex items-center gap-4 text-sm font-semibold text-zinc-600 dark:text-zinc-300 whitespace-nowrap">
                {anchors?.map((a) => (
                    <a key={a.href} href={a.href} className={`hidden md:inline ${link}`}>
                        {a.label}
                    </a>
                ))}
                <Link href="/curriculum" className={`hidden sm:inline ${link}`}>Curriculum</Link>
                <Link href="/story-lab" className={`hidden lg:inline ${link}`}>Story Lab</Link>
                <Link href="/listening-lab" className={`hidden lg:inline ${link}`}>Listening Lab</Link>
                <Link href="/blog" className={`hidden sm:inline ${link}`}>Blog</Link>
                <ThemeToggle />
                <Link href="/forge" className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-full hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors">
                    Open app
                </Link>
            </div>
        </nav>
    )
}
