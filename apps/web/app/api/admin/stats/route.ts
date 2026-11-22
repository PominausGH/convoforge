import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const res = await fetch(`${BACKEND_URL}/api/stats/retention`, {
            headers: { 'x-admin-token': request.headers.get('x-admin-token') ?? '' },
            cache: 'no-store',
        });
        const data = await res.json().catch(() => ({}));
        return NextResponse.json(data, { status: res.status, headers: { 'Cache-Control': 'no-store' } });
    } catch (err) {
        console.error('admin stats proxy:', err);
        return NextResponse.json({ detail: 'Stats unavailable' }, { status: 502 });
    }
}
