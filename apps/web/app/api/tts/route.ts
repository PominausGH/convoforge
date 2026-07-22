const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const upstream = await fetch(`${BACKEND_URL}/api/tts/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const headers = new Headers();
        const ct = upstream.headers.get('content-type');
        if (ct) headers.set('content-type', ct);
        return new Response(upstream.body, { status: upstream.status, headers });
    } catch (error) {
        console.error('TTS proxy error:', error);
        return new Response(JSON.stringify({ error: 'TTS proxy failure' }), {
            status: 502,
            headers: { 'content-type': 'application/json' },
        });
    }
}
