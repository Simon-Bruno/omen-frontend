import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

export async function GET() {
    try {
        console.log('🚀 /api/user/me route called');
        
        // Get the Auth0 session
        const session = await auth0.getSession();

        console.log('🔐 Auth0 session:', session);
        
        if (!session) {
            console.log('❌ No Auth0 session found');
            return NextResponse.json({ error: 'No session' }, { status: 401 });
        }

        // Get access token for backend API calls
        const accessToken = session.tokenSet.accessToken;
        
        if (!accessToken) {
            console.log('❌ No access token available');
            return NextResponse.json({ error: 'No access token available' }, { status: 401 });
        }

        // Call the backend /api/me endpoint
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
        const response = await fetch(`${backendUrl}/api/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        console.log('📡 Backend /api/me response:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            headers: Object.fromEntries(response.headers.entries())
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ Backend /api/me error:', errorData);
            return NextResponse.json({ error: 'Failed to fetch user data' }, { status: response.status });
        }

        const userData = await response.json();
        console.log('✅ User data fetched successfully:', userData);

        return NextResponse.json(userData);
    } catch (error) {
        console.error('💥 Error fetching user data:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
