import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
    try {
        console.log('📝 Proxying get-session request to backend');

        // Forward cookies and headers
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        // Forward cookies (Better Auth uses cookie-based authentication)
        const cookie = request.headers.get('cookie');
        if (cookie) {
            headers['Cookie'] = cookie;
            console.log('Forwarding cookies to backend:', cookie);
        }

        const response = await fetch(`${BACKEND_URL}/api/auth/get-session`, {
            method: 'GET',
            headers,
        });

        console.log('Backend response status:', response.status);
        console.log('Backend response headers:', Object.fromEntries(response.headers.entries()));

        // Log the raw response text first
        const rawResponse = await response.text();
        console.log('Raw backend response:', rawResponse);

        // Parse the JSON
        const data = rawResponse ? JSON.parse(rawResponse) : null;
        console.log('Backend session response data:', JSON.stringify(data, null, 2));

        if (!response.ok) {
            console.error('Backend error:', data);
            return NextResponse.json(data, { status: response.status });
        }

        // Handle null response (no session)
        if (!data) {
            console.log('No session data from backend - user not authenticated');
            return NextResponse.json({ user: null, session: null });
        }

        console.log('✅ Get-session successful');
        return NextResponse.json(data);
    } catch (error) {
        console.error('💥 Get-session proxy error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
