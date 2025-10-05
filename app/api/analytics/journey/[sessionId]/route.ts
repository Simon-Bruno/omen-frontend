import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    console.log('🚀 /api/analytics/journey route called with sessionId:', sessionId);
    
    // Call the backend analytics endpoint
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/api/analytics/journey/${sessionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '', // Forward cookies for authentication
      },
    });

    console.log('📡 Backend analytics/journey response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Backend analytics/journey error:', errorData);
      return NextResponse.json({ error: 'Failed to fetch journey data' }, { status: response.status });
    }

    const data = await response.json();
    console.log('✅ Journey data fetched successfully');
    console.log('🔍 Raw journey response data:', JSON.stringify(data, null, 2));
    return NextResponse.json(data);
  } catch (error) {
    console.error('💥 Error fetching journey data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

