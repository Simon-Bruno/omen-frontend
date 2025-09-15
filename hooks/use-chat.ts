import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { chatApi } from '@/lib/chat-api';
import {
  ChatMessage,
  UseChatOptions,
  UseChatReturn,
} from '@/lib/chat-types';

export const useChat = (options: UseChatOptions): UseChatReturn => {
  const { projectId, autoInitialize = true } = options;
  const { user, isAuthenticated } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ref to track if we're currently initializing
  const initializingRef = useRef(false);


  // Initialize chat session
  const initializeSession = useCallback(async () => {
    if (!isAuthenticated || !user || !projectId || initializingRef.current) {
      return;
    }

    initializingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      // First, try to get an existing active session
      const activeSession = await chatApi.getActiveSession(projectId);

      if (activeSession.sessionId) {
        // Load existing session
        setSessionId(activeSession.sessionId);
        const { messages: existingMessages } = await chatApi.getMessages(activeSession.sessionId);
        setMessages(existingMessages);
      } else {
        // Create new session
        const { sessionId: newSessionId } = await chatApi.createOrGetSession(projectId);
        setSessionId(newSessionId);
        setMessages([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize chat';
      setError(errorMessage);
      console.error('Failed to initialize chat session:', err);
    } finally {
      setIsLoading(false);
      initializingRef.current = false;
    }
  }, [isAuthenticated, user, projectId]);

  // Send a message
  const sendMessage = useCallback(async (message: string) => {
    if (!sessionId || !message.trim() || isLoading) {
      return;
    }

    setIsLoading(true);
    setError(null);

    // Add user message immediately for better UX
    const userMessage: ChatMessage = {
      id: `temp_${Date.now()}`,
      sessionId,
      role: 'USER',
      content: { text: message },
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await chatApi.sendMessage(sessionId, message);
      console.log('Frontend received response:', JSON.stringify(response, null, 2));

      // Add the agent response to the messages
      setMessages(prev => [...prev, response.message]);

      return response; // Return the response for the adapter
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);

      // Remove the temporary user message on error
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));

      console.error('Failed to send message:', err);
      throw err; // Re-throw for the adapter
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, isLoading]);

  // Refresh messages
  const refreshMessages = useCallback(async () => {
    if (!sessionId) {
      return;
    }

    try {
      const { messages: freshMessages } = await chatApi.getMessages(sessionId);
      setMessages(freshMessages);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh messages';
      setError(errorMessage);
      console.error('Failed to refresh messages:', err);
    }
  }, [sessionId]);

  // Close session
  const closeSession = useCallback(async () => {
    if (!sessionId) {
      return;
    }

    try {
      await chatApi.closeSession(sessionId);
      setSessionId(null);
      setMessages([]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to close session';
      setError(errorMessage);
      console.error('Failed to close session:', err);
    }
  }, [sessionId]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Initialize session when component mounts or dependencies change
  useEffect(() => {
    if (autoInitialize) {
      initializeSession();
    }
  }, [initializeSession, autoInitialize]);

  return {
    messages,
    sendMessage,
    isLoading,
    sessionId,
    error,
    clearError,
    refreshMessages,
    closeSession,
  };
};
