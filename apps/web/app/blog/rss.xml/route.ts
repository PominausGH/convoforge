import { getAllPosts } from '@/lib/blog'

export const revalidate = 3600

const SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL || 'https://convoforge.app'

function xmlEscape(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
}

export async function GET() {
    const posts = await getAllPosts()
    const items = posts
        .map((p) => {
            const link = `${SITE_URL}/blog/${p.slug}`
            return `
    <item>
      <title>${xmlEscape(p.frontmatter.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${new Date(p.frontmatter.date).toUTCString()}</pubDate>
      <description>${xmlEscape(p.frontmatter.description)}</description>
      <category>${xmlEscape(p.frontmatter.tag)}</category>
    </item>`
        })
        .join('')

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>ConvoForge Blog</title>
    <link>${SITE_URL}/blog</link>
    <atom:link href="${SITE_URL}/blog/rss.xml" rel="self" type="application/rss+xml" />
    <description>Practical essays on confidence, pacing, feedback, and the craft of modern communication.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>${items}
  </channel>
</rss>`

    return new Response(xml, {
        headers: {
            'content-type': 'application/rss+xml; charset=utf-8',
            'cache-control': 'public, s-maxage=3600',
        },
    })
}
