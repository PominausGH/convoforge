import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export const revalidate = 600 // 10 minutes

export async function GET() {
    try {
        const res = await fetch(`${BACKEND_URL}/api/stats/public`, {
            next: { revalidate: 600 },
        })
        const data = await res.json()
        return NextResponse.json(data, { status: res.status })
    } catch (err) {
        console.error('stats proxy:', err)
        return NextResponse.json({ error: 'stats unavailable' }, { status: 502 })
    }
}
