import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Proxying sign-out request to backend');

    // Forward cookies for authentication
    const cookie = request.headers.get('cookie');
    if (!cookie) {
      console.log('❌ No cookies found for logout');
      return NextResponse.json({ error: 'No session to logout' }, { status: 400 });
    }

    console.log('✅ Cookies found for logout');

    const response = await fetch(`${BACKEND_URL}/api/auth/sign-out`, {
      method: 'POST',
      headers: {
        'Cookie': cookie,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}), // Send empty JSON object to satisfy Fastify
      credentials: 'include',
    });

    console.log('Backend logout response status:', response.status);

    // Clear the session cookie on the frontend
    const responseHeaders = new Headers();
    
    // Set cookie to expire immediately (logout)
    responseHeaders.set('Set-Cookie', 'better-auth.session_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax');
    
    console.log('✅ Logout successful, clearing session cookie');

    return NextResponse.json({ message: 'Logged out successfully' }, { 
      status: 200,
      headers: responseHeaders 
    });
  } catch (error) {
    console.error('💥 Logout proxy error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
