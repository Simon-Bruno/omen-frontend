import { NextRequest, NextResponse } from 'next/server';

// Mock data - in production, this would connect to your actual backend
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, shop, password } = body;

    console.log('📝 Registration request received:', {
      email,
      shop,
      hasPassword: !!password,
      timestamp: new Date().toISOString()
    });

    // Validate required fields
    if (!email || !shop) {
      console.log('❌ Validation failed: Missing required fields');
      return NextResponse.json(
        { message: 'Email and shop are required' },
        { status: 400 }
      );
    }

    // Normalize shop domain
    let normalizedShop = shop.trim();
    if (!normalizedShop.includes('.')) {
      normalizedShop = `${normalizedShop}.myshopify.com`;
    }

    // Validate shop format
    if (!normalizedShop.endsWith('.myshopify.com')) {
      console.log('❌ Validation failed: Invalid shop domain format:', normalizedShop);
      return NextResponse.json(
        { message: 'Invalid shop domain format' },
        { status: 400 }
      );
    }

    console.log('🔄 Calling backend registration endpoint:', {
      url: `${BACKEND_URL}/api/register`,
      normalizedShop,
      email
    });

    // Call backend registration endpoint
    const response = await fetch(`${BACKEND_URL}/api/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        shop: normalizedShop,
        password: password || undefined,
      }),
    });

    console.log('📡 Backend response received:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    });

    const data = await response.json();
    console.log('📄 Backend response data:', data);

    if (!response.ok) {
      console.log('❌ Backend returned error:', {
        status: response.status,
        message: data.message,
        error: data.error
      });
      return NextResponse.json(
        { message: data.message || 'Registration failed' },
        { status: response.status }
      );
    }

    console.log('✅ Registration successful:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('💥 Registration error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}