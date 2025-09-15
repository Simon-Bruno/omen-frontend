import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

export async function POST(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  try {
    console.log('🚀 /api/chat/sessions/[sessionId]/messages POST route called');
    
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
    const body = await request.json();

    // Call the backend chat API
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/api/chat/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('📡 Backend send message response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Backend send message error:', errorData);
      return NextResponse.json({ error: 'Failed to send message' }, { status: response.status });
    }

    const data = await response.json();
    console.log('✅ Message sent successfully:', JSON.stringify(data, null, 2));

    return NextResponse.json(data);
  } catch (error) {
    console.error('💥 Error sending message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  try {
    console.log('🚀 /api/chat/sessions/[sessionId]/messages GET route called');
    
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
    const url = new URL(request.url);
    const limit = url.searchParams.get('limit') || '50';

    // Call the backend chat API
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/api/chat/sessions/${sessionId}/messages?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    console.log('📡 Backend get messages response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Backend get messages error:', errorData);
      return NextResponse.json({ error: 'Failed to get messages' }, { status: response.status });
    }

    const data = await response.json();
    console.log('✅ Messages retrieved successfully:', data);

    return NextResponse.json(data);
  } catch (error) {
    console.error('💥 Error getting messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
