import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const res = await fetch(`${BACKEND_URL}/api/friends/suggest`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Pass the client IP through so the backend's daily cap is per person, not per proxy.
                'X-Forwarded-For': request.headers.get('x-forwarded-for') ?? '',
            },
            body: JSON.stringify(body),
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error('Friends suggest proxy error:', error);
        return NextResponse.json({ detail: 'Suggestions are unavailable right now.' }, { status: 502 });
    }
}
