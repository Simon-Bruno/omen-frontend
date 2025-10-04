import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        console.log('🚀 /api/session route called');
        
        // Get the authorization header
        const authHeader = request.headers.get('authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('❌ No authorization header found');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        console.log('✅ Authorization token found');

        // Call the backend /api/session endpoint
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
        const response = await fetch(`${backendUrl}/api/session`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        console.log('📡 Backend /api/session response:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            headers: Object.fromEntries(response.headers.entries())
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ Backend /api/session error:', errorData);
            return NextResponse.json({ error: 'Failed to fetch session data' }, { status: response.status });
        }

        const sessionData = await response.json();
        console.log('✅ Session data fetched successfully:', sessionData);

        return NextResponse.json(sessionData);
    } catch (error) {
        console.error('💥 Error fetching session data:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
