import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "../ui/button";
import {
  Sparkles,
  CheckCircle,
  ChevronRight,
  Target,
  TrendingUp,
  BarChart3,
  Clock,
  Zap,
  AlertTriangle,
  Activity,
  ChevronDownIcon,
  ChevronUpIcon,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

export const ExperimentPreviewDisplay = (props: any) => {
  const { toolName, argsText, result, status } = props;

  const [experimentData, setExperimentData] = useState<any>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [revealStage, setRevealStage] = useState(0);
  const hasAnimated = useRef(false);
  const isLoading = status.type === "running";
  const isCompleted = status.type === "complete";
  const hasError = status.type === "incomplete";

  // Parse the result when it's available
  useEffect(() => {
    if (status.type === "complete" && result) {
      try {
        const resultData =
          typeof result === "string" ? JSON.parse(result) : result;
        setExperimentData(resultData);
      } catch (e) {
        console.error("Failed to parse experiment preview result:", e);
      }
    }
  }, [status, result]);

  // Progressive reveal animation - only run once when component first appears
  useEffect(() => {
    if (isCompleted && experimentData && !hasAnimated.current) {
      hasAnimated.current = true;
      const stages = [
        { delay: 0, stage: 1 },      // Header and description
        { delay: 300, stage: 2 },    // Hypothesis and metrics
        { delay: 600, stage: 3 },    // Variants section
        { delay: 900, stage: 4 },    // Configuration and next steps
      ];

      stages.forEach(({ delay, stage }) => {
        setTimeout(() => setRevealStage(stage), delay);
      });
    } else if (isLoading) {
      setRevealStage(0);
      hasAnimated.current = false;
    }
  }, [isCompleted, isLoading, experimentData]);

  // Handle function call running state
  if (status.type === "running") {
    return (
      <div
        data-stage="experiment-preview"
        className="mb-4 flex w-full flex-col gap-3 rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 py-4"
      >
        <div className="flex items-center gap-3 px-4">
          <div className="relative">
            <Sparkles className="size-5 animate-pulse text-blue-600" />
            <div className="absolute inset-0 animate-ping">
              <Sparkles className="size-5 text-blue-400 opacity-75" />
            </div>
          </div>
          <div>
            <p className="text-blue-800 font-medium">
              Generating experiment preview...
            </p>
            <p className="text-blue-600 text-sm">
              Analyzing experiment configuration and variants
            </p>
          </div>
        </div>
        <div className="px-4">
          <div className="flex space-x-1">
            <div
              className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            ></div>
            <div
              className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            ></div>
            <div
              className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  // Handle function call incomplete state
  if (status.type === "incomplete") {
    return (
      <div
        data-stage="experiment-preview"
        className="mb-4 flex w-full flex-col gap-3 rounded-lg border border-red-200 bg-red-50 py-3"
      >
        <div className="flex items-center gap-2 px-4">
          <Target className="size-4 text-red-600" />
          <p className="text-red-800 font-medium">
            Experiment preview failed: {status.reason || "unknown error"}
          </p>
        </div>
        {status.error && (
          <div className="px-4 text-sm text-red-700">
            <pre className="whitespace-pre-wrap text-xs bg-red-100 p-2 rounded">
              {typeof status.error === "string"
                ? status.error
                : JSON.stringify(status.error, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  }

  // Handle completed state with experiment data
  if (status.type === "complete" && experimentData) {
    const {
      experimentName,
      hypothesis,
      variantCount,
      variants,
      primaryOutcome,
      baselinePerformance,
      expectedUplift,
      trafficSplit,
      runningTime,
      conflictCheck,
    } = experimentData;

    return (
      <Card data-stage="experiment-preview" className="mb-4 mt-2 w-full">
        <CardHeader className="">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center">
                {/* Gradient sparkles icon (consistent with other displays) */}
                <svg
                  className="size-9"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient
                      id="experimentSparklesGradient"
                      x1="2"
                      y1="2"
                      x2="22"
                      y2="22"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="55%" stopColor="#a78bfa" />
                      <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                    <filter
                      id="experimentSoftGlow"
                      x="-20%"
                      y="-20%"
                      width="140%"
                      height="140%"
                    >
                      <feGaussianBlur stdDeviation="0.8" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <g
                    stroke="url(#experimentSparklesGradient)"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#experimentSoftGlow)"
                  >
                    <path d="M12 2.75V7.5M12 16.5v4.75M2.75 12H7.5M16.5 12h4.75" />
                    <path d="M5.5 5.5l3.2 3.2M15.3 15.3l3.2 3.2M18.5 5.5l-3.2 3.2M8.7 15.3l-3.2 3.2" />
                  </g>
                  <g
                    stroke="url(#experimentSparklesGradient)"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.9"
                  >
                    <path d="M6 4.75V6.5M5.25 5.25H7" />
                    <path d="M17.5 17.25V19M16.75 18H18.5" />
                  </g>
                </svg>
              </div>
              <CardTitle className="text-3xl">Experiment Preview</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-600 hover:bg-blue-600">Ready</Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
                aria-label={isCollapsed ? "Expand experiment preview" : "Collapse experiment preview"}
              >
                {isCollapsed ? <ChevronDownIcon className="size-4" /> : <ChevronUpIcon className="size-4" />}
              </Button>
            </div>
          </div>

          <motion.p 
            className="max-w-3xl text-muted-foreground"
            initial={{ opacity: 0, y: 10 }}
            animate={{ 
              opacity: revealStage >= 1 ? 1 : 0, 
              y: revealStage >= 1 ? 0 : 10 
            }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <span className="text-foreground/90">
              Your experiment configuration is ready, double check all the details below before launching the experiment.
            </span>
          </motion.p>
        </CardHeader>

        <AnimatePresence initial={false} mode="wait">
          {!isCollapsed && (
            <motion.div
              key="experiment-content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: "easeInOut" }}
              style={{ overflow: "hidden" }}
            >
              <CardContent className="space-y-4">

                {hypothesis && (
                  <motion.div 
                    className="max-w-3xl mb-5"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ 
                      opacity: revealStage >= 2 ? 1 : 0, 
                      y: revealStage >= 2 ? 0 : 20 
                    }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  >
                    <motion.div 
                      className="space-y-1"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ 
                        opacity: revealStage >= 2 ? 1 : 0, 
                        x: revealStage >= 2 ? 0 : -20 
                      }}
                      transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
                    >
                      <div className="flex items-center gap-2">
                        <BarChart3 className="size-5 text-blue-600" />
                        <span className="text-foreground/90 font-semibold text-lg">
                          Hypothesis:
                        </span>
                        <span className="text-foreground/90 font-semibold text-lg">
                          {hypothesis.title}
                        </span>
                      </div>
                      <p className="text-foreground/80">{hypothesis.description}</p>
                    </motion.div>

                    {/* Summary metrics under hypothesis (mirrors hypotheses display) */}
                    <motion.div 
                      className="mt-4 mb-6"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ 
                        opacity: revealStage >= 2 ? 1 : 0, 
                        y: revealStage >= 2 ? 0 : 20 
                      }}
                      transition={{ duration: 0.4, ease: "easeOut", delay: 0.2 }}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 items-center text-center">
                        <motion.div 
                          className="flex flex-col items-center md:px-6 md:border-l md:border-gray-200 first:md:border-l-0"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ 
                            opacity: revealStage >= 2 ? 1 : 0, 
                            scale: revealStage >= 2 ? 1 : 0.9 
                          }}
                          transition={{ duration: 0.3, ease: "easeOut", delay: 0.3 }}
                        >
                          <div className="text-2xl font-semibold leading-none tracking-tight text-slate-900">
                            {hypothesis?.primary_outcome || "Primary outcome"}
                          </div>
                          <div className="mt-2 text-sm text-slate-500">
                            Primary outcome
                          </div>
                        </motion.div>
                        <motion.div 
                          className="flex flex-col items-center md:px-6 md:border-l md:border-gray-200"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ 
                            opacity: revealStage >= 2 ? 1 : 0, 
                            scale: revealStage >= 2 ? 1 : 0.9 
                          }}
                          transition={{ duration: 0.3, ease: "easeOut", delay: 0.4 }}
                        >
                          <div className="text-3xl md:text-4xl font-semibold leading-none tracking-tight text-slate-900">
                            {typeof baselinePerformance === "number"
                              ? `${baselinePerformance.toFixed(1)}%`
                              : "N/A"}
                          </div>
                          <div className="mt-2 text-sm text-slate-500">
                            Current performance
                          </div>
                        </motion.div>
                        <motion.div 
                          className="flex flex-col items-center md:px-6 md:border-l md:border-gray-200"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ 
                            opacity: revealStage >= 2 ? 1 : 0, 
                            scale: revealStage >= 2 ? 1 : 0.9 
                          }}
                          transition={{ duration: 0.3, ease: "easeOut", delay: 0.5 }}
                        >
                          <div className="text-3xl md:text-4xl font-semibold leading-none tracking-tight text-green-600">
                            {expectedUplift?.min != null &&
                            expectedUplift?.max != null
                              ? `+${Math.round(
                                  expectedUplift.min * 100
                                )}–${Math.round(expectedUplift.max * 100)}%`
                              : "N/A"}
                          </div>
                          <div className="mt-2 text-sm text-slate-500">
                            Expected increase
                          </div>
                        </motion.div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ 
                        opacity: revealStage >= 2 ? 1 : 0
                      }}
                      transition={{ duration: 0.3, ease: "easeOut", delay: 0.6 }}
                    >
                      <Separator />
                    </motion.div>
                  </motion.div>
                )}

                {/* Variants Section */}
                {variants && variants.length > 0 && (
                  <motion.div 
                    className="mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ 
                      opacity: revealStage >= 3 ? 1 : 0, 
                      y: revealStage >= 3 ? 0 : 20 
                    }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  >
                    <motion.div 
                      className="flex items-center gap-2 mb-3"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ 
                        opacity: revealStage >= 3 ? 1 : 0, 
                        x: revealStage >= 3 ? 0 : -20 
                      }}
                      transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
                    >
                      <BarChart3 className="size-5 text-purple-600" />
                      <h4 className="text-lg font-semibold text-gray-900">
                        Variants ({variantCount || variants.length})
                      </h4>
                    </motion.div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                      {variants.map((variant: any, index: number) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20, scale: 0.95 }}
                          animate={{ 
                            opacity: revealStage >= 3 ? 1 : 0, 
                            y: revealStage >= 3 ? 0 : 20,
                            scale: revealStage >= 3 ? 1 : 0.95
                          }}
                          transition={{ 
                            duration: 0.4, 
                            ease: "easeOut", 
                            delay: 0.2 + (index * 0.1) 
                          }}
                        >
                          <Card className="h-full">
                            <div className="p-4">
                              <div className="mb-1">
                                <h5 className="font-semibold text-gray-900 text-sm">
                                  Variant {index + 1}
                                </h5>
                              </div>
                              <p className="text-sm text-gray-600">{variant.label}</p>
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Experiment Configuration */}
                <motion.div 
                  className="mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: revealStage >= 4 ? 1 : 0, 
                    y: revealStage >= 4 ? 0 : 20 
                  }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <motion.div 
                    className="flex items-center gap-2 mb-3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ 
                      opacity: revealStage >= 4 ? 1 : 0, 
                      x: revealStage >= 4 ? 0 : -20 
                    }}
                    transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
                  >
                    <Clock className="size-5 text-indigo-600" />
                    <h4 className="text-lg font-semibold text-gray-900">
                      Experiment Configuration
                    </h4>
                  </motion.div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { label: "Traffic Split", value: trafficSplit },
                      { label: "Running Time", value: runningTime },
                      { label: "Conflict Check", value: conflictCheck }
                    ].map((config, index) => (
                      <motion.div
                        key={config.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ 
                          opacity: revealStage >= 4 ? 1 : 0, 
                          y: revealStage >= 4 ? 0 : 10 
                        }}
                        transition={{ 
                          duration: 0.3, 
                          ease: "easeOut", 
                          delay: 0.2 + (index * 0.1) 
                        }}
                      >
                        <p className="text-xs font-medium text-gray-500 mb-1">{config.label}</p>
                        <p className="text-sm text-gray-700">{config.value}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Next Steps */}
                <motion.div 
                  className="bg-emerald-50 rounded-lg p-4 border border-emerald-200"
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ 
                    opacity: revealStage >= 4 ? 1 : 0, 
                    y: revealStage >= 4 ? 0 : 10,
                    scale: revealStage >= 4 ? 1 : 0.98
                  }}
                  transition={{ duration: 0.4, ease: "easeOut", delay: 0.5 }}
                >
                  <motion.div 
                    className="flex items-center gap-2 mb-2"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ 
                      opacity: revealStage >= 4 ? 1 : 0, 
                      x: revealStage >= 4 ? 0 : -10 
                    }}
                    transition={{ duration: 0.3, ease: "easeOut", delay: 0.6 }}
                  >
                    <CheckCircle className="size-5 text-emerald-600" />
                    <h4 className="font-semibold text-emerald-800">Ready to Launch</h4>
                  </motion.div>
                  <motion.p 
                    className="text-emerald-700 text-sm"
                    initial={{ opacity: 0 }}
                    animate={{ 
                      opacity: revealStage >= 4 ? 1 : 0
                    }}
                    transition={{ duration: 0.3, ease: "easeOut", delay: 0.7 }}
                  >
                    This experiment is configured and ready to be created. Once
                    created, it will be saved and ready for publishing.
                  </motion.p>
                </motion.div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    );
  }

  // Fallback for any other states
  return (
    <div
      data-stage="experiment-preview"
      className="mb-4 flex w-full flex-col gap-3 rounded-lg border border-gray-200 py-3"
    >
      <div className="flex items-center gap-2 px-4">
        <Target className="size-4 text-gray-600" />
        <p className="text-gray-800 font-medium">
          No experiment preview available
        </p>
      </div>
    </div>
  );
};
