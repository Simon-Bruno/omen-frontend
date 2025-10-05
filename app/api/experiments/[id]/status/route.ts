import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const statusUpdateSchema = z.object({
  action: z.enum(['start', 'pause', 'resume', 'complete']),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🚀 PATCH /api/experiments/:id/status route called', { id: params.id });

    // Parse and validate request body
    const body = await request.json();
    let validatedData;
    
    try {
      validatedData = statusUpdateSchema.parse(body);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: 'VALIDATION_ERROR',
            message: 'Invalid action. Must be one of: start, pause, resume, complete',
            details: validationError.issues,
          },
          { status: 400 }
        );
      }
      throw validationError;
    }

    // Call the backend status update endpoint
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/api/experiments/${params.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '', // Forward cookies for authentication
      },
      body: JSON.stringify(validatedData),
    });

    console.log('📡 Backend status update response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Backend status update error:', errorData);
      return NextResponse.json(
        errorData,
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('💥 Error updating experiment status:', error);
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: 'Failed to update experiment status',
      },
      { status: 500 }
    );
  }
}
