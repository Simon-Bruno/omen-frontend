/**
 * Analytics API service layer
 * Handles all analytics-related API calls with proper TypeScript types
 */

// Base API URL configuration
const getBaseUrl = () => {
  // For analytics API calls, we should use the frontend URL since we're proxying through Next.js API routes
  if (typeof window !== 'undefined') {
    return window.location.origin; // Use frontend URL, not backend URL
  }
  return 'http://localhost:3000'; // Default to frontend URL
};

// Type definitions for analytics data
export interface FunnelStep {
  step: string;
  eventType: 'EXPOSURE' | 'PAGEVIEW' | 'CONVERSION' | 'PURCHASE';
  count: number;
  percentage: number;
  dropoffRate: number;
}

export interface FunnelAnalysis {
  experimentId: string;
  variantId: string;
  steps: FunnelStep[];
  totalSessions: number;
  conversionRate: number;
}

export interface FunnelVariant {
  variantId: string;
  steps: FunnelStep[];
  totalSessions: number;
  conversionRate: number;
}

export interface OverallStats {
  totalSessions: number;
  totalExposures: number;
  totalConversions: number;
  overallConversionRate: number;
}

export interface NewFunnelAnalysis {
  experimentId: string;
  variants: FunnelVariant[];
  overallStats: OverallStats;
}

export interface ConversionRate {
  experimentId: string;
  variantId: string;
  sessions: number;
  conversions: number;
  conversionRate: number;
  averageValue: number;
  totalValue: number;
}

export interface ExposureStats {
  experimentId: string;
  variantId: string;
  exposures: number;
  uniqueSessions: number;
}

