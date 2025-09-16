"use client";

import React, { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  type ChatModelAdapter,
} from "@assistant-ui/react";
import { useChat } from "@/hooks/use-chat";
import { useAuth } from "@/contexts/auth-context";
import { ChatMessage, SendMessageResponse } from "@/lib/chat-types";

interface ChatProviderProps {
  children: ReactNode;
  projectId: string;
}

interface ChatContextType {
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

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

// Create the adapter that integrates with our chat API
const createChatModelAdapter = (
  chat: {
    sendMessage: (message: string) => Promise<SendMessageResponse | void>;
    isLoading: boolean;
    messages: ChatMessage[];
  }
): ChatModelAdapter => ({
  async run({ messages }) {
    // Get the last user message
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
      return {
        content: [
          {
            type: "text",
            text: "I didn't receive a valid message. Please try again.",
          },
        ],
      };
    }

    // Extract text content from the message
    const messageText = lastMessage.content
      .filter((part: { type: string; text?: string }) => part.type === 'text')
      .map((part: { type: string; text?: string }) => part.text || '')
      .join('');

    if (!messageText.trim()) {
      return {
        content: [
          {
            type: "text",
            text: "I didn't receive any text in your message. Please try again.",
          },
        ],
      };
    }

    try {
      // Send the message through our chat API and get the response directly
      const response = await chat.sendMessage(messageText);

      // The response should contain the agent message directly
      if (response && 'message' in response && response.message?.content?.text) {
        return {
          content: [
            {
              type: "text",
              text: response.message.content.text,
            },
          ],
        };
      } else if (response && 'content' in response && response.content && typeof response.content === 'object' && 'text' in response.content && typeof response.content.text === 'string') {
        // Handle case where response is the message object directly
        return {
          content: [
            {
              type: "text",
              text: response.content.text,
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: "text",
              text: "I received your message but couldn't generate a response. Please try again.",
            },
          ],
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
          },
        ],
      };
    }
  },
});

// Convert ChatMessage format to assistant-ui format
const convertToAssistantUIMessages = (messages: ChatMessage[]) => {
  return messages.map((message) => ({
    role: (message.role === 'USER' ? 'user' :
      message.role === 'AGENT' ? 'assistant' :
        message.role === 'SYSTEM' ? 'system' : 'user') as 'user' | 'assistant' | 'system',
    content: [{ type: "text" as const, text: message.content.text || "" }],
  }));
};

// Component that handles runtime initialization
const ChatRuntimeWrapper: React.FC<{
  children: ReactNode;
  adapter: ChatModelAdapter;
  messages: ChatMessage[];
}> = ({ children, adapter, messages }) => {
  const initialMessages = useMemo(() => convertToAssistantUIMessages(messages), [messages]);

  console.log('initialMessages', initialMessages);

  // Create runtime with initial messages only if we have messages
  // > 1 Because we dont include the system message
  const runtimeConfig = messages.length > 1 ? { initialMessages } : {};

  const runtime = useLocalRuntime(adapter, runtimeConfig);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
};

export const ChatProvider: React.FC<ChatProviderProps> = ({
  children,
  projectId
}) => {
  const { project } = useAuth();
  const chat = useChat({
    projectId: projectId || project?.id || 'default',
    autoInitialize: true
  });

  // Create the adapter with our chat functions
  const adapter = useMemo(() => createChatModelAdapter(chat), [chat]);

  const contextValue: ChatContextType = {
    messages: chat.messages,
    sendMessage: chat.sendMessage,
    isLoading: chat.isLoading,
    sessionId: chat.sessionId,
    error: chat.error,
    clearError: chat.clearError,
    refreshMessages: chat.refreshMessages,
    closeSession: chat.closeSession,
    createNewSession: chat.createNewSession,
  };

  // Show loading state while messages are being fetched
  if (chat.isLoading && chat.messages.length === 0) {
    return (
      <ChatContext.Provider value={contextValue}>
        <div className="flex items-center justify-center p-4">
          <div className="text-sm text-muted-foreground">Loading chat...</div>
        </div>
      </ChatContext.Provider>
    );
  }

  return (
    <ChatContext.Provider value={contextValue}>
      <ChatRuntimeWrapper
        key={chat.sessionId || 'no-session'}
        adapter={adapter}
        messages={chat.messages}
      >
        {children}
      </ChatRuntimeWrapper>
    </ChatContext.Provider>
  );
};