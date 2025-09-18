"use client";

import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { Thread } from "@/components/assistant-ui/thread";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { AssistantChatTransport } from "@assistant-ui/react-ai-sdk";
import { useEffect, useRef } from "react";

export const Assistant = () => {
  const runtime = useChatRuntime({
    transport: new AssistantChatTransport({
      api: "/api/chat",
    }),
  });

  const hasAutoMessageSent = useRef(false);

  // Auto-send a message when the component loads (only once)
  useEffect(() => {
    if (!hasAutoMessageSent.current) {
      hasAutoMessageSent.current = true;
      runtime.thread.append({
        role: "user",
        content: [{ type: "text", text: "Hello! What experiments do you think can help me improve my store?" }],
        startRun: true
      });
    }
  }, [runtime.thread]);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="h-full w-full bg-background flex flex-col overflow-hidden">
        <div className="flex-1 min-h-0">
          <Thread />
        </div>
      </div>
    </AssistantRuntimeProvider>
  );
};
