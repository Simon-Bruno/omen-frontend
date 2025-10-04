import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 /api/brand-summary POST route called');
    
    // Forward cookies for authentication
    const cookie = request.headers.get('cookie');
    if (!cookie) {
      console.log('❌ No cookies found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ Cookies found for authentication');

    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Call the backend brand summary API
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/api/project/${projectId}/brand-summary`, {
      method: 'POST',
      headers: {
        'Cookie': cookie,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ projectId }),
    });

    console.log('📡 Backend brand summary response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Backend brand summary error:', errorData);
      return NextResponse.json({ error: 'Failed to start brand summary generation' }, { status: response.status });
    }

    const data = await response.json();
    console.log('✅ Brand summary started successfully:', data);

    return NextResponse.json(data);
  } catch (error) {
    console.error('💥 Error starting brand summary:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
