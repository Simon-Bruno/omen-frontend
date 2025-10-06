import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ experimentId: string }> }
) {
  try {
    const { experimentId } = await params;
    console.log('🚀 /api/analytics/purchases route called with experimentId:', experimentId);
    
    // Call the backend analytics purchases endpoint
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/api/analytics/purchases/${experimentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '', // Forward cookies for authentication
      },
    });

    console.log('📡 Backend analytics/purchases response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Backend analytics/purchases error:', errorData);
      return NextResponse.json({ error: 'Failed to fetch purchase data' }, { status: response.status });
    }

    const data = await response.json();
    console.log('✅ Purchase data fetched successfully');
    return NextResponse.json(data);
  } catch (error) {
    console.error('💥 Error fetching purchase data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
