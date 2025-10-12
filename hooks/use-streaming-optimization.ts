"use client";

import { useEffect, useRef, useState } from "react";
import { useAssistantState } from "@assistant-ui/react";

export const useStreamingOptimization = () => {
  const isRunning = useAssistantState(({ thread }) => thread.isRunning);
  const [isStreaming, setIsStreaming] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      setIsStreaming(true);
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    } else {
      // Add a small delay before marking as not streaming
      // to prevent flickering during rapid state changes
      timeoutRef.current = setTimeout(() => {
        setIsStreaming(false);
      }, 100);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isRunning]);

  return {
    isStreaming,
    isRunning,
  };
};
