import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ jobId: string }> }
) {
    try {
        console.log('🚀 /api/brand-summary/[jobId] GET route called');

        // Await params as required by Next.js
        const { jobId } = await params;

        // Get the Auth0 session
        const session = await auth0.getSession();

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

        if (!jobId) {
            return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
        }

        // Get projectId from query parameters
        const url = new URL(request.url);
        const projectId = url.searchParams.get('projectId');

        if (!projectId) {
            return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
        }

        // Call the backend brand summary status API
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
        const response = await fetch(`${backendUrl}/api/project/${projectId}/brand-summary/${jobId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        console.log('📡 Backend brand summary status response:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ Backend brand summary status error:', errorData);
            return NextResponse.json({ error: 'Failed to get brand summary status' }, { status: response.status });
        }

        const data = await response.json();
        console.log('✅ Brand summary status retrieved successfully:', data);

        return NextResponse.json(data);
    } catch (error) {
        console.error('💥 Error getting brand summary status:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
