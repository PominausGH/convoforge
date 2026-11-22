import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const res = await fetch(`${BACKEND_URL}/api/auth/verify`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(body),
            cache: 'no-store',
        })
        const data = await res.json().catch(() => ({}))
        return NextResponse.json(data, { status: res.status, headers: { 'Cache-Control': 'no-store' } })
    } catch (err) {
        console.error('verify proxy:', err)
        return NextResponse.json({ detail: 'Sign-in is unavailable right now.' }, { status: 502 })
    }
}
