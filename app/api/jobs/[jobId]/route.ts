import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ jobId: string }> }
) {
    try {
        console.log('🚀 /api/jobs/[jobId] GET route called');

        // Await params as required by Next.js
        const { jobId } = await params;

        // Forward cookies for authentication
        const cookie = request.headers.get('cookie');
        if (!cookie) {
            console.log('❌ No cookies found');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('✅ Cookies found for authentication');

        if (!jobId) {
            return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
        }

        // Get projectId from query parameters
        const url = new URL(request.url);
        const projectId = url.searchParams.get('projectId');

        if (!projectId) {
            return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
        }

        // Call the backend job status API
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
        const response = await fetch(`${backendUrl}/api/project/${projectId}/jobs/${jobId}`, {
            method: 'GET',
            headers: {
                'Cookie': cookie,
            },
            credentials: 'include',
        });

        console.log('📡 Backend job status response:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ Backend job status error:', errorData);
            return NextResponse.json({ error: 'Failed to get job status' }, { status: response.status });
        }

        const data = await response.json();
        console.log('✅ Job status retrieved successfully:', data);

        return NextResponse.json(data);
    } catch (error) {
        console.error('💥 Error getting job status:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
