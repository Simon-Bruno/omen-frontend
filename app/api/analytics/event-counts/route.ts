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

    // Get experimentId from query params (optional)
    const { searchParams } = new URL(request.url);
    const experimentId = searchParams.get('experimentId');

    // Build the backend URL
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    let analyticsUrl = `${backendUrl}/analytics/event-counts`;

    if (experimentId) {
      analyticsUrl += `?experimentId=${experimentId}`;
    }

    // Get auth token from cookies
    const cookieHeader = request.headers.get('cookie');

    // Forward the request to the backend
    const response = await fetch(analyticsUrl, {
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

    // Ensure the response includes projectId if not present
    const responseData = {
      projectId: data.projectId || projectId,
      experiments: data.experiments || []
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error in event-counts API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}