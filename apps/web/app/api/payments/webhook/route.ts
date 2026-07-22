import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(request: Request) {
    try {
        const rawBody = await request.text();
        const response = await fetch(`${BACKEND_URL}/api/payments/webhook`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'stripe-signature': request.headers.get('stripe-signature') || '',
            },
            body: rawBody,
        });
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('Webhook proxy error:', error);
        return NextResponse.json({ error: 'Webhook proxy failure' }, { status: 502 });
    }
}
