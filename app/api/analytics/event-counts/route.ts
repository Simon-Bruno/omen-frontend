import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const experimentId = searchParams.get('experimentId');
    
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const analyticsUrl = new URL(`${backendUrl}/api/analytics/event-counts`);
    
    if (experimentId) {
      analyticsUrl.searchParams.append('experimentId', experimentId);
    }

    const response = await fetch(analyticsUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Backend analytics/event-counts error:', errorData);
      return NextResponse.json(
        { error: 'Failed to fetch event counts' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('💥 Error fetching event counts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}