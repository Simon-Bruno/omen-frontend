"use client";

import { Sparkles, CheckCircle, AlertCircle, Beaker, ChevronDownIcon, ChevronUpIcon, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "../ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAnalytics } from "@/contexts/analytics-context";
import { Confetti, type ConfettiRef } from "@/components/ui/confetti";

export const ExperimentCreationDisplay = (props: any) => {
    const { toolName, argsText, result, status } = props;
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [revealStage, setRevealStage] = useState(0);
    const hasAnimated = useRef(false);
    const confettiRef = useRef<ConfettiRef>(null);
    const router = useRouter();
    const { setSelectedExperimentId } = useAnalytics();
    const isLoading = status.type === "running";
    const isCompleted = status.type === "complete";
    const hasError = status.type === "incomplete";

    // Progressive reveal animation - only run once when component first appears
    useEffect(() => {
        if (isCompleted && result && !hasAnimated.current) {
            hasAnimated.current = true;
            const stages = [
                { delay: 0, stage: 1 },      // Header and success message
                { delay: 300, stage: 2 },    // Experiment details
                { delay: 600, stage: 3 },    // Full reveal
            ];

            stages.forEach(({ delay, stage }) => {
                setTimeout(() => setRevealStage(stage), delay);
            });
        } else if (isLoading) {
            setRevealStage(0);
            hasAnimated.current = false;
        }
    }, [isCompleted, isLoading, result]);

    // Fire confetti once when completed and canvas is ready
    const hasFiredConfetti = useRef(false);
    useEffect(() => {
        if (!isCompleted || !result || hasFiredConfetti.current) return;
        let cancelled = false;

        const tryFire = (attempt = 0) => {
            if (cancelled) return;
            if (confettiRef.current) {
                hasFiredConfetti.current = true;
                confettiRef.current.fire({
                    particleCount: 120,
                    spread: 70,
                    startVelocity: 45,
                    scalar: 0.9,
                    origin: { x: 0.5, y: 0.2 },
                    zIndex: 60,
                });
                return;
            }
            if (attempt < 20) {
                setTimeout(() => tryFire(attempt + 1), 50);
            }
        };

        tryFire();
        return () => {
            cancelled = true;
        };
    }, [isCompleted, result]);

    // Handle the different statuses of the tool call
    if (status.type === "running") {
        return (
            <div data-stage="experiment-creation" data-function-call="create_experiment" className="mb-4 flex w-full flex-col gap-3 rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 py-4">
                <div className="flex items-center gap-3 px-4">
                    <div className="relative">
                        <Beaker className="size-5 animate-pulse text-blue-600" />
                        <div className="absolute inset-0 animate-ping">
                            <Beaker className="size-5 text-blue-400 opacity-75" />
                        </div>
                    </div>
                    <div>
                        <p className="text-blue-800 font-medium">
                            Creating experiment...
                        </p>
                        <p className="text-blue-600 text-sm">
                            Setting up your experiment and variants
                        </p>
                    </div>
                </div>
                <div className="px-4">
                    <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                </div>
            </div>
        );
    }

    if (status.type === "complete" && result) {
        try {
            const resultData = typeof result === "string" ? JSON.parse(result) : result;
            const experimentId = resultData.experimentId;
            const experimentName = resultData.message?.includes('"')
                ? resultData.message.match(/"([^"]+)"/)?.[1] || "Experiment"
                : "Your Experiment";

            return (
                <Card data-stage="experiment-creation" className="mb-4 mt-2 w-full relative overflow-hidden">
                    <Confetti
                        ref={confettiRef}
                        manualstart
                        className="absolute inset-0 z-40 pointer-events-none"
                    />
                    <CardHeader className="">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="flex items-center justify-center">
                                    {/* Gradient check circle icon */}
                                    <svg
                                        className="size-9"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                        aria-hidden="true"
                                    >
                                        <defs>
                                            <linearGradient id="experimentCheckGradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                                                <stop offset="0%" stopColor="#3b82f6" />
                                                <stop offset="55%" stopColor="#a78bfa" />
                                                <stop offset="100%" stopColor="#f59e0b" />
                                            </linearGradient>
                                            <filter id="experimentCheckGlow" x="-20%" y="-20%" width="140%" height="140%">
                                                <feGaussianBlur stdDeviation="0.8" result="blur" />
                                                <feMerge>
                                                    <feMergeNode in="blur" />
                                                    <feMergeNode in="SourceGraphic" />
                                                </feMerge>
                                            </filter>
                                        </defs>
                                        <circle
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="url(#experimentCheckGradient)"
                                            strokeWidth="2"
                                            fill="none"
                                            filter="url(#experimentCheckGlow)"
                                        />
                                        <path
                                            d="M9 12l2 2 4-4"
                                            stroke="url(#experimentCheckGradient)"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </div>
                                <CardTitle className="text-3xl">Experiment Created</CardTitle>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                    <span>Live</span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsCollapsed(!isCollapsed)}
                                    aria-label={isCollapsed ? "Expand experiment details" : "Collapse experiment details"}
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
                                Experiment "{experimentName}" has been created successfully and is live on your website!
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
                                    <motion.div 
                                        className="rounded-lg p-4 border border-gray-200 bg-white"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ 
                                            opacity: revealStage >= 3 ? 1 : 0, 
                                            y: revealStage >= 3 ? 0 : 10 
                                        }}
                                        transition={{ duration: 0.4, ease: "easeOut", delay: 0.3 }}
                                    >
                                        <div className="flex items-center justify-between gap-3 mb-2">
                                            <div className="flex items-center gap-2">
                                                <BarChart3 className="size-5 text-slate-600" />
                                                <h4 className="font-semibold text-slate-800">Check analytics for this experiment</h4>
                                            </div>
                                            <Button
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedExperimentId(experimentId || null);
                                                    router.push('/analytics');
                                                }}
                                            >
                                                Open Analytics
                                            </Button>
                                        </div>
                                        <p className="text-slate-600 text-sm">
                                            View funnel, conversions, and traffic for "{experimentName}" in real time.
                                        </p>
                                    </motion.div>
                                </CardContent>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Card>
            );
        } catch (e) {
            console.error("Failed to parse experiment creation result:", e);
            return (
                <div className="mb-4 flex w-full flex-col gap-3 rounded-lg border border-red-200 bg-red-50 py-3">
                    <div className="flex items-center gap-2 px-4">
                        <AlertCircle className="size-4 text-red-600" />
                        <p className="text-red-800 font-medium">
                            Error creating experiment
                        </p>
                    </div>
                    <div className="px-4 text-sm text-red-700">
                        <p>Failed to parse experiment data. Raw result:</p>
                        <pre className="mt-2 whitespace-pre-wrap text-xs bg-red-100 p-2 rounded">
                            {typeof result === "string" ? result : JSON.stringify(result, null, 2)}
                        </pre>
                    </div>
                </div>
            );
        }
    }

    // Handle incomplete status (error, abort, timeout, etc.)
    if (status.type === "incomplete") {
        return (
            <div data-stage="experiment-creation" data-function-call="create_experiment" className="mb-4 flex w-full flex-col gap-3 rounded-lg border border-red-200 bg-red-50 py-3">
                <div className="flex items-center gap-2 px-4">
                    <AlertCircle className="size-4 text-red-600" />
                    <p className="text-red-800 font-medium">
                        Experiment creation failed: {status.reason || "unknown error"}
                    </p>
                </div>
                {status.error && (
                    <div className="px-4 text-sm text-red-700">
                        <pre className="whitespace-pre-wrap text-xs bg-red-100 p-2 rounded">
                            {typeof status.error === 'string' ? status.error : JSON.stringify(status.error, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        );
    }

    // Fallback for any other states
    return (
        <div data-stage="experiment-creation" data-function-call="create_experiment" className="mb-4 flex w-full flex-col gap-3 rounded-lg border border-gray-200 py-3">
            <div className="flex items-center gap-2 px-4">
                <AlertCircle className="size-4 text-gray-500" />
                <p className="text-gray-700">
                    Tool call status: {status.type}
                </p>
            </div>
        </div>
    );
};
