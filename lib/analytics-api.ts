/**
 * Analytics API V2 - Simplified Service Layer
 * Uses single /summary endpoint instead of multiple overlapping endpoints
 */

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:3000';
};

// Type definitions for Analytics V2
export interface ExperimentSummary {
  experimentId: string;
  projectId: string;
  dateRange: {
    start: string;
    end: string;
  };
  totalSessions: number;
  totalEvents: number;
  variants: VariantSummary[];
}

export interface VariantSummary {
  variantId: string;
  sessions: number;
  sessionPercent: number;
  exposures: number;
  pageviews: number;
  goals: GoalMetric[];
  revenue: RevenueMetric;
  customEvents: CustomEvent[];
}

export interface GoalMetric {
  name: string;
  type: string;
  conversions: number;
  conversionRate: number;
  totalValue: number;
  avgValue: number;
}

export interface RevenueMetric {
  totalRevenue: number;
  purchases: number;
  purchaseRate: number;
  avgOrderValue: number;
  revenuePerSession: number;
}

export interface CustomEvent {
  eventName: string;
  count: number;
  uniqueSessions: number;
}

export interface SessionListItem {
  sessionId: string;
  eventCount: number;
}

export interface SessionsResponse {
  sessions: SessionListItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface SessionSummary {
  totalEvents: number;
  variantsSeen: string[];
  pagesVisited: string[];
  eventTypes: string[];
}

export interface UserJourneyEvent {
  id: string;
  projectId: string;
  experimentId: string;
  eventType: 'EXPOSURE' | 'PAGEVIEW' | 'CONVERSION' | 'PURCHASE' | 'CUSTOM';
  sessionId: string;
  viewId: string;
  properties: any;
  timestamp: number;
  createdAt: string;
}

export interface SessionDetails {
  sessionId: string;
  summary: SessionSummary;
  journey: UserJourneyEvent[];
}

export interface AnalyticsEvent {
  id: string;
  projectId: string;
  sessionId: string;
  eventType: 'EXPOSURE' | 'PAGEVIEW' | 'CONVERSION' | 'CUSTOM' | 'PURCHASE';
  properties: any;
  assignedVariants?: Array<{
    experimentId: string;
    variantId: string;
  }>;
  url?: string;
  timestamp: number;
  createdAt: string;
}

export interface RawEventsResponse {
  events: AnalyticsEvent[];
  total: number;
  limit: number;
  offset: number;
}

export interface Experiment {
  id: string;
  name: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  description?: string;
  createdAt: string;
  updatedAt: string;
  projectId: string;
}

class AnalyticsApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'AnalyticsApiError';
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', 
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new AnalyticsApiError(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof AnalyticsApiError) {
      throw error;
    }
    console.error('💥 Network error:', error);
    throw new AnalyticsApiError(
      `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export const checkAuthStatus = () => {
  if (typeof window === 'undefined') return false;
  
  const cookies = document.cookie;
  const possibleCookieNames = [
    'better-auth.session_token',
    'better-auth.session-token', 
    'session_token',
    'session-token',
    'better-auth.session',
    'auth.session',
    'auth'
  ];
  
  return possibleCookieNames.some(name => cookies.includes(name));
};

// Simplified Analytics API - 4 endpoints only
export const analyticsApi = {
  /**
   * Get experiment summary - Everything in one call
   * Replaces: getFunnelAnalysis, getConversionRates, getPurchaseStats, getExposureStats, getGoalsBreakdown
   */
  async getExperimentSummary(
    experimentId: string
  ): Promise<ExperimentSummary> {
    const endpoint = `/api/analytics/experiments/${experimentId}/summary`;
    return apiRequest<ExperimentSummary>(endpoint);
  },

  /**
   * Get sessions for an experiment (for debugging)
   */
  async getExperimentSessions(
    experimentId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<SessionsResponse> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    
    const queryString = params.toString();
    const endpoint = `/api/analytics/experiments/${experimentId}/sessions${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<SessionsResponse>(endpoint);
  },

  /**
   * Get session details including journey
   */
  async getSessionDetails(
    sessionId: string
  ): Promise<SessionDetails> {
    const endpoint = `/api/analytics/journey/${sessionId}`;
    return apiRequest<SessionDetails>(endpoint);
  },

  /**
   * Get raw events (for debugging)
   */
  async getRawEvents(options?: {
    experimentId?: string;
    sessionId?: string;
    limit?: number;
    offset?: number;
  }): Promise<RawEventsResponse> {
    const params = new URLSearchParams();
    if (options?.experimentId) params.append('experimentId', options.experimentId);
    if (options?.sessionId) params.append('sessionId', options.sessionId);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    const queryString = params.toString();
    const endpoint = `/api/analytics/raw-events${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<RawEventsResponse>(endpoint);
  },

  /**
   * Reset experiment events (for testing)
   */
  async resetExperimentEvents(
    experimentId: string
  ): Promise<{ success: boolean; deletedCount: number; message: string }> {
    const endpoint = `/api/analytics/experiments/${experimentId}/reset`;

    const response = await fetch(`${getBaseUrl()}${endpoint}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to reset experiment events:', errorText);
      throw new Error(`Failed to reset experiment events: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Get all experiments for a project
   */
  async getExperiments(projectId: string): Promise<Experiment[]> {
    const endpoint = `/api/experiments`;
    return apiRequest<Experiment[]>(endpoint);
  },
};
