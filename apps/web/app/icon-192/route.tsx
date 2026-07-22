import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(135deg, #000 0%, #111 100%)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 120,
                    fontWeight: 900,
                    letterSpacing: -6,
                    borderRadius: 42,
                }}
            >
                CF
            </div>
        ),
        { width: 192, height: 192 },
    )
}
