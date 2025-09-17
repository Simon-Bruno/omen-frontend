import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

export async function POST(request: Request) {
    try {
        const session = await auth0.getSession();
        if (!session?.tokenSet?.accessToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
        const requestBody = await request.text();

        const upstream = await fetch(`${backendUrl}/api/chat`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session.tokenSet.accessToken}`,
                // forward content-type as json since we’re sending raw text we already read:
                'Content-Type': request.headers.get('Content-Type') ?? 'application/json',
            },
            body: requestBody,
        });

        if (!upstream.ok) {
            // try to surface backend error json/text
            const errText = await upstream.text();
            return new NextResponse(errText || 'Upstream error', { status: upstream.status });
        }

        // IMPORTANT: forward the streaming body + headers that matter
        const headers = new Headers();
        // The AI SDK uses text/plain; keep it
        headers.set('Content-Type', upstream.headers.get('Content-Type') ?? 'text/plain; charset=utf-8');
        headers.set('Cache-Control', 'no-cache');
        headers.set('Connection', 'keep-alive');
        // disable buffering if your hosting/proxy supports it
        if (upstream.headers.get('X-Accel-Buffering')) {
            headers.set('X-Accel-Buffering', upstream.headers.get('X-Accel-Buffering')!);
        }

        return new Response(upstream.body, { headers, status: 200 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
