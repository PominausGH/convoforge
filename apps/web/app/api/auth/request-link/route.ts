import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const res = await fetch(`${BACKEND_URL}/api/auth/request-link`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                // Per-person rate limit on the backend needs the real client IP.
                'x-forwarded-for': request.headers.get('x-forwarded-for') ?? '',
            },
            body: JSON.stringify(body),
        })
        if (res.status === 204) return new NextResponse(null, { status: 204 })
        const data = await res.json().catch(() => ({}))
        return NextResponse.json(data, { status: res.status })
    } catch (err) {
        console.error('request-link proxy:', err)
        return NextResponse.json({ detail: 'Sign-in is unavailable right now.' }, { status: 502 })
    }
}
