"use client";

import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { Thread } from "@/components/assistant-ui/thread";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { AssistantChatTransport } from "@assistant-ui/react-ai-sdk";
import { useEffect, useRef, useState } from "react";
import { VariantJobsProvider } from "@/contexts/variant-jobs-context";

const AssistantWithWelcome = ({ runtime }: { runtime: any }) => {
  const [isWelcomeMessageLoaded, setIsWelcomeMessageLoaded] = useState(false);
  const hasLoadedWelcomeMessage = useRef(false);

  useEffect(() => {
    // Only load welcome message once
    if (hasLoadedWelcomeMessage.current) {
      return;
    }

    const loadWelcomeMessage = async () => {
      try {
        const response = await fetch("/api/welcome");
        const welcomeMessage = await response.json();
        
        // Add the welcome message to the thread
        runtime.thread.append(welcomeMessage);
        hasLoadedWelcomeMessage.current = true;
        setIsWelcomeMessageLoaded(true);
      } catch (error) {
        console.error("Failed to load welcome message:", error);
        // Even if loading fails, show the chat interface
        setIsWelcomeMessageLoaded(true);
      }
    };

    // Load welcome message after a short delay to ensure runtime is ready
    const timeoutId = setTimeout(loadWelcomeMessage, 100);

    return () => clearTimeout(timeoutId);
  }, [runtime]);

  // Show loading state until welcome message is loaded
  if (!isWelcomeMessageLoaded) {
    return (
      <div className="h-full w-full bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Preparing your assistant...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-background flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0">
        <Thread />
      </div>
    </div>
  );
};

export const Assistant = () => {
  const runtime = useChatRuntime({
    transport: new AssistantChatTransport({
      api: "/api/chat",
    }),
  });

  return (
    <VariantJobsProvider>
      <AssistantRuntimeProvider runtime={runtime}>
        <AssistantWithWelcome runtime={runtime} />
      </AssistantRuntimeProvider>
    </VariantJobsProvider>
  );
};
