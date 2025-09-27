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

// Variant Types
export interface Variant {
  variant_label: string;
  description: string;
  rationale: string;
  accessibility_consideration: string;
  implementation_notes: string;
  css_code: string;
  html_code: string;
  injection_method: 'selector' | 'new_element' | 'modify_existing';
  target_selector?: string;
  new_element_html?: string;
  implementation_instructions: string;
  screenshot?: string; // URL to the variant screenshot
}

// Job Types
export interface JobStatus {
  jobId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
  progress?: number;
}

export interface JobResult {
  jobId: string;
  status: 'completed';
  result: any;
}

// API Configuration
export interface ChatApiConfig {
  baseUrl: string;
  getAuthToken: () => Promise<string | null>;
}
