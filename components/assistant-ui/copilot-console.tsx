"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CircleDot, CheckCircle2, FlaskConical, Rocket, Sparkles, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AlertDescription } from "@/components/ui/alert";
import { StuckSuggestions } from "@/components/assistant-ui/stuck-suggestions";
import { useAuth } from "@/contexts/auth-context";

type TimelineItem = {
  id: string;
  label: string;
  status: "done" | "active" | "pending";
};

type CopilotStatus = "thinking" | "waiting" | "stuck" | "running" | "idle";

interface CopilotConsoleProps {
  className?: string;
  now?: string;
  next?: string[];
  needs?: string[];
  timeline?: TimelineItem[];
  copilotStatus?: CopilotStatus;
}

const statusIcon = (status: TimelineItem["status"]) => {
  switch (status) {
    case "done":
      return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
    case "active":
      return (
        <span className="inline-block h-4 w-4 rounded-full border border-blue-500 bg-blue-500/20" />
      );
    case "pending":
    default:
      return <CircleDot className="h-4 w-4 text-slate-300" />;
  }
};

const copilotStatusLabel: Record<CopilotStatus, string> = {
  thinking: "Thinking",
  waiting: "Waiting for you",
  stuck: "Stuck",
  running: "Working",
  idle: "Idle",
};

const copilotTagClasses: Record<CopilotStatus, string> = {
  thinking: "bg-blue-100 text-blue-700 border-blue-200",
  waiting: "bg-amber-50 text-amber-700 border-amber-200",
  stuck: "bg-rose-50 text-rose-700 border-rose-200",
  running: "bg-blue-50 text-blue-700 border-blue-200",
  idle: "bg-gray-50 text-gray-600 border-gray-200",
};

