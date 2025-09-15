import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

export async function GET(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    console.log('🚀 /api/projects/[projectId]/chat/sessions/active route called');
    
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

    const { projectId } = params;

    // Call the backend chat API
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/api/projects/${projectId}/chat/sessions/active`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    console.log('📡 Backend active session response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Backend active session error:', errorData);
      return NextResponse.json({ error: 'Failed to get active session' }, { status: response.status });
    }

    const data = await response.json();
    console.log('✅ Active session retrieved successfully:', data);

    return NextResponse.json(data);
  } catch (error) {
    console.error('💥 Error getting active session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
