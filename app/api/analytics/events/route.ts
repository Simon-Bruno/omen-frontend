import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the current user and project
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        projects: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user || !user.projects[0]) {
      return NextResponse.json({ error: 'No project found' }, { status: 404 });
    }

    const projectId = user.projects[0].id;

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const experimentId = searchParams.get('experimentId');
    const sessionId = searchParams.get('sessionId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = searchParams.get('limit') || '100';
    const offset = searchParams.get('offset') || '0';

    // Build the backend URL
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const analyticsUrl = new URL(`${backendUrl}/analytics/events`);

    // Add query parameters if provided
    if (experimentId) analyticsUrl.searchParams.append('experimentId', experimentId);
    if (sessionId) analyticsUrl.searchParams.append('sessionId', sessionId);
    if (startDate) analyticsUrl.searchParams.append('startDate', startDate);
    if (endDate) analyticsUrl.searchParams.append('endDate', endDate);
    analyticsUrl.searchParams.append('limit', limit);
    analyticsUrl.searchParams.append('offset', offset);

    // Get auth token from cookies
    const cookieHeader = request.headers.get('cookie');

    // Forward the request to the backend
    const response = await fetch(analyticsUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.user.email}`,
        'Cookie': cookieHeader || '',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error:', errorText);
      return NextResponse.json(
        { error: `Backend error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in events API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}