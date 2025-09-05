"use client";

import { useEffect, useRef, type ReactNode } from "react";
import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  type ChatModelAdapter,
} from "@assistant-ui/react";

type ChatStep = 'welcome' | 'need_url' | 'awaiting_connection' | 'need_baseline' | 'ready_to_analyze';

interface AgentResponse {
  text: string;
  suggestions?: string[];
  oauthUrl?: string;
  nextState: {
    step: ChatStep;
    data: {
      productUrl?: string;
      baselineATC?: number;
      oauthUrl?: string;
      // add more fields as needed
    };
  };
}

// Create the adapter as a function that takes the state ref
const createAgentModelAdapter = (currentStateRef: React.MutableRefObject<any>): ChatModelAdapter => ({
  async run({ messages, abortSignal }) {
    try {
      const result = await fetch("http://localhost:3001/agents/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages,
          currentState: currentStateRef.current,
        }),
        signal: abortSignal,
      });

      if (!result.ok) {
        throw new Error(`HTTP error! status: ${result.status}`);
      }

      const data: AgentResponse = await result.json();
      console.log("Parsed data:", data);
      
      // Update state with OAuth URL if provided
      if (data.oauthUrl) {
        data.nextState.data.oauthUrl = data.oauthUrl;
      }
      
      currentStateRef.current = data.nextState;
      console.log("Parsed data:", currentStateRef.current);

      if (!data.text) {
        throw new Error("Response missing 'text' field");
      }

      const content: Array<{ type: "text"; text: string }> = [
        {
          type: "text",
          text: data.text,
        },
      ];

      // Add OAuth URL as metadata if present
      if (data.oauthUrl) {
        content.push({
          type: "text",
          text: `__OAUTH_URL__:${data.oauthUrl}`,
        });
      }

      return {
        content: content as any,
      };
    } catch (error) {
      console.error("Error in AgentModelAdapter:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
      };
    }
  },
});


export function AgentRuntimeProvider({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  // Create the state ref at the component level
  const currentStateRef = useRef<any>(null);

  // Create the adapter with the state ref
  const adapter = createAgentModelAdapter(currentStateRef);

  const runtime = useLocalRuntime(adapter, {
    initialMessages: [
    ],
  });

  useEffect(() => {
    runtime.thread.append({
      role: "system",
      content: [{ type: "text", text: "init" }],
      startRun: true
    })
  }, []);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}