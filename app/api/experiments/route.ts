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

const domTargetingRule = z.discriminatedUnion('type', [
  z.object({ type: z.literal('selectorExists'), selector: z.string().min(1) }),
  z.object({ type: z.literal('selectorNotExists'), selector: z.string().min(1) }),
  z.object({ type: z.literal('textContains'), selector: z.string().min(1), text: z.string().min(1) }),
  z.object({ type: z.literal('attrEquals'), selector: z.string().min(1), attr: z.string().min(1), value: z.string() }),
  z.object({ type: z.literal('meta'), name: z.string().min(1), value: z.string(), by: z.enum(['name', 'property']).optional() }),
  z.object({ type: z.literal('cookie'), name: z.string().min(1), value: z.string() }),
  z.object({ type: z.literal('localStorage'), key: z.string().min(1), value: z.string() }),
  z.object({ type: z.literal('urlParam'), name: z.string().min(1), value: z.string() })
]);

const domTargetingSchema = z.object({
  match: z.enum(['all', 'any']).optional().default('all'),
  timeoutMs: z.number().int().min(0).max(10000).optional().default(1500),
  rules: z.array(domTargetingRule).min(1)
}).optional();

const goalSchema = z.object({
  name: z.string().min(1, 'Goal name is required'),
  type: z.enum(['conversion', 'custom', 'purchase']),
  selector: z.string().optional(),
  eventType: z.string().optional(),
  customJs: z.string().optional(),
  value: z.number().optional(),
  // Purchase-specific fields
  valueSelector: z.string().optional(),
  itemCountSelector: z.string().optional(),
  currency: z.string().optional().default('USD'),
  // Goal-specific targeting (optional - overrides experiment targeting)
  targetUrls: z.array(z.string()).optional(),
  bodyClasses: z.array(z.string()).optional(),
  targeting: domTargetingSchema,
});

const createExperimentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  oec: z.string().min(1, 'OEC is required'),
  minDays: z.number().min(1).optional().default(7),
  minSessionsPerVariant: z.number().min(1).optional().default(1000),
  targetUrls: z.array(z.string()).optional(),
  targeting: domTargetingSchema,
  hypothesis: hypothesisSchema,
  variants: z.array(variantSchema).min(1, 'At least one variant is required'),
  goals: z.array(goalSchema).optional(),
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
    console.log('📝 Incoming payload (truncated):', {
      keys: Object.keys(body || {}),
      hasTargeting: !!body?.targeting,
      targetingPreview: body?.targeting ? {
        match: body.targeting.match,
        timeoutMs: body.targeting.timeoutMs,
        rulesCount: Array.isArray(body.targeting.rules) ? body.targeting.rules.length : 0,
        firstRule: Array.isArray(body.targeting.rules) ? body.targeting.rules[0] : undefined
      } : undefined,
      hasGoals: !!body?.goals,
      goalsCount: Array.isArray(body?.goals) ? body.goals.length : 0,
      goalsPreview: body?.goals || []
    });

    // DEBUG: Log full goals data
    console.log('🎯 [API Proxy] Goals received from frontend:', JSON.stringify(body?.goals, null, 2));

    let validatedData;
    try {
      validatedData = createExperimentSchema.parse(body);
      // DEBUG: Log what survived validation
      console.log('✅ [API Proxy] After validation, goals:', JSON.stringify(validatedData?.goals, null, 2));
      console.log('📦 [API Proxy] Full validated payload being sent to backend:', JSON.stringify(validatedData, null, 2));
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        console.error('❌ Proxy validation error:', validationError.issues);
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
      let backendBodyText = await response.text();
      let backendParsed: any = undefined;
      try { backendParsed = JSON.parse(backendBodyText); } catch (_) { /* not json */ }
      console.error('❌ Backend create experiment error body:', backendParsed || backendBodyText);
      return NextResponse.json(
        {
          error: 'BACKEND_ERROR',
          message: 'Backend rejected experiment creation',
          backendStatus: response.status,
          backendBody: backendParsed || backendBodyText,
          sentPayloadPreview: {
            hasTargeting: !!validatedData?.targeting,
            rulesCount: Array.isArray(validatedData?.targeting?.rules) ? validatedData.targeting.rules.length : 0,
          }
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('💥 Error creating experiment (proxy):', error);
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: 'Failed to create experiment',
        reason: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
