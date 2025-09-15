"use client";

import { Thread } from "@/components/assistant-ui/thread";
import { ChatProvider } from "@/components/chat/ChatProvider";
import { useAuth } from "@/contexts/auth-context";

export const Assistant = () => {
  const { project } = useAuth();
  
  // Use the project ID from auth context, or fallback to a default
  const projectId = project?.id || 'default';

  return (
    <ChatProvider projectId={projectId}>
      <div className="h-full w-full bg-background">
        <Thread />
      </div>
    </ChatProvider>
  );
};
