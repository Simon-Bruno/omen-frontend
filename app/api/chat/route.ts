import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        console.log('🚀 /api/chat POST route called');
        
        // Forward cookies for authentication
        const cookie = request.headers.get('cookie');
        console.log('Cookie header:', cookie ? 'Present' : 'Missing');
        
        if (!cookie) {
            console.log('❌ No cookies found for chat authentication');
            return NextResponse.json({ error: 'Unauthorized - No session cookie' }, { status: 401 });
        }

        console.log('✅ Cookies found for chat authentication');

        const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
        const requestBody = await request.text();

        console.log('📡 Calling backend chat API:', `${backendUrl}/api/chat`);
        
        const upstream = await fetch(`${backendUrl}/api/chat`, {
            method: 'POST',
            headers: {
                'Cookie': cookie,
                // forward content-type as json since we're sending raw text we already read:
                'Content-Type': request.headers.get('Content-Type') ?? 'application/json',
            },
            credentials: 'include',
            body: requestBody,
        });

        console.log('📡 Backend chat response:', {
            status: upstream.status,
            statusText: upstream.statusText,
            ok: upstream.ok,
        });

        if (!upstream.ok) {
            // try to surface backend error json/text
            const errText = await upstream.text();
            console.error('❌ Backend chat error:', errText);
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
