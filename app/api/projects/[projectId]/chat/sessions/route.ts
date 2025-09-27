import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    console.log('🚀 /api/projects/[projectId]/chat/sessions POST route called');
    
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

    const { projectId } = await params;

    // Call the backend chat API
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/api/projects/${projectId}/chat/sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}), // Send empty object to satisfy backend validation
    });

    console.log('📡 Backend create session response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Backend create session error:', errorData);
      return NextResponse.json({ error: 'Failed to create chat session' }, { status: response.status });
    }

    const data = await response.json();
    console.log('✅ Chat session created successfully:', data);

    return NextResponse.json(data);
  } catch (error) {
    console.error('💥 Error creating chat session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
