"use client";

import { Thread } from "@/components/assistant-ui/thread";

export const Assistant = () => {
  return (
    <div className="flex h-dvh w-full justify-center bg-background">
      <div className="w-full max-w-3xl overflow-hidden">
        <Thread />
      </div>
    </div>
  );
};
