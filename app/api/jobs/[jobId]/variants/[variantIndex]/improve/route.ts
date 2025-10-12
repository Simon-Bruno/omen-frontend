import { NextRequest, NextResponse } from 'next/server';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ jobId: string; variantIndex: string }> }
) {
    try {
        console.log('🚀 /api/jobs/[jobId]/variants/[variantIndex]/improve POST route called');

        // Await params as required by Next.js
        const { jobId, variantIndex } = await params;

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

        if (!variantIndex) {
            return NextResponse.json({ error: 'Variant index is required' }, { status: 400 });
        }

        // Get projectId from query parameters
        const url = new URL(request.url);
        const projectId = url.searchParams.get('projectId');

        if (!projectId) {
            return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
        }

        // Get the request body (should contain feedback)
        const body = await request.json();

        // Validate feedback is provided
        if (!body.feedback || typeof body.feedback !== 'string' || body.feedback.trim() === '') {
            return NextResponse.json({ error: 'Feedback is required and must be a non-empty string' }, { status: 400 });
        }

        // Call the backend variant improvement API
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
        const response = await fetch(`${backendUrl}/api/project/${projectId}/jobs/${jobId}/variants/${variantIndex}/improve`, {
            method: 'POST',
            headers: {
                'Cookie': cookie,
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(body),
        });

        console.log('📡 Backend variant improvement response:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ Backend variant improvement error:', errorData);
            return NextResponse.json({ error: 'Failed to improve variant' }, { status: response.status });
        }

        const data = await response.json();
        console.log('✅ Variant improvement request successful:', data);

        return NextResponse.json(data);
    } catch (error) {
        console.error('💥 Error improving variant:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
