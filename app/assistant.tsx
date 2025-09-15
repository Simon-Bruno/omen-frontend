"use client";

import { Thread } from "@/components/assistant-ui/thread";
import { AgentRuntimeProvider } from "./AgentRuntimeProvider";

export const Assistant = () => {
  return (
    <AgentRuntimeProvider>
      <div className="h-full w-full bg-background">
        <Thread />
      </div>
    </AgentRuntimeProvider>
  );
};
