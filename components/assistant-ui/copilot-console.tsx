"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  CircleDot,
  CheckCircle2,
  FlaskConical,
  Rocket,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AlertDescription } from "@/components/ui/alert";
import { StuckSuggestions } from "@/components/assistant-ui/stuck-suggestions";
import { useAuth } from "@/contexts/auth-context";
import { ComposedChart, Line, Area, ResponsiveContainer, YAxis } from "recharts";
import { AnimatePresence, motion } from "framer-motion";

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

const generateVisitorData = () => {
  const data = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const baseVisitors = 2500;
    const variance = Math.sin(i / 4) * 40 + Math.random() * 30;
    data.push({
      date: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      visitors: Math.round(baseVisitors + variance),
    });
  }
  return data;
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
  const visitorData = useMemo(() => generateVisitorData(), []);

  // Track availability of checkpoints by detecting presence of corresponding sections in the thread viewport
  const [availableStages, setAvailableStages] = useState<
    Record<string, boolean>
  >({
    brand: false,
    hypotheses: false,
    variants: false,
    launch: false,
    launched: false,
  });

  // Compute timeline dynamically based on available stages
  const computedTimeline = useMemo(() => {
    const timelineItems: TimelineItem[] = [
      { id: "store", label: "Store connection", status: "done" }, // Always done if user is authenticated
      {
        id: "brand",
        label: "Brand analysis",
        status: availableStages.brand ? "done" : "pending",
      },
      {
        id: "hypotheses",
        label: "Hypothesis generation",
        status: availableStages.hypotheses ? "done" : "pending",
      },
      {
        id: "variants",
        label: "Variant creation",
        status: availableStages.variants ? "done" : "pending",
      },
      {
        id: "config",
        label: "Experiment configuration",
        status: availableStages.launch ? "done" : "pending",
      },
      {
        id: "launched",
        label: "Experiment launch",
        status: availableStages.launched ? "done" : "pending",
      },
    ];

    // Find the first pending stage and mark it as active
    const firstPendingIndex = timelineItems.findIndex(
      (item) => item.status === "pending"
    );
    if (firstPendingIndex !== -1) {
      timelineItems[firstPendingIndex] = {
        ...timelineItems[firstPendingIndex],
        status: "active",
      };
    }

    return timelineItems;
  }, [availableStages]);

  // Collapsible Timeline state
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);

  const activeIndex = useMemo(() => {
    return computedTimeline.findIndex((item) => item.status === "active");
  }, [computedTimeline]);

  const previewItems = useMemo(() => {
    if (computedTimeline.length === 0) return [] as TimelineItem[];
    const prev = activeIndex > 0 ? computedTimeline[activeIndex - 1] : undefined;
    const curr = activeIndex >= 0 ? computedTimeline[activeIndex] : computedTimeline[0];
    const next = activeIndex >= 0 && activeIndex < computedTimeline.length - 1 ? computedTimeline[activeIndex + 1] : undefined;
    return [prev, curr, next].filter(Boolean) as TimelineItem[];
  }, [computedTimeline, activeIndex]);

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
      const hasBrandCard = !!document.querySelector(
        '[data-stage="brand-analysis"]'
      );
      const hasHypothesesCard = !!document.querySelector(
        '[data-stage="hypotheses"]'
      );
      const hasVariantsCard = !!document.querySelector(
        '[data-stage="variants"]'
      );
      const hasLaunchCard =
        !!document.querySelector('[data-stage="experiment-preview"]') ||
        !!document.querySelector('[data-function-call="preview_experiment"]');
      const hasLaunchedCard =
        !!document.querySelector('[data-stage="experiment-launched"]') ||
        !!document.querySelector('[data-function-call="launch_experiment"]') ||
        !!document.querySelector('[data-function-call="create_experiment"]');

      setAvailableStages({
        brand: hasBrandCard,
        hypotheses: hasHypothesesCard,
        variants: hasVariantsCard,
        launch: hasLaunchCard,
        launched: hasLaunchedCard,
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
        selector =
          '[data-stage="experiment-preview"], [data-function-call="preview_experiment"]';
        break;
      case "launched":
        selector =
          '[data-stage="experiment-launched"], [data-function-call="launch_experiment"]';
        break;
      default:
        return;
    }

    // Find the target element
    const el = document.querySelector(selector) as HTMLElement | null;
    if (!el) return;

    // Find the chat container's scrollable viewport
    const chatViewport = document.querySelector(
      '[data-aui="thread-viewport"]'
    ) as HTMLElement | null;
    if (!chatViewport) return;

    // Calculate the position of the target element relative to the viewport
    const viewportRect = chatViewport.getBoundingClientRect();
    const elementRect = el.getBoundingClientRect();

    // Calculate the scroll position needed to center the element in the viewport
    const elementTop =
      elementRect.top - viewportRect.top + chatViewport.scrollTop;
    const elementHeight = elementRect.height;
    const viewportHeight = chatViewport.clientHeight;

    // Center the element in the viewport
    const scrollTop = elementTop - viewportHeight / 2 + elementHeight / 2;

    // Smooth scroll within the chat container
    chatViewport.scrollTo({
      top: scrollTop,
      behavior: "smooth",
    });
  };

  return (
    <div className={`h-full p-6 flex flex-col ${className}`}>
      <div className="mb-1 gap-2 flex items-center">
        <h2 className="text-2xl font-semibold text-slate-700">
          Copilot Console
        </h2>
        {/* <Badge className={`rounded-full ${copilotTagClasses[copilotStatus]}`}>
          {copilotStatusLabel[copilotStatus]}
        </Badge> */}
      </div>

      <motion.div layout className="flex flex-col justify-between gap-6 flex-1 overflow-hidden pr-1" transition={{ duration: 0.25, ease: "easeOut" }}>
        {/* Top section: Checkpoints + Timeline */}
        <div className="flex flex-col gap-6">
          {/* <AlertDescription className="text-sm text-slate-700">
            {now}
          </AlertDescription> */}

          {/* Checkpoints */}
          <section>
            <div className="mb-2 flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-700">
                Checkpoints
              </h3>
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
                    <Icon
                      className={
                        "h-4 w-4 " +
                        (isAvailable ? "text-slate-700" : "text-slate-300")
                      }
                    />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Timeline */}
          <motion.section layout transition={{ duration: 0.25, ease: "easeOut" }}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-700">Timeline</h3>
              <button
                type="button"
                onClick={() => setIsTimelineOpen((v) => !v)}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
                aria-expanded={isTimelineOpen}
                aria-controls="copilot-timeline"
              >
                <span className="hidden sm:inline">{isTimelineOpen ? "Collapse" : "Expand"}</span>
                {isTimelineOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Stable container for a11y control; switches between collapsed/expanded */}
            <motion.div id="copilot-timeline" layout className="relative" initial={false}>
              <AnimatePresence initial={false} mode="wait">
                {!isTimelineOpen ? (
                  <motion.ul
                    key="collapsed"
                    layout
                    className="space-y-1"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                  >
                    {(() => {
                      const centerIndex = previewItems.findIndex((p) => p.status === "active");
                      return previewItems.map((t, i) => {
                        const distance = centerIndex === -1 ? 0 : Math.abs(i - centerIndex);
                        const opacity = Math.max(1 - distance * 0.35, 0.2);
                        return (
                          <motion.li layout key={t.id} className="flex items-center gap-2 text-sm" style={{ opacity }}>
                            {statusIcon(t.status)}
                            <span
                              className={
                                t.status === "active"
                                  ? "text-slate-900"
                                  : t.status === "done"
                                  ? "text-slate-700"
                                  : "text-slate-400"
                              }
                            >
                              {t.label}
                            </span>
                          </motion.li>
                        );
                      });
                    })()}
                  </motion.ul>
                ) : (
                  <motion.div
                    key="expanded"
                    layout
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <motion.ul layout className="space-y-2 pt-1">
                      {computedTimeline.map((t, idx) => (
                        <motion.li
                          key={t.id}
                          layout
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.02 * idx, duration: 0.18 }}
                          className="flex items-center gap-2 text-sm"
                        >
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
                        </motion.li>
                      ))}
                    </motion.ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.section>
        </div>

        {/* Bottom section: Analytics + Stuck */}
        <div className="flex flex-col gap-6">
          {/* Analytics: Visitors Graph + Stats */}
          <section className="space-y-4">
            {/* Visitors Graph */}
            <div>
              <div className="mb-4">
                <div className="text-3xl font-semibold text-slate-900">
                  {visitorData
                    .reduce((sum, d) => sum + d.visitors, 0)
                    .toLocaleString()}
                </div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">
                  Visitors (Past 30 Days)
                </h3>
                <div className="flex items-center gap-1 text-sm text-emerald-600 mt-1">
                  <span>↑ 15%</span>
                  <span className="text-slate-500">from last month</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={100}>
                <ComposedChart data={visitorData}>
                  <defs>
                    <linearGradient id="visitorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <YAxis hide domain={["dataMin - 10", "dataMax + 10"]} />
                  <Area
                    type="monotone"
                    dataKey="visitors"
                    stroke="none"
                    fill="url(#visitorGradient)"
                    animationDuration={1000}
                  />
                  <Line
                    type="monotone"
                    dataKey="visitors"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    animationDuration={1000}
                  />
                </ComposedChart>
              </ResponsiveContainer>
              <div className="flex justify-between mt-2 text-xs text-slate-400">
                <span>{visitorData[0]?.date}</span>
                <span>{visitorData[visitorData.length - 1]?.date}</span>
              </div>
            </div>

            {/* Conversion Rate & Revenue */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              {/* Conversion Rate */}
              <div>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-semibold text-slate-900">3.2%</span>
                  <span className="text-sm text-emerald-600 pb-1">↑ 12%</span>
                </div>
                <h3 className="text-sm font-semibold text-slate-700">
                  Purchase Rate
                </h3>
              </div>

              {/* Revenue */}
              <div>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-semibold text-slate-900">$1.32</span>
                  <span className="text-sm text-emerald-600 pb-1">↑ 18%</span>
                </div>
                <h3 className="text-sm font-semibold text-slate-700">
                  Revenue per session
                </h3>
              </div>
            </div>
          </section>

          {/* Stuck */}
          <section className="border-t border-gray-200 pt-4">
            <StuckSuggestions />
          </section>
        </div>
      </motion.div>
    </div>
  );
}
