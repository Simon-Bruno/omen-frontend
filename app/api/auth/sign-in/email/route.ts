import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    console.log('📝 Proxying sign-in request to backend');

    const body = await request.json();
    console.log('Request body:', { email: body.email, hasPassword: !!body.password });

    const response = await fetch(`${BACKEND_URL}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      credentials: 'include', // Include cookies in the request
    });

    console.log('Backend response status:', response.status);
    console.log('Backend response headers:', Object.fromEntries(response.headers.entries()));

    // Log the raw response text first
    const rawResponse = await response.text();
    console.log('Raw backend sign-in response:', rawResponse);

    // Parse the JSON
    const data = rawResponse ? JSON.parse(rawResponse) : null;
    console.log('Backend sign-in response data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('Backend error:', data);
      return NextResponse.json(data, { status: response.status });
    }

    console.log('✅ Sign-in successful');
    
    // Forward any cookies from the backend
    const responseHeaders = new Headers();
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      responseHeaders.set('set-cookie', setCookieHeader);
      console.log('Forwarding cookies from backend:', setCookieHeader);
    }
    
    return NextResponse.json(data, { headers: responseHeaders });
  } catch (error) {
    console.error('💥 Sign-in proxy error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