export interface PurchaseStats {
  experimentId: string;
  variantId: string;
  sessions: number;
  purchases: number;
  purchaseRate: number;
  totalRevenue: number;
  averageOrderValue: number;
  revenuePerSession: number;
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

export interface Experiment {
  id: string;
  name: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  description?: string;
  createdAt: string;
  updatedAt: string;
  projectId: string;
}

export interface SessionSummary {
  totalEvents: number;
  variantsSeen: string[];
  pagesVisited: string[];
  eventTypes: string[];
}

// For the sessions list endpoint (basic info only)
export interface SessionListItem {
  sessionId: string;
  eventCount: number;
}

// For detailed session info (with summary and journey)
export interface Session {
  sessionId: string;
  summary: SessionSummary;
}

export interface SessionsResponse {
  sessions: SessionListItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface SessionDetails {
  sessionId: string;
  summary: SessionSummary;
  journey: UserJourneyEvent[];
}

// API Error handling
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

// Generic API request handler
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

// Check authentication status
export const checkAuthStatus = () => {
  if (typeof window === 'undefined') return false;
  
  const cookies = document.cookie;
  
  // Check for various possible Better Auth cookie names
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

// Analytics API functions
export const analyticsApi = {
  /**
   * Get funnel analysis for a specific experiment
   */
  async getFunnelAnalysis(
    projectId: string,
    experimentId: string,
    dateRange?: { start: string; end: string }
  ): Promise<NewFunnelAnalysis> {
    const params = new URLSearchParams();
    if (dateRange) {
      params.append('start', dateRange.start);
      params.append('end', dateRange.end);
    }
    
    const queryString = params.toString();
    const endpoint = `/api/analytics/funnel/${experimentId}${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiRequest<{ 
      experimentId: string;
      variants: Array<{
        variantId: string;
        steps: Array<{
          stepName: string;
          eventType: string;
          count: number;
          percentage: number;
          dropoffRate: number;
        }>;
        totalSessions: number;
        conversionRate: number;
      }>;
      overallStats: {
        totalSessions: number;
        totalExposures: number;
        totalConversions: number;
        overallConversionRate: number;
      };
    }>(endpoint);
    
    // Debug: Log the actual response structure
    console.log('🔍 Raw funnel response:', response);
    
    // Transform the response to match our NewFunnelAnalysis interface
    const transformedVariants = response.variants.map(variant => {
      const transformedSteps = variant.steps.map(step => ({
        step: step.stepName,
        eventType: step.eventType as 'EXPOSURE' | 'PAGEVIEW' | 'CONVERSION' | 'PURCHASE',
        count: step.count,
        percentage: step.percentage,
        dropoffRate: step.dropoffRate,
      }));
      
      return {
        variantId: variant.variantId,
        steps: transformedSteps,
        totalSessions: variant.totalSessions,
        conversionRate: variant.conversionRate,
      };
    });
    
    console.log('🔄 Transformed variants:', transformedVariants);
    
    return {
      experimentId: response.experimentId,
      variants: transformedVariants,
      overallStats: response.overallStats,
    };
  },

  /**
   * Get conversion rates for variants in an experiment
   */
  async getConversionRates(
    projectId: string,
    experimentId: string,
    dateRange?: { start: string; end: string }
  ): Promise<ConversionRate[]> {
    const params = new URLSearchParams();
    if (dateRange) {
      params.append('start', dateRange.start);
      params.append('end', dateRange.end);
    }
    
    const queryString = params.toString();
    const endpoint = `/api/analytics/conversions/${experimentId}${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiRequest<{ conversionRates: any[] }>(endpoint);
    
    // Transform the response to match our ConversionRate interface
    return response.conversionRates.map(rate => ({
      experimentId: experimentId,
      variantId: rate.variantId,
      sessions: rate.sessions,
      conversions: rate.conversions,
      conversionRate: rate.conversionRate * 100, // Convert to percentage
      averageValue: rate.averageValue,
      totalValue: rate.totalValue,
    }));
  },

  /**
   * Get exposure statistics for variants
   */
  async getExposureStats(
    projectId: string,
    experimentId: string,
    dateRange?: { start: string; end: string }
  ): Promise<ExposureStats[]> {
    const params = new URLSearchParams();
    if (dateRange) {
      params.append('start', dateRange.start);
      params.append('end', dateRange.end);
    }
    
    const queryString = params.toString();
    const endpoint = `/api/analytics/experiments/${experimentId}/exposures${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiRequest<ExposureStats[]>(endpoint);
    
    // Transform the response to match our ExposureStats interface
    return response.map(stats => ({
      experimentId: experimentId,
      variantId: stats.variantId || 'default',
      exposures: stats.exposures,
      uniqueSessions: stats.uniqueSessions,
    }));
  },

  /**
   * Get purchase statistics for variants in an experiment
   */
  async getPurchaseStats(
    projectId: string,
    experimentId: string,
    dateRange?: { start: string; end: string }
  ): Promise<PurchaseStats[]> {
    const params = new URLSearchParams();
    if (dateRange) {
      params.append('start', dateRange.start);
      params.append('end', dateRange.end);
    }
    
    const queryString = params.toString();
    const endpoint = `/api/analytics/purchases/${experimentId}${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiRequest<{ purchaseStats: PurchaseStats[] }>(endpoint);
    
    return response.purchaseStats;
  },

  /**
   * Get user journey for a specific session
   */
  async getUserJourney(
    projectId: string,
    sessionId: string,
    dateRange?: { start: string; end: string }
  ): Promise<UserJourneyEvent[]> {
    const params = new URLSearchParams();
    if (dateRange) {
      params.append('start', dateRange.start);
      params.append('end', dateRange.end);
    }
    
    const queryString = params.toString();
    const endpoint = `/api/analytics/journey/${sessionId}${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiRequest<{ journey: any[] }>(endpoint);
    
    // Transform the response to match our UserJourneyEvent interface
    return response.journey.map(event => ({
      id: event.id,
      projectId: event.projectId,
      experimentId: event.experimentId,
      eventType: event.eventType,
      sessionId: event.sessionId,
      viewId: event.viewId,
      properties: event.properties,
      timestamp: event.timestamp,
      createdAt: event.createdAt,
    }));
  },

  /**
   * Get all experiments for a project
   */
  async getExperiments(projectId: string): Promise<Experiment[]> {
    const endpoint = `/api/experiments`;
    
    const response = await apiRequest<Experiment[]>(endpoint);
    return response;
  },

  /**
   * Get sessions for a specific experiment
   */
  async getExperimentSessions(
    projectId: string,
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
    
    const response = await apiRequest<SessionsResponse>(endpoint);
    return response;
  },

  /**
   * Get detailed session information including journey
   */
  async getSessionDetails(
    projectId: string,
    sessionId: string
  ): Promise<SessionDetails> {
    const endpoint = `/api/analytics/journey/${sessionId}`;

    const response = await apiRequest<SessionDetails>(endpoint);
    return response;
  },

  /**
   * Create a new experiment manually
   */
  async createExperiment(experimentData: {
    name: string;
    oec: string;
    minDays?: number;
    minSessionsPerVariant?: number;
    targetUrls?: string[];
    hypothesis: {
      hypothesis: string;
      rationale: string;
      primaryKpi: string;
    };
    variants: Array<{
      variantId: string;
      selector?: string;
      html?: string;
      css?: string;
      js?: string;
      position?: 'INNER' | 'OUTER' | 'BEFORE' | 'AFTER';
    }>;
    trafficDistribution?: Record<string, number>;
  }): Promise<any> {
    const endpoint = '/api/experiments';

    const response = await apiRequest<any>(endpoint, {
      method: 'POST',
      body: JSON.stringify(experimentData),
    });

    return response;
  },

  /**
   * Reset all analytics events for an experiment
   */
  async resetExperimentEvents(
    projectId: string,
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
};

// Backward compatibility helper
export const convertToLegacyFunnel = (newFunnel: NewFunnelAnalysis): FunnelAnalysis => {
  if (!newFunnel.variants || newFunnel.variants.length === 0) {
    return {
      experimentId: newFunnel.experimentId,
      variantId: 'default',
      steps: [],
      totalSessions: 0,
      conversionRate: 0,
    };
  }
  
  // Use the first variant as the "overall" representation
  const firstVariant = newFunnel.variants[0];
  return {
    experimentId: newFunnel.experimentId,
    variantId: firstVariant.variantId,
    steps: firstVariant.steps,
    totalSessions: newFunnel.overallStats.totalSessions,
    conversionRate: newFunnel.overallStats.overallConversionRate,
  };
};

// Utility functions for data processing
export const analyticsUtils = {
  /**
   * Calculate statistical significance between two conversion rates
   */
  calculateSignificance(
    controlRate: number,
    controlSample: number,
    variantRate: number,
    variantSample: number
  ): { isSignificant: boolean; confidence: number; pValue: number } {
    // Simplified statistical significance calculation
    // In production, you'd want to use a proper statistical library
    const pooledRate = (controlRate * controlSample + variantRate * variantSample) / 
                      (controlSample + variantSample);
    
    const se = Math.sqrt(pooledRate * (1 - pooledRate) * 
                        (1/controlSample + 1/variantSample));
    
    const zScore = Math.abs(variantRate - controlRate) / se;
    const pValue = 2 * (1 - this.normalCDF(zScore));
    const confidence = (1 - pValue) * 100;
    
    return {
      isSignificant: pValue < 0.05,
      confidence: Math.round(confidence * 100) / 100,
      pValue: Math.round(pValue * 10000) / 10000,
    };
  },

  /**
   * Normal CDF approximation for statistical calculations
   */
  normalCDF(x: number): number {
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  },

  /**
   * Error function approximation
   */
  erf(x: number): number {
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  },

  /**
   * Format percentage values
   */
  formatPercentage(value: number, decimals: number = 1): string {
    return `${(value * 100).toFixed(decimals)}%`;
  },

  /**
   * Format large numbers with K/M suffixes
   */
  formatNumber(value: number): string {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  },
};
