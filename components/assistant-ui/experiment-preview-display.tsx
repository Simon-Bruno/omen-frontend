import { Card } from "@/components/ui/card";
import { Sparkles, CheckCircle, ChevronRight, Target, TrendingUp, BarChart3, Clock, Zap } from "lucide-react";
import { useState, useEffect } from "react";

export const ExperimentPreviewDisplay = (props: any) => {
    const { toolName, argsText, result, status } = props;

    const [experimentData, setExperimentData] = useState<any>(null);

    // Parse the result when it's available
    useEffect(() => {
        if (status.type === "complete" && result) {
            try {
                const resultData = typeof result === "string" ? JSON.parse(result) : result;
                setExperimentData(resultData);
            } catch (e) {
                console.error("Failed to parse experiment preview result:", e);
            }
        }
    }, [status, result]);

    // Handle function call running state
    if (status.type === "running") {
        return (
            <div data-stage="experiment-preview" className="mb-4 flex w-full flex-col gap-3 rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 py-4">
                <div className="flex items-center gap-3 px-4">
                    <div className="relative">
                        <Sparkles className="size-5 animate-pulse text-blue-600" />
                        <div className="absolute inset-0 animate-ping">
                            <Sparkles className="size-5 text-blue-400 opacity-75" />
                        </div>
                    </div>
                    <div>
                        <p className="text-blue-800 font-medium">Generating experiment preview...</p>
                        <p className="text-blue-600 text-sm">Analyzing experiment configuration and variants</p>
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

    // Handle function call incomplete state
    if (status.type === "incomplete") {
        return (
            <div data-stage="experiment-preview" className="mb-4 flex w-full flex-col gap-3 rounded-lg border border-red-200 bg-red-50 py-3">
                <div className="flex items-center gap-2 px-4">
                    <Target className="size-4 text-red-600" />
                    <p className="text-red-800 font-medium">
                        Experiment preview failed: {status.reason || "unknown error"}
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
             conflictCheck 
         } = experimentData;

        return (
            <div data-stage="experiment-preview" className="mb-4 w-full">
                <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                    <div className="p-6">
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Target className="size-6 text-green-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-green-800">Experiment Preview</h3>
                                <p className="text-green-600 text-sm">Ready to create and launch</p>
                            </div>
                        </div>

                        {/* Experiment Name */}
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">{experimentName}</h2>
                        </div>

                        {/* Hypothesis Section */}
                        {hypothesis && (
                            <div className="mb-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <BarChart3 className="size-5 text-blue-600" />
                                    <h4 className="text-lg font-semibold text-gray-900">Hypothesis</h4>
                                </div>
                                <div className="bg-white rounded-lg p-4 border border-gray-200">
                                    <h5 className="font-semibold text-gray-900 mb-2">{hypothesis.title}</h5>
                                    <p className="text-gray-700 mb-3">{hypothesis.description}</p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600 mb-1">Primary Outcome</p>
                                            <p className="text-sm text-gray-900">{hypothesis.primary_outcome}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-600 mb-1">Current Problem</p>
                                            <p className="text-sm text-gray-900">{hypothesis.current_problem}</p>
                                        </div>
                                    </div>

                                    {/* Why it works */}
                                    {hypothesis.why_it_works && hypothesis.why_it_works.length > 0 && (
                                        <div className="mb-4">
                                            <p className="text-sm font-medium text-gray-600 mb-2">Why This Will Work</p>
                                            <ul className="space-y-1">
                                                {hypothesis.why_it_works.map((item: any, index: number) => (
                                                    <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                                                        <CheckCircle className="size-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                        <span>{item.reason}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                     {/* Performance Metrics */}
                                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                                         <div className="text-center">
                                             <p className="text-sm font-medium text-gray-600 mb-1">Baseline Performance</p>
                                             <p className="text-2xl font-bold text-blue-600">{baselinePerformance}%</p>
                                         </div>
                                         <div className="text-center">
                                             <p className="text-sm font-medium text-gray-600 mb-1">Expected Uplift (Min)</p>
                                             <p className="text-2xl font-bold text-green-600">+{Math.round(expectedUplift?.min * 100)}%</p>
                                         </div>
                                         <div className="text-center">
                                             <p className="text-sm font-medium text-gray-600 mb-1">Expected Uplift (Max)</p>
                                             <p className="text-2xl font-bold text-green-600">+{Math.round(expectedUplift?.max * 100)}%</p>
                                         </div>
                                     </div>
                                </div>
                            </div>
                        )}

                        {/* Variants Section */}
                        {variants && variants.length > 0 && (
                            <div className="mb-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <BarChart3 className="size-5 text-purple-600" />
                                    <h4 className="text-lg font-semibold text-gray-900">Variants ({variantCount || variants.length})</h4>
                                </div>
                                <div className="space-y-3">
                                    {variants.map((variant: any, index: number) => (
                                        <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                                    <span className="text-sm font-semibold text-purple-600">{index + 1}</span>
                                                </div>
                                                <h5 className="font-semibold text-gray-900">{variant.label}</h5>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Experiment Configuration */}
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-3">
                                <Clock className="size-5 text-indigo-600" />
                                <h4 className="text-lg font-semibold text-gray-900">Experiment Configuration</h4>
                            </div>
                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 mb-1">Primary Outcome</p>
                                        <p className="text-sm text-gray-900">{primaryOutcome}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 mb-1">Traffic Split</p>
                                        <p className="text-sm text-gray-900">{trafficSplit}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 mb-1">Running Time</p>
                                        <p className="text-sm text-gray-900">{runningTime}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 mb-1">Conflict Check</p>
                                        <p className="text-sm text-gray-900">{conflictCheck}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Next Steps */}
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                            <div className="flex items-center gap-2 mb-2">
                                <Zap className="size-5 text-blue-600" />
                                <h4 className="font-semibold text-blue-800">Ready to Launch</h4>
                            </div>
                            <p className="text-blue-700 text-sm">
                                This experiment is configured and ready to be created. Once created, it will be saved and ready for publishing.
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    // Fallback for any other states
    return (
        <div data-stage="experiment-preview" className="mb-4 flex w-full flex-col gap-3 rounded-lg border border-gray-200 py-3">
            <div className="flex items-center gap-2 px-4">
                <Target className="size-4 text-gray-600" />
                <p className="text-gray-800 font-medium">No experiment preview available</p>
            </div>
        </div>
    );
};
