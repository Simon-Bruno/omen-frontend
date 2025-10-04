import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    console.log('🚀 /api/projects/[projectId]/reset POST route called');

    // Forward cookies for authentication
    const cookie = request.headers.get('cookie');
    if (!cookie) {
      console.log('❌ No cookies found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ Cookies found for authentication');

    const { projectId } = await params;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Call the backend project reset API
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/api/project/${projectId}/reset`, {
      method: 'POST',
      headers: {
        'Cookie': cookie,
      },
      credentials: 'include',
    });

    console.log('📡 Backend project reset response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Backend project reset error:', errorData);
      return NextResponse.json({ error: 'Failed to reset project' }, { status: response.status });
    }

    const data = await response.json();
    console.log('✅ Project reset successfully:', data);

    return NextResponse.json(data);
  } catch (error) {
    console.error('💥 Error resetting project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    console.log('🚀 /api/projects/[projectId]/reset/status GET route called');

    // Forward cookies for authentication
    const cookie = request.headers.get('cookie');
    if (!cookie) {
      console.log('❌ No cookies found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ Cookies found for authentication');

    const { projectId } = await params;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Call the backend project reset status API
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/api/project/${projectId}/reset/status`, {
      method: 'GET',
      headers: {
        'Cookie': cookie,
      },
      credentials: 'include',
    });

    console.log('📡 Backend project reset status response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Backend project reset status error:', errorData);
      return NextResponse.json({ error: 'Failed to get reset status' }, { status: response.status });
    }

    const data = await response.json();
    console.log('✅ Project reset status retrieved:', data);

    return NextResponse.json(data);
  } catch (error) {
    console.error('💥 Error getting project reset status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}