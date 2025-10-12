"use client";

import { useEffect, useRef, useState } from "react";

interface UseThrottledStreamingOptions {
  throttleMs?: number; // Minimum time between updates
  maxChunkSize?: number; // Maximum characters to add at once
}

export const useThrottledStreaming = (
  text: string,
  options: UseThrottledStreamingOptions = {}
) => {
  const { throttleMs = 100, maxChunkSize = 3 } = options;
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const indexRef = useRef(0);
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    // Reset state when text changes
    setDisplayedText("");
    setIsComplete(false);
    indexRef.current = 0;
    lastUpdateRef.current = 0;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (!text) {
      setIsComplete(true);
      return;
    }

    const streamText = () => {
      const now = Date.now();
      const timeSinceLastUpdate = now - lastUpdateRef.current;

      if (timeSinceLastUpdate >= throttleMs && indexRef.current < text.length) {
        // Calculate how many characters to add (up to maxChunkSize)
        const remainingChars = text.length - indexRef.current;
        const charsToAdd = Math.min(maxChunkSize, remainingChars);
        
        setDisplayedText(text.slice(0, indexRef.current + charsToAdd));
        indexRef.current += charsToAdd;
        lastUpdateRef.current = now;

        if (indexRef.current >= text.length) {
          setIsComplete(true);
          return;
        }
      }

      // Schedule next update
      timeoutRef.current = setTimeout(streamText, throttleMs);
    };

    // Start streaming
    streamText();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, throttleMs, maxChunkSize]);

  return {
    displayedText,
    isComplete,
    progress: text.length > 0 ? (indexRef.current / text.length) * 100 : 0,
  };
};
