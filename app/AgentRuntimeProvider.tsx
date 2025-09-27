"use client";

import { useEffect, useRef, createContext, useContext, type ReactNode } from "react";
import {
  AssistantRuntimeProvider,
} from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { AssistantChatTransport } from "@assistant-ui/react-ai-sdk";

// Context for current state
const CurrentStateContext = createContext<any>(null);

export const useCurrentState = () => {
  const context = useContext(CurrentStateContext);
  return context?.current || {};
};

export function AgentRuntimeProvider({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  // Create the state ref at the component level
  const currentStateRef = useRef<any>(null);
  
  // Generate session ID once and store it
  const sessionIdRef = useRef<string>('session_' + Math.random().toString(36).substr(2, 9));

  // Use the Chat runtime hook with your existing streaming endpoint
  const runtime = useChatRuntime({
    transport: new AssistantChatTransport({
      api: "/api/chat",
    }),
  });

  useEffect(() => {
    runtime.thread.append({
      role: "system",
      content: [{ type: "text", text: "init" }],
      startRun: true
    })
  }, []);

  return (
    <CurrentStateContext.Provider value={currentStateRef}>
      <AssistantRuntimeProvider runtime={runtime}>
        {children}
      </AssistantRuntimeProvider>
    </CurrentStateContext.Provider>
  );
}