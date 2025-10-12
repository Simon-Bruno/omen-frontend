import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Loader2, TrendingUp, Activity, AlertTriangle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "../ui/button";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export const HypothesesDisplay = (props: any) => {
  const { toolName, argsText, result, status } = props;
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [revealStage, setRevealStage] = useState(0);
  const hasAnimated = useRef(false);
  const isLoading = status.type === "running";
  const isCompleted = status.type === "complete";
  const hasError = status.type === "incomplete";

  // Progressive reveal animation - only run once when component first appears
  useEffect(() => {
    if (isCompleted && result && !hasAnimated.current) {
      hasAnimated.current = true;
      const stages = [
        { delay: 0, stage: 1 },      // Header and title
        { delay: 300, stage: 2 },    // Description
        { delay: 600, stage: 3 },    // Performance metrics
        { delay: 900, stage: 4 },    // Problem and reasoning
        { delay: 1200, stage: 5 },   // Full reveal
      ];

      stages.forEach(({ delay, stage }) => {
        setTimeout(() => setRevealStage(stage), delay);
      });
    } else if (isLoading) {
      setRevealStage(0);
      hasAnimated.current = false;
    }
  }, [isCompleted, isLoading, result]);

  // Handle the different statuses of the tool call
  if (status.type === "running") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <Card data-stage="hypotheses" data-function-call="generate_hypotheses" className="mb-4 mt-4 w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center">
                {/* Refined gradient sparkles icon (consistent with Brand Insights) */}
                <svg
                  className="size-9"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id="hypoSparklesGradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="55%" stopColor="#a78bfa" />
                      <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                    <filter id="hypoSoftGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="0.8" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <g stroke="url(#hypoSparklesGradient)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" filter="url(#hypoSoftGlow)">
                    {/* Baseline */}
                    <path d="M3.5 20.5H20.5" />
                    {/* Bars */}
                    <path d="M7 20.5V13.5" />
                    <path d="M12 20.5V9.5" />
                    <path d="M17 20.5V16.5" />
                  </g>
                </svg>
              </div>
              <CardTitle className="text-3xl">Hypotheses</CardTitle>
            </div>
            <Badge variant="secondary" className="gap-1">
              <Loader2 className="size-3 animate-spin" />
              Loading
            </Badge>
          </div>
          <p className="max-w-3xl text-muted-foreground">Generating hypotheses based on the brand analysis and goals.</p>
        </CardHeader>
      </Card>
      </motion.div>
    );
  }

  if (status.type === "complete" && result) {
    try {
      // Parse the result - it might be a string or already parsed
      const resultData = typeof result === "string" ? JSON.parse(result) : result;
      const parsedData = typeof resultData.hypothesesSchema === "string"
        ? JSON.parse(resultData.hypothesesSchema)
        : resultData.hypothesesSchema;

      const hypotheses = parsedData.hypotheses || [];
      const primaryHypothesis = hypotheses[0];

      return (
        <>
          <Card data-stage="hypotheses" data-function-call="generate_hypotheses" className="mb-4 mt-2 w-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center">
                    {/* Gradient sparkles icon for branding consistency */}
                    <svg
                      className="size-9"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <defs>
                        <linearGradient id="hypoSparklesGradient2" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="55%" stopColor="#a78bfa" />
                          <stop offset="100%" stopColor="#f59e0b" />
                        </linearGradient>
                        <filter id="hypoSoftGlow2" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="0.8" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>
                      <g stroke="url(#hypoSparklesGradient2)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" filter="url(#hypoSoftGlow2)">
                        {/* Baseline */}
                        <path d="M3.5 20.5H20.5" />
                        {/* Bars */}
                        <path d="M7 20.5V13.5" />
                        <path d="M12 20.5V9.5" />
                        <path d="M17 20.5V16.5" />
                      </g>
                    </svg>
                  </div>
                  <CardTitle className="text-3xl">Hypothesis</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                  >
                    {isCollapsed ? <ChevronDownIcon className="size-4" /> : <ChevronUpIcon className="size-4" />}
                  </Button>
                </div>
              </div>
              <motion.div 
                className="max-w-3xl text-muted-foreground"
                initial={{ opacity: 0, y: 10 }}
                animate={{ 
                  opacity: revealStage >= 1 ? 1 : 0, 
                  y: revealStage >= 1 ? 0 : 10 
                }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                {primaryHypothesis ? (
                  <div className="space-y-2">
                    <motion.span 
                      className="text-foreground/90 font-semibold text-lg"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ 
                        opacity: revealStage >= 1 ? 1 : 0, 
                        x: revealStage >= 1 ? 0 : -20 
                      }}
                      transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
                    >
                      {primaryHypothesis.title}
                    </motion.span>
                    <motion.p 
                      className="text-foreground/80"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ 
                        opacity: revealStage >= 2 ? 1 : 0, 
                        y: revealStage >= 2 ? 0 : 10 
                      }}
                      transition={{ duration: 0.4, ease: "easeOut", delay: 0.2 }}
                    >
                      {primaryHypothesis.description}
                    </motion.p>
                  </div>
                ) : (
                  <span className="text-foreground/90">No hypotheses generated.</span>
                )}
              </motion.div>
            </CardHeader>
            <AnimatePresence initial={false} mode="wait">
              {!isCollapsed && (
                <motion.div
                  key="hypothesis-content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: "easeInOut" }}
                  style={{ overflow: "hidden" }}
                >
                  <CardContent className="space-y-6">
                    <motion.div 
                      className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 items-center text-center"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ 
                        opacity: revealStage >= 3 ? 1 : 0, 
                        y: revealStage >= 3 ? 0 : 20 
                      }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    >
                      <motion.div 
                        className="flex flex-col items-center md:px-6 md:border-l md:border-gray-200 first:md:border-l-0"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ 
                          opacity: revealStage >= 3 ? 1 : 0, 
                          scale: revealStage >= 3 ? 1 : 0.9 
                        }}
                        transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
                      >
                        <div className="text-2xl font-semibold leading-none tracking-tight text-slate-900">
                          {primaryHypothesis?.primary_outcome || "Primary outcome"}
                        </div>
                        <div className="mt-2 text-sm text-slate-500">Primary outcome</div>
                      </motion.div>
                      <motion.div 
                        className="flex flex-col items-center md:px-6 md:border-l md:border-gray-200"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ 
                          opacity: revealStage >= 3 ? 1 : 0, 
                          scale: revealStage >= 3 ? 1 : 0.9 
                        }}
                        transition={{ duration: 0.4, ease: "easeOut", delay: 0.2 }}
                      >
                        <div className="text-3xl md:text-4xl font-semibold leading-none tracking-tight text-slate-900">
                          {primaryHypothesis?.baseline_performance ? `${(primaryHypothesis.baseline_performance).toFixed(1)}%` : "N/A"}
                        </div>
                        <div className="mt-2 text-sm text-slate-500">Current performance</div>
                      </motion.div>
                      <motion.div 
                        className="flex flex-col items-center md:px-6 md:border-l md:border-gray-200"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ 
                          opacity: revealStage >= 3 ? 1 : 0, 
                          scale: revealStage >= 3 ? 1 : 0.9 
                        }}
                        transition={{ duration: 0.4, ease: "easeOut", delay: 0.3 }}
                      >
                        <div className="text-3xl md:text-4xl font-semibold leading-none tracking-tight text-green-600">
                          {primaryHypothesis?.predicted_lift_range ? 
                            `+${Math.round(primaryHypothesis.predicted_lift_range.min * 100)}–${Math.round(primaryHypothesis.predicted_lift_range.max * 100)}%` : 
                            "N/A"
                          }
                        </div>
                        <div className="mt-2 text-sm text-slate-500">Expected increase</div>
                      </motion.div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ 
                        opacity: revealStage >= 3 ? 1 : 0, 
                        scale: revealStage >= 3 ? 1 : 0.95 
                      }}
                      transition={{ duration: 0.4, ease: "easeOut", delay: 0.4 }}
                    >
                      <Separator />
                    </motion.div>

                    <motion.div 
                      className="grid grid-cols-1 md:grid-cols-2 gap-6 w-fit mx-auto"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ 
                        opacity: revealStage >= 4 ? 1 : 0, 
                        y: revealStage >= 4 ? 0 : 20 
                      }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    >
                      <motion.div 
                        className="flex flex-col gap-2"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ 
                          opacity: revealStage >= 4 ? 1 : 0, 
                          x: revealStage >= 4 ? 0 : -20 
                        }}
                        transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
                      >
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="size-4 text-rose-600" />
                          <span className="text-sm font-semibold text-slate-800">Current problem</span>
                        </div>
                        <motion.div 
                          className="flex items-center justify-between rounded-md border border-gray-200 bg-rose-50 px-3 py-2"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ 
                            opacity: revealStage >= 4 ? 1 : 0, 
                            scale: revealStage >= 4 ? 1 : 0.95 
                          }}
                          transition={{ duration: 0.3, ease: "easeOut", delay: 0.2 }}
                        >
                          <span className="text-sm text-rose-800">{primaryHypothesis?.current_problem || "No problem identified"}</span>
                        </motion.div>
                      </motion.div>

                      <motion.div 
                        className="flex flex-col gap-2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ 
                          opacity: revealStage >= 4 ? 1 : 0, 
                          x: revealStage >= 4 ? 0 : 20 
                        }}
                        transition={{ duration: 0.4, ease: "easeOut", delay: 0.3 }}
                      >
                        <div className="flex items-center gap-2">
                          <Activity className="size-4 text-emerald-600" />
                          <span className="text-sm font-semibold text-slate-800">Why this experiment should work</span>
                        </div>
                        <motion.ul 
                          className="list-disc pl-5 space-y-1 text-sm text-slate-700"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ 
                            opacity: revealStage >= 4 ? 1 : 0, 
                            y: revealStage >= 4 ? 0 : 10 
                          }}
                          transition={{ duration: 0.4, ease: "easeOut", delay: 0.4 }}
                        >
                          {primaryHypothesis?.why_it_works?.map((reason: { reason: string }, index: number) => (
                            <motion.li 
                              key={index}
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ 
                                opacity: revealStage >= 4 ? 1 : 0, 
                                x: revealStage >= 4 ? 0 : 10 
                              }}
                              transition={{ 
                                duration: 0.3, 
                                ease: "easeOut", 
                                delay: 0.5 + (index * 0.1) 
                              }}
                            >
                              {reason.reason}
                            </motion.li>
                          )) || (
                            <li>No reasons provided for this hypothesis.</li>
                          )}
                        </motion.ul>
                      </motion.div>
                    </motion.div>
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </>
      );
    } catch (e) {
      console.error("Failed to parse hypotheses JSON:", e);
      return (
        <Card data-stage="hypotheses" data-function-call="generate_hypotheses" className="mb-4 mt-2 w-full">
          <CardHeader className="gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-md bg-red-100 text-red-600">
                  <AlertCircle className="size-5" />
                </div>
                <CardTitle className="text-3xl">Hypotheses</CardTitle>
              </div>
              <Badge className="bg-red-600 hover:bg-red-600">Failed</Badge>
            </div>
            <p className="max-w-3xl text-muted-foreground">Error displaying hypotheses. Failed to parse hypotheses data.</p>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-xs bg-red-50 text-red-700 p-3 rounded border border-red-200">
              {typeof result === "string" ? result : JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      );
    }
  }

  // Handle incomplete status (error, abort, timeout, etc.)
  if (status.type === "incomplete") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <Card data-stage="hypotheses" data-function-call="generate_hypotheses" className="mb-4 mt-2 w-full">
        <CardHeader className="gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-md bg-red-100 text-red-600">
                <AlertCircle className="size-5" />
              </div>
              <CardTitle className="text-3xl">Hypotheses</CardTitle>
            </div>
            <Badge className="bg-red-600 hover:bg-red-600">Failed</Badge>
          </div>
          <p className="max-w-3xl text-muted-foreground">Tool call failed: {status.reason || "unknown error"}</p>
        </CardHeader>
        {status.error && (
          <CardContent>
            <pre className="whitespace-pre-wrap text-xs bg-red-50 text-red-700 p-3 rounded border border-red-200">
              {typeof status.error === 'string' ? status.error : JSON.stringify(status.error, null, 2)}
            </pre>
          </CardContent>
        )}
      </Card>
      </motion.div>
    );
  }

  // Fallback for any other states
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Card data-stage="hypotheses" data-function-call="generate_hypotheses" className="mb-4 mt-2 w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center">
              <svg
                className="size-9"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="hypoSparklesGradientIdle" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="55%" stopColor="#a78bfa" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                </defs>
                <g stroke="url(#hypoSparklesGradientIdle)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {/* Baseline */}
                  <path d="M3.5 20.5H20.5" />
                  {/* Bars */}
                  <path d="M7 20.5V13.5" />
                  <path d="M12 20.5V9.5" />
                  <path d="M17 20.5V16.5" />
                </g>
              </svg>
            </div>
            <CardTitle className="text-3xl">Hypotheses</CardTitle>
          </div>
          <Badge variant="secondary">{status.type}</Badge>
        </div>
        <p className="max-w-3xl text-muted-foreground">Awaiting hypotheses generation.</p>
      </CardHeader>
    </Card>
    </motion.div>
  );
};
