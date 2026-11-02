import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const res = await fetch(`${BACKEND_URL}/api/users/recover/confirm`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(body),
        })
        const data = await res.json().catch(() => ({}))
        return NextResponse.json(data, { status: res.status })
    } catch (err) {
        console.error('recover confirm proxy:', err)
        return NextResponse.json({ error: 'proxy failure' }, { status: 502 })
    }
}
