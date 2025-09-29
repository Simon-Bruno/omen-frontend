"use client";

import React, { useRef, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChevronDown, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface StuckSuggestionsProps {
  className?: string;
}

const SUGGESTIONS = [
  "I’m not sure what to ask. Can you suggest next steps?",
  "Write a prompt I can use to move this forward.",
  "Summarize what’s happening and what you need from me.",
];

export function StuckSuggestions({ className = "" }: StuckSuggestionsProps) {
  const [open, setOpen] = useState(false);
  const typingJobIdRef = useRef(0);

  const handleFillPrompt = async (suggestion: string) => {
    const textarea = document.querySelector<HTMLTextAreaElement>(
      'textarea[aria-label="Message input"]'
    );
    if (textarea) {
      textarea.focus();

      // cancel any in-progress typing job
      typingJobIdRef.current += 1;
      const myJobId = typingJobIdRef.current;

      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        "value"
      )?.set;

      const typeText = async (text: string) => {
        nativeSetter?.call(textarea, "");
        textarea.dispatchEvent(new Event("input", { bubbles: true }));

        // faster dynamic delay to keep total duration reasonable
        const perCharDelay = Math.max(4, Math.min(18, Math.floor(500 / Math.max(1, text.length))));

        let current = "";
        for (let i = 0; i < text.length; i++) {
          // if a new job started, abort this one
          if (typingJobIdRef.current !== myJobId) return;
          current += text[i];
          nativeSetter?.call(textarea, current);
          textarea.dispatchEvent(new Event("input", { bubbles: true }));
          await new Promise((resolve) => setTimeout(resolve, perCharDelay));
        }
      };

      await typeText(suggestion);
    }
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-2"
        aria-expanded={open}
        aria-controls="stuck-suggestions-panel"
      >
        <span className="text-sm font-semibold text-slate-700">Stuck?</span>
        <motion.span
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ type: "tween", duration: 0.2 }}
          className="inline-flex"
        >
          <ChevronRight className="h-4 w-4 text-slate-500" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="stuck-suggestions-panel"
            id="stuck-suggestions-panel"
            className="mt-1 overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <motion.div
              initial={{ y: -4, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -4, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <p className="text-xs text-slate-500 mb-3">
                Click a suggestion to auto-fill the chat bar.
              </p>
              <ul className="space-y-2">
                {SUGGESTIONS.map((suggestion, i) => (
                  <li key={i}>
                    <Alert
                      onClick={() => handleFillPrompt(suggestion)}
                      className="cursor-pointer border-gray-200 bg-white p-3 hover:bg-gray-50"
                      role="button"
                      tabIndex={0}
                    >
                      <AlertDescription className="text-sm text-slate-700">
                        {suggestion}
                      </AlertDescription>
                    </Alert>
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default StuckSuggestions;


