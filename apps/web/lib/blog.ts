import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import matter from 'gray-matter'

const CONTENT_DIR = join(process.cwd(), 'content', 'blog')

export type PostFrontmatter = {
    title: string
    description: string
    date: string // ISO
    tag: string
    author?: string
    featured?: boolean
    related_lesson_id?: number
}

export type Post = {
    slug: string
    frontmatter: PostFrontmatter
    content: string
    reading_minutes: number
}

function estimateReadingMinutes(text: string): number {
    const words = text.trim().split(/\s+/).length
    return Math.max(1, Math.round(words / 220))
}

async function readPost(fileName: string): Promise<Post | null> {
    if (!fileName.endsWith('.mdx') && !fileName.endsWith('.md')) return null
    const slug = fileName.replace(/\.(mdx|md)$/, '')
    const raw = await readFile(join(CONTENT_DIR, fileName), 'utf8')
    const parsed = matter(raw)
    const fm = parsed.data as PostFrontmatter
    // Minimal frontmatter validation — skip malformed posts in prod rather
    // than crash the whole blog.
    if (!fm?.title || !fm?.date || !fm?.description) return null
    return {
        slug,
        frontmatter: fm,
        content: parsed.content,
        reading_minutes: estimateReadingMinutes(parsed.content),
    }
}

/**
 * Post visibility follows the frontmatter `date`. A post dated in the future
 * is treated as "scheduled" and hidden from listings + direct access. Set
 * CF_BLOG_SHOW_FUTURE=1 in the environment to bypass (useful for preview).
 */
function isPublished(p: Post, now = Date.now()): boolean {
    if (process.env.CF_BLOG_SHOW_FUTURE === '1') return true
    return new Date(p.frontmatter.date).getTime() <= now
}

export async function getAllPosts(): Promise<Post[]> {
    let files: string[] = []
    try {
        files = await readdir(CONTENT_DIR)
    } catch {
        return []
    }
    const posts = (await Promise.all(files.map(readPost))).filter(
        (p): p is Post => p !== null,
    )
    const now = Date.now()
    return posts
        .filter((p) => isPublished(p, now))
        .sort(
            (a, b) =>
                new Date(b.frontmatter.date).getTime() -
                new Date(a.frontmatter.date).getTime(),
        )
}

export async function getPost(slug: string): Promise<Post | null> {
    const posts = await getAllPosts()
    return posts.find((p) => p.slug === slug) ?? null
}

/**
 * Same-tag posts first (freshest first), then backfilled with other recent
 * posts so every post links out to others regardless of how niche its tag is.
 */
export async function getRelatedPosts(
    slug: string,
    limit = 3,
): Promise<Post[]> {
    const posts = await getAllPosts()
    const current = posts.find((p) => p.slug === slug)
    const others = posts.filter((p) => p.slug !== slug)
    if (!current) return others.slice(0, limit)

    const sameTag = others.filter((p) => p.frontmatter.tag === current.frontmatter.tag)
    const rest = others.filter((p) => p.frontmatter.tag !== current.frontmatter.tag)
    return [...sameTag, ...rest].slice(0, limit)
}

/**
 * Returns every post in the repo (scheduled included) so generateStaticParams
 * can pre-build pages for future posts. Combined with Next's ISR revalidate,
 * scheduled posts go live on their date without a rebuild.
 */
export async function getAllPostsIncludingScheduled(): Promise<Post[]> {
    let files: string[] = []
    try {
        files = await readdir(CONTENT_DIR)
    } catch {
        return []
    }
    const posts = (await Promise.all(files.map(readPost))).filter(
        (p): p is Post => p !== null,
    )
    return posts.sort(
        (a, b) =>
            new Date(b.frontmatter.date).getTime() -
            new Date(a.frontmatter.date).getTime(),
    )
}

export function formatDate(iso: string): string {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    })
}
