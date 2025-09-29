"use client";

import React from "react";
import { CircleDot, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AlertDescription } from "@/components/ui/alert";
import { StuckSuggestions } from "@/components/assistant-ui/stuck-suggestions";

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
    "Run automated QA checks",
    "Prepare launch checklist",
  ],
  needs = [
    "Confirm brand tone preference",
    "Approve product set for this experiment",
  ],
  timeline = [
    { id: "store", label: "Store connected", status: "done" },
    { id: "brand", label: "Brand analysis", status: "done" },
    { id: "variants", label: "Variant creation", status: "active" },
    { id: "config", label: "Experiment config", status: "pending" },
    { id: "qa", label: "QA checks", status: "pending" },
  ],
  copilotStatus = "thinking",
}: CopilotConsoleProps) {
  return (
    <div className={`h-full p-6 flex flex-col ${className}`}>
      <div className="mb-1 gap-2 flex items-center">
        <h2 className="text-2xl font-semibold text-slate-700">Copilot Console</h2>
        <Badge className={`rounded-full ${copilotTagClasses[copilotStatus]}`}>
          {copilotStatusLabel[copilotStatus]}
        </Badge>
      </div>

      <div className="flex flex-col justify-between gap-6 flex-1 overflow-auto pr-1">
        <section>
            <AlertDescription className="text-sm text-slate-700">
              {now}
            </AlertDescription>
        </section>

        {/* <section>
          <div className="mb-2 flex items-center gap-2">
            <CircleDot className="h-4 w-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700">Next</h3>
          </div>
          <ul className="space-y-2">
            {next.map((n, i) => (
              <li
                key={i}
                className="rounded-md border border-gray-200 bg-white p-3 text-sm text-slate-700"
              >
                {n}
              </li>
            ))}
          </ul>
        </section> */}

        <section>
          <div className="mb-2 flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-700">Timeline</h3>
          </div>
          <ul className="space-y-2">
            {timeline.map((t) => (
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
      </div>

      {/* Stuck? Suggestions */}
      <section className="mt-4 border-t border-gray-200 pt-4">
        <StuckSuggestions />
      </section>
    </div>
  );
}
