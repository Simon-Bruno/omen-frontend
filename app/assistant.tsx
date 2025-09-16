"use client";

import { Thread } from "@/components/assistant-ui/thread";
import { ChatProvider } from "@/components/chat/ChatProvider";
import { SessionControls } from "@/components/chat/session-controls";
import { useAuth } from "@/contexts/auth-context";

export const Assistant = () => {
  const { project } = useAuth();
  
  // Use the project ID from auth context, or fallback to a default
  const projectId = project?.id || 'default';

  return (
    <ChatProvider projectId={projectId}>
      <div className="h-full w-full bg-background flex flex-col overflow-hidden">
        <SessionControls />
        <div className="flex-1 min-h-0">
          <Thread />
        </div>
      </div>
    </ChatProvider>
  );
};
