/**
 * Experiments API service layer
 * Handles all experiment management API calls with proper TypeScript types
 */

// Base API URL configuration
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin; // Use frontend URL, not backend URL
  }
  return 'http://localhost:3000'; // Default to frontend URL
};

// Type definitions for experiments
export interface Experiment {
  id: string;
  name: string;
  status: 'DRAFT' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAILED';
  oec: string;
  minDays: number;
  minSessionsPerVariant: number;
  targetUrls: string[];
  createdAt: string;
  publishedAt?: string;
  finishedAt?: string;
  projectId?: string;
}

export interface ExperimentDetails extends Experiment {
  hypothesis: {
    id: string;
    experimentId: string;
    hypothesis: string;
    rationale: string;
    primaryKpi: string;
    createdAt: string;
  };
  traffic: Array<{
    id: string;
    experimentId: string;
    variantId: string;
    percentage: string;
  }>;
  variants: Array<{
    id: string;
    experimentId: string;
    variantId: string;
    selector: string;
    html: string;
    css?: string;
    js?: string;
    position: 'INNER' | 'OUTER' | 'BEFORE' | 'AFTER' | 'APPEND' | 'PREPEND';
  }>;
}

export interface CreateExperimentRequest {
  name: string;
  oec: string;
  minDays: number;
  minSessionsPerVariant: number;
  targetUrls: string[];
  hypothesis: {
    hypothesis: string;
    rationale: string;
    primaryKpi: string;
  };
  variants: Array<{
    variantId: string;
    selector: string;
    html: string;
    css?: string;
    js?: string;
    position: 'INNER' | 'OUTER' | 'BEFORE' | 'AFTER' | 'APPEND' | 'PREPEND';
  }>;
  trafficDistribution?: Record<string, number>;
}

export interface StatusUpdateRequest {
  action: 'start' | 'pause' | 'resume' | 'complete';
}

// API Error handling
class ExperimentsApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ExperimentsApiError';
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
    credentials: 'include', 
    ...options,
  };

  // Only set Content-Type if there's a body
  if (options.body) {
    defaultOptions.headers = {
      'Content-Type': 'application/json',
      ...defaultOptions.headers,
    };
  }

  try {
    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ExperimentsApiError(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof ExperimentsApiError) {
      throw error;
    }
    console.error('💥 Network error:', error);
    throw new ExperimentsApiError(
      `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// Experiments API functions
export const experimentsApi = {
  /**
   * Get all experiments for the current project
   */
  async getExperiments(): Promise<Experiment[]> {
    const response = await apiRequest<Experiment[]>('/api/experiments');
    return response;
  },

  /**
   * Get a single experiment with full details
   */
  async getExperiment(id: string): Promise<ExperimentDetails> {
    const response = await apiRequest<ExperimentDetails>(`/api/experiments/${id}`);
    return response;
  },

  /**
   * Create a new experiment
   */
  async createExperiment(data: CreateExperimentRequest): Promise<Experiment> {
    const response = await apiRequest<Experiment>('/api/experiments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response;
  },

  /**
   * Update experiment status
   */
  async updateStatus(id: string, action: StatusUpdateRequest['action']): Promise<Experiment> {
    const response = await apiRequest<{ success: boolean; experiment: Experiment }>(`/api/experiments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ action }),
    });
    return response.experiment;
  },

  /**
   * Delete an experiment
   */
  async deleteExperiment(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiRequest<{ success: boolean; message: string }>(`/api/experiments/${id}`, {
      method: 'DELETE',
    });
    return response;
  },
};

// Utility functions for experiment management
export const experimentUtils = {
  /**
   * Get status color for UI display
   */
  getStatusColor(status: Experiment['status']): string {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'RUNNING':
        return 'bg-green-100 text-green-800';
      case 'PAUSED':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  },

  /**
   * Get status label for UI display
   */
  getStatusLabel(status: Experiment['status']): string {
    switch (status) {
      case 'DRAFT':
        return 'Draft';
      case 'RUNNING':
        return 'Running';
      case 'PAUSED':
        return 'Paused';
      case 'COMPLETED':
        return 'Completed';
      case 'FAILED':
        return 'Failed';
      default:
        return 'Unknown';
    }
  },

  /**
   * Check if experiment can be started
   */
  canStart(status: Experiment['status']): boolean {
    return status === 'DRAFT';
  },

  /**
   * Check if experiment can be paused
   */
  canPause(status: Experiment['status']): boolean {
    return status === 'RUNNING';
  },

  /**
   * Check if experiment can be resumed
   */
  canResume(status: Experiment['status']): boolean {
    return status === 'PAUSED';
  },

  /**
   * Check if experiment can be completed
   */
  canComplete(status: Experiment['status']): boolean {
    return status === 'RUNNING' || status === 'PAUSED';
  },

  /**
   * Check if experiment can be deleted
   */
  canDelete(status: Experiment['status']): boolean {
    return status === 'DRAFT' || status === 'PAUSED' || status === 'COMPLETED';
  },

  /**
   * Get available actions for an experiment
   */
  getAvailableActions(status: Experiment['status']): Array<{
    action: StatusUpdateRequest['action'];
    label: string;
    description: string;
  }> {
    const actions = [];

    if (this.canStart(status)) {
      actions.push({
        action: 'start' as const,
        label: 'Start',
        description: 'Publish experiment and start serving variants',
      });
    }

    if (this.canPause(status)) {
      actions.push({
        action: 'pause' as const,
        label: 'Pause',
        description: 'Temporarily pause the experiment',
      });
    }

    if (this.canResume(status)) {
      actions.push({
        action: 'resume' as const,
        label: 'Resume',
        description: 'Resume the paused experiment',
      });
    }

    if (this.canComplete(status)) {
      actions.push({
        action: 'complete' as const,
        label: 'Complete',
        description: 'End the experiment and stop serving variants',
      });
    }

    return actions;
  },

  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  /**
   * Get experiment duration
   */
  getDuration(experiment: Experiment): string {
    const start = new Date(experiment.publishedAt || experiment.createdAt);
    const end = experiment.finishedAt ? new Date(experiment.finishedAt) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Less than 1 day';
    } else if (diffDays === 1) {
      return '1 day';
    } else {
      return `${diffDays} days`;
    }
  },
};

