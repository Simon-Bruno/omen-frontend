import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const experimentId = searchParams.get('experimentId');
    const sessionId = searchParams.get('sessionId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = searchParams.get('limit') || '100';
    const offset = searchParams.get('offset') || '0';

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const analyticsUrl = new URL(`${backendUrl}/api/analytics/events`);

    if (experimentId) analyticsUrl.searchParams.append('experimentId', experimentId);
    if (sessionId) analyticsUrl.searchParams.append('sessionId', sessionId);
    if (startDate) analyticsUrl.searchParams.append('startDate', startDate);
    if (endDate) analyticsUrl.searchParams.append('endDate', endDate);
    analyticsUrl.searchParams.append('limit', limit);
    analyticsUrl.searchParams.append('offset', offset);

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
      console.error('❌ Backend analytics/events error:', errorData);
      return NextResponse.json(
        { error: 'Failed to fetch events' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('💥 Error fetching events:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}