export function CopilotConsole({
  className = "",
  now = "We're currently working on creating test variants tailored to your brand and traffic.",
  next = [
    "Configure experiment traffic and targeting",
    "Prepare launch checklist",
  ],
  needs = [
    "Confirm brand tone preference",
    "Approve product set for this experiment",
  ],
  timeline = [],
  copilotStatus = "thinking",
}: CopilotConsoleProps) {
  const { user } = useAuth();
  // Track availability of checkpoints by detecting presence of corresponding sections in the thread viewport
  const [availableStages, setAvailableStages] = useState<Record<string, boolean>>({
    brand: false,
    hypotheses: false,
    variants: false,
    launch: false,
  });


  // Compute timeline dynamically based on available stages
  const computedTimeline = useMemo(() => {
    const timelineItems: TimelineItem[] = [
      { id: "store", label: "Store connected", status: "done" }, // Always done if user is authenticated
      { id: "brand", label: "Brand analysis", status: availableStages.brand ? "done" : "pending" },
      { id: "hypotheses", label: "Hypothesis generation", status: availableStages.hypotheses ? "done" : "pending" },
      { id: "variants", label: "Variant creation", status: availableStages.variants ? "done" : "pending" },
      { id: "config", label: "Experiment config", status: availableStages.launch ? "done" : "pending" },
    ];

    // Find the first pending stage and mark it as active
    const firstPendingIndex = timelineItems.findIndex(item => item.status === "pending");
    if (firstPendingIndex !== -1) {
      timelineItems[firstPendingIndex] = { ...timelineItems[firstPendingIndex], status: "active" };
    }

    return timelineItems;
  }, [availableStages]);


  // Simple list of checkpoints (2x2 grid)
  const checkpoints = useMemo(
    () => [
      { id: "brand", label: "Brand analysis", icon: Sparkles },
      { id: "hypotheses", label: "Hypotheses", icon: FlaskConical },
      { id: "variants", label: "Variants", icon: Layers },
      { id: "launch", label: "Launch", icon: Rocket },
    ],
    []
  );

  useEffect(() => {
    // Determine availability by checking for elements with matching data-stage attributes
    const computeAvailability = () => {
      const hasBrandCard = !!document.querySelector('[data-stage="brand-analysis"]');
      const hasHypothesesCard = !!document.querySelector('[data-stage="hypotheses"]');
      const hasVariantsCard = !!document.querySelector('[data-stage="variants"]');
      const hasLaunchCard = !!document.querySelector('[data-stage="launch"]');

      setAvailableStages({
        brand: hasBrandCard,
        hypotheses: hasHypothesesCard,
        variants: hasVariantsCard,
        launch: hasLaunchCard,
      });
    };

    computeAvailability();

    // Function to attach an observer once the viewport exists
    const attachViewportObserver = () => {
      const viewport = document.querySelector('[data-aui="thread-viewport"]');
      if (!viewport) return null;
      const observer = new MutationObserver(() => {
        computeAvailability();
      });
      observer.observe(viewport, { childList: true, subtree: true });
      return observer;
    };

    // Try immediately, then retry a few times if the viewport hasn't mounted yet
    let observer: MutationObserver | null = attachViewportObserver();
    let retries = 0;
    const maxRetries = 20; // ~4s with 200ms interval
    const retryInterval = 200;
    const intervalId = observer
      ? null
      : window.setInterval(() => {
          if (!observer) {
            observer = attachViewportObserver();
            computeAvailability();
            retries += 1;
            if (observer || retries >= maxRetries) {
              if (intervalId) window.clearInterval(intervalId);
            }
          }
        }, retryInterval);

    // Also recompute on visibility change (e.g., when switching tabs)
    const onVisibilityChange = () => computeAvailability();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      if (observer) observer.disconnect();
      if (intervalId) window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);


  const scrollToStage = (id: string) => {
    let selector = "";
    switch (id) {
      case "brand":
        selector = '[data-stage="brand-analysis"]';
        break;
      case "hypotheses":
        selector = '[data-stage="hypotheses"]';
        break;
      case "variants":
        selector = '[data-stage="variants"]';
        break;
      case "launch":
        selector = '[data-stage="launch"]';
        break;
      default:
        return;
    }
    
    // Find the target element
    const el = document.querySelector(selector) as HTMLElement | null;
    if (!el) return;
    
    // Find the chat container's scrollable viewport
    const chatViewport = document.querySelector('[data-aui="thread-viewport"]') as HTMLElement | null;
    if (!chatViewport) return;
    
    // Calculate the position of the target element relative to the viewport
    const viewportRect = chatViewport.getBoundingClientRect();
    const elementRect = el.getBoundingClientRect();
    
    // Calculate the scroll position needed to center the element in the viewport
    const elementTop = elementRect.top - viewportRect.top + chatViewport.scrollTop;
    const elementHeight = elementRect.height;
    const viewportHeight = chatViewport.clientHeight;
    
    // Center the element in the viewport
    const scrollTop = elementTop - (viewportHeight / 2) + (elementHeight / 2);
    
    // Smooth scroll within the chat container
    chatViewport.scrollTo({
      top: scrollTop,
      behavior: 'smooth'
    });
  };

  return (
    <div className={`h-full p-6 flex flex-col ${className}`}>
      <div className="mb-1 gap-2 flex items-center">
        <h2 className="text-2xl font-semibold text-slate-700">Copilot Console</h2>
        <Badge className={`rounded-full ${copilotTagClasses[copilotStatus]}`}>
          {copilotStatusLabel[copilotStatus]}
        </Badge>
      </div>

      <div className="flex flex-col justify-between gap-6 flex-1 overflow-auto pr-1">
        {/* Top section */}
        <section>
            <AlertDescription className="text-sm text-slate-700">
              {now}
            </AlertDescription>
        </section>

        {/* Bottom wrapper: Checkpoints + Timeline + Stuck */}
        <div className="flex flex-col gap-6">
          {/* Checkpoints */}
          <section>
            <div className="mb-2 flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-700">Checkpoints</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {checkpoints.map(({ id, label, icon: Icon }) => {
                const isAvailable = availableStages[id];
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => isAvailable && scrollToStage(id)}
                    className={
                      "flex items-center gap-2 rounded-md border p-2 text-left text-sm transition " +
                      (isAvailable
                        ? "border-gray-200 bg-white hover:bg-slate-50 text-slate-800"
                        : "border-gray-100 bg-slate-50 text-slate-400 cursor-not-allowed")
                    }
                    aria-disabled={!isAvailable}
                  >
                    <Icon className={"h-4 w-4 " + (isAvailable ? "text-slate-700" : "text-slate-300")} />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Timeline */}
          <section>
            <div className="mb-2 flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-700">Timeline</h3>
            </div>
            <ul className="space-y-2">
              {computedTimeline.map((t) => (
                <li key={t.id} className="flex items-center gap-2 text-sm">
                  {statusIcon(t.status)}
                  <span
                    className={
                      t.status === "done"
                        ? "text-slate-700"
                        : t.status === "active"
                        ? "text-slate-900"
                        : "text-slate-400"
                    }
                  >
                    {t.label}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Stuck? Suggestions */}
          <section className="border-t border-gray-200 pt-4">
            <StuckSuggestions />
          </section>
        </div>
      </div>
    </div>
  );
}
