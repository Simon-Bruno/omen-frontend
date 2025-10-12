"use client";

import { memo, useMemo } from "react";
import { MarkdownTextPrimitive } from "@assistant-ui/react-markdown";
import { StreamingText } from "./streaming-text";
import { cn } from "@/lib/utils";

interface SmoothTextProps {
  text: string;
  className?: string;
  isStreaming?: boolean;
}

export const SmoothText = memo<SmoothTextProps>(({ 
  text, 
  className, 
  isStreaming = false 
}) => {
  // Split text into words for smoother streaming
  const words = useMemo(() => {
    return text.split(/(\s+)/);
  }, [text]);

  if (isStreaming) {
    return (
      <div className={cn("space-y-2", className)}>
        {words.map((word, index) => (
          <StreamingText
            key={index}
            text={word}
            speed={15} // Comfortable reading speed
            className="inline"
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("leading-relaxed", className)}>
      {text}
    </div>
  );
});

SmoothText.displayName = "SmoothText";
