import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

async function forward(method: 'GET' | 'PUT', userId: string, body?: unknown) {
    try {
        const res = await fetch(`${BACKEND_URL}/api/users/${encodeURIComponent(userId)}/friend-challenges`, {
            method,
            headers: body ? { 'content-type': 'application/json' } : undefined,
            body: body ? JSON.stringify(body) : undefined,
            cache: 'no-store',
        })
        const data = await res.json().catch(() => ({}))
        return NextResponse.json(data, { status: res.status })
    } catch (err) {
        console.error('friend-challenges proxy:', err)
        return NextResponse.json({ detail: 'proxy failure' }, { status: 502 })
    }
}

export async function GET(_req: Request, { params }: { params: { userId: string } }) {
    return forward('GET', params.userId)
}

export async function PUT(req: Request, { params }: { params: { userId: string } }) {
    return forward('PUT', params.userId, await req.json())
}
