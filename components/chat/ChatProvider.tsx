"use client";

import React, { createContext, useContext, type ReactNode } from "react";
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
    console.log("User sent last message:", lastMessage);
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
      .map((part: { type: string; text?: string }) => part.text)
      .join('');

    console.log("User Message text:", messageText);

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

      console.log("Response:", response);

      // The response should contain the agent message directly
      if (response && 'message' in response && response.message && response.message.content.text) {
        return {
          content: [
            {
              type: "text",
              text: response.message.content.text,
            },
          ],
        };
      } else if (response && 'content' in response && response.content && response.content.text) {
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
        console.log('Unexpected response format:', response);
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
      console.error('Error in chat adapter:', error);
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
  const adapter = createChatModelAdapter(chat);

  const runtime = useLocalRuntime(adapter, {
    initialMessages: [],
  });

  const contextValue: ChatContextType = {
    messages: chat.messages,
    sendMessage: chat.sendMessage,
    isLoading: chat.isLoading,
    sessionId: chat.sessionId,
    error: chat.error,
    clearError: chat.clearError,
  };

  return (
    <ChatContext.Provider value={contextValue}>
      <AssistantRuntimeProvider runtime={runtime}>
        {children}
      </AssistantRuntimeProvider>
    </ChatContext.Provider>
  );
};
