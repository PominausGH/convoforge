import Link from 'next/link'
import type { Metadata } from 'next'
import { getAllPosts, formatDate } from '@/lib/blog'
import ThemeToggle from '@/components/ThemeToggle'

// Re-render the index every hour so scheduled posts appear automatically.
export const revalidate = 3600

export const metadata: Metadata = {
    title: 'Blog — communication tactics that actually work',
    description:
        'Short, practical essays on confidence, pacing, feedback, and the craft of saying what you mean. New article every week.',
    alternates: { canonical: '/blog' },
    openGraph: {
        title: 'ConvoForge Blog',
        description:
            'Short, practical essays on confidence, pacing, feedback, and the craft of saying what you mean.',
        url: '/blog',
        images: [{ url: '/opengraph-image', width: 1200, height: 630 }],
    },
}

export default async function BlogIndex() {
    const posts = await getAllPosts()
    const tags = Array.from(new Set(posts.map((p) => p.frontmatter.tag)))

    return (
        <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
            <nav className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
                <Link href="/" className="font-black tracking-tight">
                    ← ConvoForge
                </Link>
                <div className="flex items-center gap-4">
                    <ThemeToggle />
                    <Link
                        href="/forge"
                        className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-full text-sm font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200"
                    >
                        Open app
                    </Link>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-6 py-12 md:py-20">
                <div className="mb-16">
                    <div className="text-[11px] uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400 font-bold mb-4">
                        ConvoForge Blog
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.05] max-w-2xl">
                        Short, practical essays on{' '}
                        <span className="text-rose-500">saying what you mean.</span>
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-300 text-lg mt-6 max-w-xl">
                        One new article every week on confidence, pacing, feedback,
                        and the craft of modern communication.
                    </p>
                </div>

                {tags.length > 1 && (
                    <div className="flex flex-wrap gap-2 mb-10">
                        {tags.map((tag) => (
                            <span
                                key={tag}
                                className="text-xs font-semibold px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                {posts.length === 0 ? (
                    <p className="text-zinc-500 dark:text-zinc-400">
                        No posts yet. Check back soon.
                    </p>
                ) : (
                    <ul className="space-y-4">
                        {posts.map((p) => (
                            <li key={p.slug}>
                                <Link
                                    href={`/blog/${p.slug}`}
                                    className="block group p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
                                >
                                    <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                                        <span className="font-semibold uppercase tracking-wider">
                                            {p.frontmatter.tag}
                                        </span>
                                        <span>·</span>
                                        <span>{formatDate(p.frontmatter.date)}</span>
                                        <span>·</span>
                                        <span>{p.reading_minutes} min read</span>
                                    </div>
                                    <h2 className="text-xl md:text-2xl font-black tracking-tight mb-2 group-hover:text-rose-500 transition-colors">
                                        {p.frontmatter.title}
                                    </h2>
                                    <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                                        {p.frontmatter.description}
                                    </p>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </main>

            <footer className="max-w-4xl mx-auto px-6 py-12 text-sm text-zinc-500 dark:text-zinc-400">
                <div className="flex flex-wrap gap-6 pb-6 border-b border-zinc-200 dark:border-zinc-800">
                    <Link href="/" className="hover:text-zinc-900 dark:hover:text-zinc-100">Home</Link>
                    <Link href="/forge" className="hover:text-zinc-900 dark:hover:text-zinc-100">Open app</Link>
                    <Link href="/about" className="hover:text-zinc-900 dark:hover:text-zinc-100">About</Link>
                    <Link href="/privacy" className="hover:text-zinc-900 dark:hover:text-zinc-100">Privacy</Link>
                    <Link href="/terms" className="hover:text-zinc-900 dark:hover:text-zinc-100">Terms</Link>
                    <a href="/blog/rss.xml" className="hover:text-zinc-900 dark:hover:text-zinc-100">RSS</a>
                </div>
                <div className="pt-6 text-xs">
                    © {new Date().getFullYear()} ConvoForge · ABN <span className="font-mono">65 366 917 788</span> · Built in Australia.
                </div>
            </footer>
        </div>
    )
}
