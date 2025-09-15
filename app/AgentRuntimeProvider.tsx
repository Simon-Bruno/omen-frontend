"use client";

import { useEffect, useRef, createContext, useContext, type ReactNode } from "react";
import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  type ChatModelAdapter,
} from "@assistant-ui/react";

type ChatStep = 'welcome' | 'need_url' | 'awaiting_connection' | 'need_baseline' | 'ready_to_analyze';

// Context for current state
const CurrentStateContext = createContext<any>(null);

export const useCurrentState = () => {
  const context = useContext(CurrentStateContext);
  return context?.current || {};
};

interface Suggestion {
  label: string;
  url?: string;
}

interface AgentResponse {
  text: string;
  suggestions?: Suggestion[];
  oauthUrl?: string;
  nextState: {
    step: ChatStep;
    data: {
      productUrl?: string;
      baselineATC?: number;
      oauthUrl?: string;
      shopDomain?: string;
      // add more fields as needed
    };
  };
}

// Create the adapter as a function that takes the state ref and session ID
const createAgentModelAdapter = (currentStateRef: React.MutableRefObject<any>, sessionIdRef: React.MutableRefObject<string>): ChatModelAdapter => ({
  async run({ messages, abortSignal }) {
    try {
      const result = await fetch("http://localhost:3001/agents/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages,
          currentState: {
            ...currentStateRef.current,
            data: {
              ...currentStateRef.current?.data,
              sessionId: sessionIdRef.current,
            },
          },
        }),
        signal: abortSignal,
      });

      if (!result.ok) {
        throw new Error(`HTTP error! status: ${result.status}`);
      }

      const data: AgentResponse = await result.json();
      console.log("Parsed data:", data);
      
      // Extract OAuth URL from suggestions if present
      let oauthUrl: string | undefined;
      if (data.suggestions && data.suggestions.length > 0) {
        const oauthSuggestion = data.suggestions.find(suggestion => 
          suggestion.url && suggestion.label?.toLowerCase().includes('connect')
        );
        if (oauthSuggestion?.url) {
          oauthUrl = oauthSuggestion.url;
        }
      }
      
      // Get shop domain from the response data (set by backend)
      const shopDomain = data.nextState.data.shopDomain;
      
      // Update state with OAuth URL and shop domain if found
      if (oauthUrl) {
        data.nextState.data.oauthUrl = oauthUrl;
      }
      if (shopDomain) {
        data.nextState.data.shopDomain = shopDomain;
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

      // Add OAuth URL as a clickable link if present
      if (oauthUrl) {
        content.push({
          type: "text",
          text: `\n\n[Connect to Shopify](${oauthUrl})`,
        });
      }

      return {
        content: content as any,
      };
    } catch (error) {
      console.error("Error in AgentModelAdapter:", error);
      
      // Check if it's a network error (backend not running)
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        return {
          content: [
            {
              type: "text",
              text: "🚧 The backend server is not running. Please start the backend server at http://localhost:3001 to use the assistant.",
            },
          ],
        };
      }
      
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
  
  // Generate session ID once and store it
  const sessionIdRef = useRef<string>('session_' + Math.random().toString(36).substr(2, 9));

  // Create the adapter with the state ref
  const adapter = createAgentModelAdapter(currentStateRef, sessionIdRef);

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
    <CurrentStateContext.Provider value={currentStateRef}>
      <AssistantRuntimeProvider runtime={runtime}>
        {children}
      </AssistantRuntimeProvider>
    </CurrentStateContext.Provider>
  );
}