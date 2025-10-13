import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Target,
  Settings,
  ChevronDownIcon,
  ChevronUpIcon,
  Loader2,
  FlaskConical,
  Layers,
  ChevronRight,
  Check,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

// (Pie chart helpers removed as we no longer render the chart)

export const ExperimentPreviewDisplay = (props: any) => {
  const { toolName, argsText, result, status } = props;

  const [experimentData, setExperimentData] = useState<any>(null);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [revealStage, setRevealStage] = useState(0);
  const [hasInitiallyExpanded, setHasInitiallyExpanded] = useState(false);
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

  // Initial auto-expand animation - expand after 1s fade-in
  useEffect(() => {
    if (isCompleted && experimentData && !hasInitiallyExpanded) {
      const expandTimer = setTimeout(() => {
        setIsCollapsed(false);
        setHasInitiallyExpanded(true);
      }, 1000);

      return () => clearTimeout(expandTimer);
    }
  }, [isCompleted, experimentData, hasInitiallyExpanded]);

  // Progressive reveal animation - only run once when component first appears
  useEffect(() => {
    if (isCompleted && experimentData && !hasAnimated.current) {
      hasAnimated.current = true;
      const stages = [
        { delay: 0, stage: 1 }, // Header and description
        { delay: 300, stage: 2 }, // Hypothesis details
        { delay: 600, stage: 3 }, // Metrics
        { delay: 900, stage: 4 }, // Variants and configuration
        { delay: 1200, stage: 5 }, // Full reveal
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
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <Card data-stage="experiment-preview" className="mb-4 mt-4 w-full">
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
                      <linearGradient
                        id="experimentEyeGradientLoading"
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
                        id="experimentEyeSoftGlowLoading"
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
                      stroke="url(#experimentEyeGradientLoading)"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter="url(#experimentEyeSoftGlowLoading)"
                    >
                      <path d="M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12z" />
                      <circle cx="12" cy="12" r="3.5" />
                    </g>
                    <g
                      fill="url(#experimentEyeGradientLoading)"
                      filter="url(#experimentEyeSoftGlowLoading)"
                    >
                      <circle cx="12" cy="12" r="1.5" />
                    </g>
                  </svg>
                </div>
                <CardTitle className="text-3xl">Experiment Preview</CardTitle>
              </div>
              <Badge variant="secondary" className="gap-1">
                <Loader2 className="size-3 animate-spin" />
                Loading
              </Badge>
            </div>
            <p className="max-w-3xl text-muted-foreground">
              Analyzing experiment configuration and variants
            </p>
          </CardHeader>
        </Card>
      </motion.div>
    );
  }

  // Handle function call incomplete state
  if (status.type === "incomplete") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <Card data-stage="experiment-preview" className="mb-4 mt-2 w-full">
          <CardHeader className="gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-md bg-red-100 text-red-600">
                  <Target className="size-5" />
                </div>
                <CardTitle className="text-3xl">Experiment Preview</CardTitle>
              </div>
              <Badge className="bg-red-600 hover:bg-red-600">Failed</Badge>
            </div>
            <p className="max-w-3xl text-muted-foreground">
              Tool call failed: {status.reason || "unknown error"}
            </p>
          </CardHeader>
          {status.error && (
            <CardContent>
              <pre className="whitespace-pre-wrap text-xs bg-red-50 text-red-700 p-3 rounded border border-red-200">
                {typeof status.error === "string"
                  ? status.error
                  : JSON.stringify(status.error, null, 2)}
              </pre>
            </CardContent>
          )}
        </Card>
      </motion.div>
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
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <Card data-stage="experiment-preview" className="mb-4 mt-2 w-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center">
                  {/* Gradient eye icon */}
                  <svg
                    className="size-9"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <defs>
                      <linearGradient
                        id="experimentEyeGradient"
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
                        id="experimentEyeSoftGlow"
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
                      stroke="url(#experimentEyeGradient)"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter="url(#experimentEyeSoftGlow)"
                    >
                      {/* Eye outline */}
                      <path d="M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12z" />
                      {/* Iris */}
                      <circle cx="12" cy="12" r="3.5" />
                    </g>
                    <g
                      fill="url(#experimentEyeGradient)"
                      filter="url(#experimentEyeSoftGlow)"
                    >
                      {/* Pupil */}
                      <circle cx="12" cy="12" r="1.5" />
                    </g>
                  </svg>
                </div>
                <CardTitle className="text-3xl">Experiment Preview</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
              >
                {isCollapsed ? (
                  <ChevronDownIcon className="size-4" />
                ) : (
                  <ChevronUpIcon className="size-4" />
                )}
              </Button>
            </div>

            <motion.p
              className="max-w-3xl text-muted-foreground"
              initial={{ opacity: 0, y: 10 }}
              animate={{
                opacity: revealStage >= 1 ? 1 : 0,
                y: revealStage >= 1 ? 0 : 10,
              }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              Your experiment configuration is ready, double check all the
              details below before launching the experiment.
            </motion.p>
          </CardHeader>

          <AnimatePresence initial={false} mode="wait">
            {!isCollapsed && (
              <motion.div
                key="experiment-content"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                style={{ overflow: "hidden" }}
              >
                <CardContent className="space-y-6">
                  {hypothesis && (
                    <>
                      <motion.div
                        className="max-w-3xl"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{
                          opacity: revealStage >= 2 ? 1 : 0,
                          y: revealStage >= 2 ? 0 : 10,
                        }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <FlaskConical className="size-5 text-slate-900" />
                            <span className="text-foreground/90 font-semibold text-lg">
                              Hypothesis:
                            </span>
                            <span className="text-foreground/90 font-semibold text-lg">
                              {hypothesis.title}
                            </span>
                          </div>
                          <p className="text-foreground/80">
                            {hypothesis.description}
                          </p>
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{
                          opacity: revealStage >= 3 ? 1 : 0,
                          y: revealStage >= 3 ? 0 : 20,
                        }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-3 items-stretch mx-auto py-1">
                          <motion.div
                            className="flex flex-col gap-1 text-left"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{
                              opacity: revealStage >= 3 ? 1 : 0,
                              scale: revealStage >= 3 ? 1 : 0.9,
                            }}
                            transition={{
                              duration: 0.4,
                              ease: "easeOut",
                              delay: 0.1,
                            }}
                          >
                            <div className="text-2xl font-semibold leading-none tracking-tight text-slate-900">
                              {hypothesis?.primary_outcome || "Primary outcome"}
                            </div>
                            <div className="mt-1 text-sm font-semibold text-slate-700">
                              Primary outcome
                            </div>
                          </motion.div>
                          <motion.div
                            className="flex flex-col gap-1 text-left"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{
                              opacity: revealStage >= 3 ? 1 : 0,
                              scale: revealStage >= 3 ? 1 : 0.9,
                            }}
                            transition={{
                              duration: 0.4,
                              ease: "easeOut",
                              delay: 0.2,
                            }}
                          >
                            <div className="flex items-end gap-2">
                              <span className="text-3xl font-semibold leading-none tracking-tight text-slate-900">
                                {typeof baselinePerformance === "number"
                                  ? `${baselinePerformance.toFixed(1)}%`
                                  : "N/A"}
                              </span>
                            </div>
                            <div className="mt-1 text-sm font-semibold text-slate-700">
                              Current performance
                            </div>
                          </motion.div>
                          <motion.div
                            className="flex flex-col gap-1 text-left"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{
                              opacity: revealStage >= 3 ? 1 : 0,
                              scale: revealStage >= 3 ? 1 : 0.9,
                            }}
                            transition={{
                              duration: 0.4,
                              ease: "easeOut",
                              delay: 0.3,
                            }}
                          >
                            <div className="flex items-end gap-2">
                              <span className="text-3xl font-semibold leading-none tracking-tight text-emerald-600">
                                {expectedUplift?.min != null &&
                                expectedUplift?.max != null
                                  ? `+${Math.round(
                                      expectedUplift.min * 100
                                    )}–${Math.round(expectedUplift.max * 100)}%`
                                  : "N/A"}
                              </span>
                            </div>
                            <div className="mt-1 text-sm font-semibold text-slate-700">
                              Expected increase
                            </div>
                          </motion.div>
                        </div>

                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{
                            opacity: revealStage >= 3 ? 1 : 0,
                            scale: revealStage >= 3 ? 1 : 0.95,
                          }}
                          transition={{
                            duration: 0.4,
                            ease: "easeOut",
                            delay: 0.4,
                          }}
                          className="mt-6"
                        >
                          <Separator />
                        </motion.div>
                      </motion.div>
                    </>
                  )}

                  {/* Variants Section */}
                  {variants && variants.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{
                        opacity: revealStage >= 4 ? 1 : 0,
                        y: revealStage >= 4 ? 0 : 20,
                      }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Layers className="size-5 text-slate-900" />
                        <h4 className="text-lg font-semibold text-gray-900">
                          Variants ({variantCount || variants.length})
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 italic mb-3">
                        10% of traffic goes to the control (current version of
                        the website).
                      </p>
                      {(() => {
                        const count = variants.length || 1;
                        const base = Math.floor(90 / count);
                        const rem = 90 - base * count;
                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 w-full">
                            {variants.map((variant: any, index: number) => {
                              const allocated =
                                base + (index === count - 1 ? rem : 0);
                              const handleVariantClick = () => {
                                if (variant.jobId) {
                                  const isDevelopment =
                                    process.env.NODE_ENV === "development" ||
                                    (typeof window !== "undefined" &&
                                      window.location.hostname === "localhost");
                                  const shopifyUrl = isDevelopment
                                    ? "http://localhost:9292"
                                    : "https://omen-mvp.myshopify.com";
                                  const previewUrl = `${shopifyUrl}/?preview=true&jobId=${variant.jobId}`;
                                  window.open(
                                    previewUrl,
                                    "_blank",
                                    "noopener,noreferrer"
                                  );
                                }
                              };

                              return (
                                <motion.div
                                  key={index}
                                  className="group relative overflow-hidden transition-all duration-300 my-1 cursor-pointer"
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{
                                    opacity: revealStage >= 4 ? 1 : 0,
                                    scale: revealStage >= 4 ? 1 : 0.95,
                                  }}
                                  transition={{
                                    duration: 0.3,
                                    ease: "easeOut",
                                    delay: 0.1 + index * 0.1,
                                  }}
                                  onClick={handleVariantClick}
                                >
                                  <Card className="h-full border border-gray-200 bg-gradient-to-br from-white to-gray-50/50 hover:border-gray-300 transition-all duration-300 flex flex-col">
                                    <div className="p-4 flex-1 flex flex-col">
                                      {/* Header - Top section */}
                                      <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2 w-fit">
                                          <Badge
                                            variant="secondary"
                                            className="text-xs font-medium text-emerald-700 bg-emerald-50 border-emerald-400 flex items-center gap-1 w-fit"
                                          >
                                            <Check className="w-3 h-3" />
                                            Variant {index + 1}
                                          </Badge>
                                          <Badge
                                            variant="secondary"
                                            className="text-xs font-medium text-orange-700 bg-orange-50 border-orange-300 w-fit"
                                          >
                                            {allocated}% traffic
                                          </Badge>
                                        </div>
                                        <h3 className="font-semibold text-gray-900 text-base leading-tight line-clamp-3">
                                          {variant.label}
                                        </h3>
                                      </div>

                                      {/* Bottom section - Status and actions */}
                                      <div className="mt-auto flex flex-col gap-3 pt-4">
                                        {/* Status indicator */}
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                            <span className="text-sm text-gray-600 font-medium">
                                              Preview
                                            </span>
                                          </div>
                                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                                        </div>
                                      </div>
                                    </div>
                                  </Card>
                                </motion.div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </motion.div>
                  )}

                  {/* Experiment Configuration */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{
                      opacity: revealStage >= 4 ? 1 : 0,
                      y: revealStage >= 4 ? 0 : 20,
                    }}
                    transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Settings className="size-5 text-slate-900" />
                      <h4 className="text-lg font-semibold text-gray-900">
                        Experiment Configurations
                      </h4>
                    </div>
                    <div className="grid grid-cols-1">
                      <motion.div
                        className="grid grid-cols-1 md:grid-cols-3 gap-3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{
                          opacity: revealStage >= 4 ? 1 : 0,
                          x: revealStage >= 4 ? 0 : 20,
                        }}
                        transition={{
                          duration: 0.4,
                          ease: "easeOut",
                          delay: 0.4,
                        }}
                      >
                        <Card className="border border-gray-200 bg-white">
                          <CardContent className="p-4">
                            <div className="flex gap-3">
                              <div className="self-stretch flex items-center">
                                <Clock className="w-5 h-5 text-slate-500" />
                              </div>
                              <div>
                                <p className="text-xs font-medium text-slate-500 mb-1">
                                  Running Time
                                </p>
                                <p className="text-sm text-slate-900 font-semibold">
                                  {/* {runningTime || "N/A"} */}
                                  Until effect reached
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="border border-gray-200 bg-white">
                          <CardContent className="p-4">
                            <div className="flex gap-3">
                              <div className="self-stretch flex items-center">
                                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                              </div>
                              <div>
                                <p className="text-xs font-medium text-slate-500 mb-1">
                                  Conflicts
                                </p>
                                <p className="text-sm text-emerald-700 font-semibold">
                                  No conflicts
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="border border-gray-200 bg-white">
                          <CardContent className="p-4">
                            <div className="flex gap-3">
                              <div className="self-stretch flex items-center">
                                <Check className="w-5 h-5 text-emerald-600" />
                              </div>
                              <div>
                                <p className="text-xs font-medium text-slate-500 mb-1">
                                  Status
                                </p>
                                <p className="text-sm text-emerald-700 font-semibold">
                                  Ready to launch
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </div>
                  </motion.div>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
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
      <Card data-stage="experiment-preview" className="mb-4 mt-2 w-full">
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
                    <linearGradient
                      id="experimentEyeGradientIdle"
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
                  </defs>
                  <g
                    stroke="url(#experimentEyeGradientIdle)"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12z" />
                    <circle cx="12" cy="12" r="3.5" />
                  </g>
                  <g fill="url(#experimentEyeGradientIdle)">
                    <circle cx="12" cy="12" r="1.5" />
                  </g>
                </svg>
              </div>
              <CardTitle className="text-3xl">Experiment Preview</CardTitle>
            </div>
            <Badge variant="secondary">{status.type}</Badge>
          </div>
          <p className="max-w-3xl text-muted-foreground">
            Awaiting experiment preview.
          </p>
        </CardHeader>
      </Card>
    </motion.div>
  );
};
