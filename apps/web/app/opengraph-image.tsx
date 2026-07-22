import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'ConvoForge — daily AI communication coaching'

export default function OpengraphImage() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    background:
                        'linear-gradient(135deg, #000 0%, #0a0a0a 50%, #1a1a1a 100%)',
                    color: '#fff',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                    padding: 80,
                    fontFamily: 'sans-serif',
                }}
            >
                <div
                    style={{
                        fontSize: 28,
                        fontWeight: 700,
                        letterSpacing: 6,
                        color: '#888',
                        textTransform: 'uppercase',
                        marginBottom: 24,
                    }}
                >
                    ConvoForge
                </div>
                <div
                    style={{
                        fontSize: 88,
                        fontWeight: 900,
                        lineHeight: 1.05,
                        letterSpacing: -3,
                        maxWidth: 1000,
                    }}
                >
                    Daily AI-coached
                </div>
                <div
                    style={{
                        fontSize: 88,
                        fontWeight: 900,
                        lineHeight: 1.05,
                        letterSpacing: -3,
                        color: '#f43f5e',
                    }}
                >
                    communication training.
                </div>
                <div
                    style={{
                        fontSize: 28,
                        fontWeight: 500,
                        color: '#aaa',
                        marginTop: 36,
                        maxWidth: 900,
                    }}
                >
                    Carnegie-grounded micro-lessons. Real-time voice and body
                    language feedback. 5 minutes a day.
                </div>
            </div>
        ),
        { ...size },
    )
}
