"use client";

import { memo, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface StreamingTextProps {
  text: string;
  className?: string;
  speed?: number; // Characters per second (lower = slower)
  onComplete?: () => void;
}

export const StreamingText = memo<StreamingTextProps>(({ 
  text, 
  className, 
  speed = 12, // Slower default speed for better readability
  onComplete 
}) => {
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
      onComplete?.();
      return;
    }

    const streamText = () => {
      const now = Date.now();
      const timeSinceLastUpdate = now - lastUpdateRef.current;
      
      // Calculate base delay (1000ms / speed = delay per character)
      const baseDelay = 1000 / speed;
      
      // Add some natural variation (±30% randomness)
      const variation = 0.7 + Math.random() * 0.6;
      let delay = baseDelay * variation;
      
      // Longer pauses for punctuation
      const char = text[indexRef.current];
      if (char === '.' || char === '!' || char === '?') {
        delay *= 2.5; // Longer pause after sentences
      } else if (char === ',' || char === ';' || char === ':') {
        delay *= 1.5; // Medium pause after commas
      } else if (char === ' ') {
        delay *= 0.7; // Shorter pause for spaces
      } else if (char === '\n') {
        delay *= 3; // Longer pause for line breaks
      }

      if (timeSinceLastUpdate >= delay && indexRef.current < text.length) {
        setDisplayedText(text.slice(0, indexRef.current + 1));
        indexRef.current++;
        lastUpdateRef.current = now;

        if (indexRef.current >= text.length) {
          setIsComplete(true);
          onComplete?.();
          return;
        }
      }

      // Schedule next update
      timeoutRef.current = setTimeout(streamText, Math.max(10, delay - timeSinceLastUpdate));
    };

    // Start streaming
    streamText();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, speed, onComplete]);

  return (
    <span 
      className={cn(
        "inline-block",
        // Smooth transitions for text changes
        "transition-all duration-75 ease-out",
        // Prevent layout shifts
        "min-h-[1.2em]",
        className
      )}
    >
      {displayedText}
      {!isComplete && (
        <span 
          className={cn(
            "inline-block w-0.5 h-4 bg-current ml-0.5",
            "animate-pulse"
          )}
          aria-hidden="true"
        />
      )}
    </span>
  );
});

StreamingText.displayName = "StreamingText";
