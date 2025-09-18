import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

export async function POST(request: Request) {
  try {
    console.log('🚀 /api/brand-summary POST route called');
    
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
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
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
