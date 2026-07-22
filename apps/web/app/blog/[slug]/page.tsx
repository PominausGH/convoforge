import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getAllPostsIncludingScheduled, getPost, getRelatedPosts, formatDate } from '@/lib/blog'
import { findLesson } from '@/lib/curriculum'
import ThemeToggle from '@/components/ThemeToggle'

// Re-check file dates every hour. Combined with the `isPublished` filter in
// lib/blog.ts, this means a post dated for a future Monday 08:00 goes live
// automatically within an hour of that timestamp — no rebuild needed.
export const revalidate = 3600

export async function generateStaticParams() {
    // Include scheduled posts so Next pre-renders them; getPost() still 404s
    // them until the date passes.
    const posts = await getAllPostsIncludingScheduled()
    return posts.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
    params,
}: {
    params: { slug: string }
}): Promise<Metadata> {
    const post = await getPost(params.slug)
    if (!post) return { title: 'Not found' }
    return {
        title: post.frontmatter.title,
        description: post.frontmatter.description,
        alternates: { canonical: `/blog/${post.slug}` },
        openGraph: {
            type: 'article',
            title: post.frontmatter.title,
            description: post.frontmatter.description,
            url: `/blog/${post.slug}`,
            publishedTime: post.frontmatter.date,
            tags: [post.frontmatter.tag],
        },
        twitter: {
            card: 'summary_large_image',
            title: post.frontmatter.title,
            description: post.frontmatter.description,
        },
    }
}

export default async function PostPage({
    params,
}: {
    params: { slug: string }
}) {
    const post = await getPost(params.slug)
    if (!post) notFound()

    const related = await getRelatedPosts(post.slug, 3)
    const lesson = post.frontmatter.related_lesson_id
        ? findLesson(post.frontmatter.related_lesson_id)
        : null

    const postUrl = `https://convoforge.app/blog/${post.slug}`
    const jsonLd = [
        {
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.frontmatter.title,
            description: post.frontmatter.description,
            datePublished: post.frontmatter.date,
            dateModified: post.frontmatter.date,
            image: `${postUrl}/opengraph-image`,
            url: postUrl,
            author: {
                '@type': 'Organization',
                name: post.frontmatter.author ?? 'ConvoForge',
                url: 'https://convoforge.app',
            },
            publisher: {
                '@type': 'Organization',
                name: 'ConvoForge',
                url: 'https://convoforge.app',
            },
            mainEntityOfPage: {
                '@type': 'WebPage',
                '@id': postUrl,
            },
            keywords: post.frontmatter.tag,
        },
        {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://convoforge.app' },
                { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://convoforge.app/blog' },
                { '@type': 'ListItem', position: 3, name: post.frontmatter.title, item: postUrl },
            ],
        },
    ]

    return (
        <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <nav className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
                <Link href="/blog" className="font-semibold text-sm text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white">
                    ← All posts
                </Link>
                <div className="flex items-center gap-3">
                    <ThemeToggle />
                    <Link
                        href="/forge"
                        className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-full text-sm font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200"
                    >
                        Open app
                    </Link>
                </div>
            </nav>

            <main className="max-w-3xl mx-auto px-6 py-10 md:py-16">
                <header className="mb-10">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                        <span className="font-bold uppercase tracking-[0.2em]">
                            {post.frontmatter.tag}
                        </span>
                        <span>·</span>
                        <span>{formatDate(post.frontmatter.date)}</span>
                        <span>·</span>
                        <span>{post.reading_minutes} min read</span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-[1.1]">
                        {post.frontmatter.title}
                    </h1>
                    <p className="text-lg text-zinc-600 dark:text-zinc-300 mt-6 leading-relaxed">
                        {post.frontmatter.description}
                    </p>
                </header>

                <article className="prose-post">
                    <MDXRemote source={post.content} />
                </article>

                {lesson && (
                    <div className="mt-16 rounded-3xl border border-rose-500/30 bg-rose-50 dark:bg-rose-950/30 p-6 md:p-8">
                        <div className="text-[10px] uppercase tracking-[0.3em] text-rose-500 font-bold mb-2">
                            Practice this in 5 minutes
                        </div>
                        <h3 className="text-xl md:text-2xl font-black mb-2">
                            {lesson.title}
                        </h3>
                        <p className="text-zinc-700 dark:text-zinc-200 mb-5">
                            {lesson.modern_context}
                        </p>
                        <Link
                            href={`/forge`}
                            className="inline-block bg-black dark:bg-white text-white dark:text-black font-bold px-6 py-3 rounded-full hover:scale-105 active:scale-95 transition-transform"
                        >
                            Open lesson #{lesson.lesson_id} →
                        </Link>
                    </div>
                )}

                {related.length > 0 && (
                    <div className="mt-16 pt-10 border-t border-zinc-200 dark:border-zinc-800">
                        <div className="text-[11px] uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400 font-bold mb-6">
                            Keep reading
                        </div>
                        <ul className="grid gap-4 sm:grid-cols-3">
                            {related.map((p) => (
                                <li key={p.slug}>
                                    <Link
                                        href={`/blog/${p.slug}`}
                                        className="block group h-full p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
                                    >
                                        <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                                            {p.frontmatter.tag}
                                        </div>
                                        <div className="font-bold leading-snug group-hover:text-rose-500 transition-colors">
                                            {p.frontmatter.title}
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="mt-10 pt-8 border-t border-zinc-200 dark:border-zinc-800 text-sm text-zinc-500 dark:text-zinc-400">
                    Published {formatDate(post.frontmatter.date)} ·{' '}
                    <Link href="/blog" className="hover:text-zinc-900 dark:hover:text-zinc-100">
                        More articles →
                    </Link>
                </div>
            </main>
        </div>
    )
}
