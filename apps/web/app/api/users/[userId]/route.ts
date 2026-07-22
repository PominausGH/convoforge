import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function GET(
    _request: Request,
    { params }: { params: { userId: string } }
) {
    try {
        const res = await fetch(`${BACKEND_URL}/api/users/${params.userId}`, {
            cache: 'no-store',
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error('User proxy error:', error);
        return NextResponse.json({ error: 'User proxy failure' }, { status: 502 });
    }
}

export async function POST(
    _request: Request,
    { params }: { params: { userId: string } }
) {
    try {
        const res = await fetch(`${BACKEND_URL}/api/users/${params.userId}`, {
            method: 'POST',
            cache: 'no-store',
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error('User proxy error:', error);
        return NextResponse.json({ error: 'User proxy failure' }, { status: 502 });
    }
}
