// Chat API Types
export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'USER' | 'AGENT' | 'TOOL' | 'SYSTEM';
  content: {
    text?: string;
    metadata?: {
      usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
      };
      [key: string]: unknown;
    };
  };
  createdAt: string;
}

export interface ChatSession {
  sessionId: string;
}

export interface SendMessageResponse {
  message: ChatMessage;
}

export interface SendMessageRequest {
  message: string;
}

export interface SendMessageResponse {
  message: ChatMessage;
}

export interface GetMessagesResponse {
  messages: ChatMessage[];
}

export interface GetActiveSessionResponse {
  sessionId: string | null;
}

export interface ChatError {
  error: string;
  status?: number;
}

// Chat Hook Types
export interface UseChatOptions {
  projectId: string;
  autoInitialize?: boolean;
}

export interface UseChatReturn {
  messages: ChatMessage[];
  sendMessage: (message: string) => Promise<SendMessageResponse | void>;
  isLoading: boolean;
  sessionId: string | null;
  error: string | null;
  clearError: () => void;
  refreshMessages: () => Promise<void>;
  closeSession: () => Promise<void>;
  createNewSession: () => Promise<void>;
}

// API Configuration
export interface ChatApiConfig {
  baseUrl: string;
  getAuthToken: () => Promise<string | null>;
}
