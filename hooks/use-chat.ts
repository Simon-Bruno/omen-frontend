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
    console.log('initializeSession called:', {
      isAuthenticated,
      user: !!user,
      projectId,
      initializingRef: initializingRef.current
    });

    if (!isAuthenticated || !user || !projectId) {
      console.log('initializeSession: Missing dependencies, returning early');
      return;
    }

    if (initializingRef.current) {
      console.log('initializeSession: Already initializing, returning early');
      return;
    }

    console.log('initializeSession: Starting initialization...');
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
        console.log('Loaded existing messages from API:', existingMessages);
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
      console.log('initializeSession: Setting isLoading to false');
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

  // Create new session
  const createNewSession = useCallback(async () => {
    if (!projectId) {
      setError('No project ID available');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Close existing session if there is one
      if (sessionId) {
        await chatApi.closeSession(sessionId);
      }

      // Create new session
      const { sessionId: newSessionId } = await chatApi.createOrGetSession(projectId);
      setSessionId(newSessionId);
      setMessages([]);
      
      // Fetch initial messages from the new session
      const { messages: initialMessages } = await chatApi.getMessages(newSessionId);
      setMessages(initialMessages);
      console.log('Created new session:', newSessionId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create new session';
      setError(errorMessage);
      console.error('Failed to create new session:', err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, sessionId]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Initialize session when component mounts or dependencies change
  useEffect(() => {
    console.log('useChat useEffect triggered:', {
      autoInitialize,
      isAuthenticated,
      user: !!user,
      projectId,
      initializingRef: initializingRef.current,
      isLoading
    });
    
    if (autoInitialize && !initializingRef.current) {
      console.log('Calling initializeSession...');
      initializeSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, projectId, autoInitialize]);

  return {
    messages,
    sendMessage,
    isLoading,
    sessionId,
    error,
    clearError,
    refreshMessages,
    closeSession,
    createNewSession,
  };
};
