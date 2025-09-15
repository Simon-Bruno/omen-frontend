import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

export async function DELETE(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  try {
    console.log('🚀 /api/chat/sessions/[sessionId] DELETE route called');
    
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

    const { sessionId } = params;

    // Call the backend chat API
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/api/chat/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    console.log('📡 Backend close session response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Backend close session error:', errorData);
      return NextResponse.json({ error: 'Failed to close session' }, { status: response.status });
    }

    console.log('✅ Session closed successfully');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('💥 Error closing session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
