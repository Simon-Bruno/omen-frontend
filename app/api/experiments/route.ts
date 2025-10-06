import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Zod schema for manual experiment creation based on the docs
const variantSchema = z.object({
  variantId: z.string().min(1, 'Variant ID is required'),
  selector: z.string().optional().default('body'),
  html: z.string().optional().default(''),
  css: z.string().optional(),
  js: z.string().optional(),
  position: z.enum(['INNER', 'OUTER', 'BEFORE', 'AFTER', 'APPEND', 'PREPEND']).optional().default('INNER'),
});

const hypothesisSchema = z.object({
  hypothesis: z.string().min(1, 'Hypothesis is required'),
  rationale: z.string().min(1, 'Rationale is required'),
  primaryKpi: z.string().min(1, 'Primary KPI is required'),
});

const createExperimentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  oec: z.string().min(1, 'OEC is required'),
  minDays: z.number().min(1).optional().default(7),
  minSessionsPerVariant: z.number().min(1).optional().default(1000),
  targetUrls: z.array(z.string()).optional(),
  hypothesis: hypothesisSchema,
  variants: z.array(variantSchema).min(1, 'At least one variant is required'),
  trafficDistribution: z.record(z.string(), z.number().min(0).max(1)).optional(),
});

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 /api/experiments route called');

    // Call the backend experiments endpoint
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/api/experiments`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '', // Forward cookies for authentication
      },
    });

    console.log('📡 Backend experiments response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Backend experiments error:', errorData);
      return NextResponse.json({ error: 'Failed to fetch experiments' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('💥 Error fetching experiments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 POST /api/experiments route called');

    // Parse and validate request body
    const body = await request.json();

    let validatedData;
    try {
      validatedData = createExperimentSchema.parse(body);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: validationError.issues,
          },
          { status: 400 }
        );
      }
      throw validationError;
    }

    // Call the backend experiments endpoint
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/api/experiments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '', // Forward cookies for authentication
      },
      body: JSON.stringify(validatedData),
    });

    console.log('📡 Backend create experiment response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Backend create experiment error:', errorData);
      return NextResponse.json(
        errorData,
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('💥 Error creating experiment:', error);
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: 'Failed to create experiment',
      },
      { status: 500 }
    );
  }
}
