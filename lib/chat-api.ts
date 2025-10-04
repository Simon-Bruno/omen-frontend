import {
  ChatSession,
  SendMessageRequest,
  SendMessageResponse,
  GetMessagesResponse,
  GetActiveSessionResponse,
  ChatError,
  ChatApiConfig,
  JobStatus,
} from './chat-types';

// Default API configuration
const defaultConfig: ChatApiConfig = {
  baseUrl: '', // Use relative URLs to call Next.js API routes
  getAuthToken: async () => {
    // This will be overridden by the hook
    return null;
  },
};

class ChatApiService {
  private config: ChatApiConfig;

  constructor(config: Partial<ChatApiConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Include cookies for authentication
    });

    if (!response.ok) {
      const errorData: ChatError = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
        status: response.status,
      }));
      throw new Error(errorData.error);
    }

    const data = await response.json();
    console.log('Chat API service received:', JSON.stringify(data, null, 2));
    return data;
  }

  /**
   * Create or get active chat session for a project
   */
  async createOrGetSession(projectId: string): Promise<ChatSession> {
    return this.makeRequest<ChatSession>(`/api/projects/${projectId}/chat/sessions`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  /**
   * Get active session for a project
   */
  async getActiveSession(projectId: string): Promise<GetActiveSessionResponse> {
    return this.makeRequest<GetActiveSessionResponse>(
      `/api/projects/${projectId}/chat/sessions/active`
    );
  }

  /**
   * Send a message to the chat session
   */
  async sendMessage(
    sessionId: string,
    message: string
  ): Promise<SendMessageResponse> {
    const request: SendMessageRequest = { message };
    return this.makeRequest<SendMessageResponse>(
      `/api/chat/sessions/${sessionId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  }

  /**
   * Get conversation history for a session
   */
  async getMessages(
    sessionId: string,
    limit: number = 50
  ): Promise<GetMessagesResponse> {
    return this.makeRequest<GetMessagesResponse>(
      `/api/chat/sessions/${sessionId}/messages?limit=${limit}`
    );
  }

  /**
   * Close a chat session
   */
  async closeSession(sessionId: string): Promise<void> {
    await this.makeRequest(`/api/chat/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string, projectId: string): Promise<JobStatus> {
    return this.makeRequest<JobStatus>(
      `/api/jobs/${jobId}?projectId=${projectId}`
    );
  }

  /**
   * Poll job status until completion
   */
  async pollJobStatus(
    jobId: string, 
    projectId: string, 
    onStatusUpdate?: (status: JobStatus) => void,
    pollInterval: number = 10000
  ): Promise<JobStatus> {
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const status = await this.getJobStatus(jobId, projectId);
          
          if (onStatusUpdate) {
            onStatusUpdate(status);
          }

          if (status.status === 'completed' || status.status === 'failed') {
            resolve(status);
            return;
          }

          // Continue polling
          setTimeout(poll, pollInterval);
        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  }
}

// Create a singleton instance
export const chatApi = new ChatApiService();

// Export the class for custom configurations
export { ChatApiService };
