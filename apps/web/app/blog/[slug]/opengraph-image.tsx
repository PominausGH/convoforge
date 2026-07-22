import { ImageResponse } from 'next/og'
import { getPost } from '@/lib/blog'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OpengraphImage({
    params,
}: {
    params: { slug: string }
}) {
    const post = await getPost(params.slug)
    const title = post?.frontmatter.title ?? 'ConvoForge Blog'
    const tag = post?.frontmatter.tag ?? 'Communication'

    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(135deg, #000 0%, #0a0a0a 50%, #18181b 100%)',
                    color: '#fff',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    justifyContent: 'flex-end',
                    padding: 72,
                    fontFamily: 'sans-serif',
                }}
            >
                {/* Brand */}
                <div
                    style={{
                        position: 'absolute',
                        top: 64,
                        left: 72,
                        fontSize: 22,
                        fontWeight: 700,
                        letterSpacing: 4,
                        color: '#71717a',
                        textTransform: 'uppercase',
                    }}
                >
                    ConvoForge
                </div>

                {/* Tag */}
                <div
                    style={{
                        fontSize: 16,
                        fontWeight: 700,
                        letterSpacing: 3,
                        color: '#f43f5e',
                        textTransform: 'uppercase',
                        marginBottom: 20,
                    }}
                >
                    {tag}
                </div>

                {/* Title */}
                <div
                    style={{
                        fontSize: title.length > 60 ? 52 : 64,
                        fontWeight: 900,
                        lineHeight: 1.1,
                        letterSpacing: -2,
                        maxWidth: 1000,
                    }}
                >
                    {title}
                </div>

                {/* Bottom bar */}
                <div
                    style={{
                        marginTop: 40,
                        fontSize: 20,
                        color: '#71717a',
                    }}
                >
                    convoforge.app/blog
                </div>
            </div>
        ),
        { ...size },
    )
}
