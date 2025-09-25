import { Sparkles, CheckCircle, AlertCircle, Beaker } from "lucide-react";

export const ExperimentCreationDisplay = (props: any) => {
    const { toolName, argsText, result, status } = props;


    // Handle the different statuses of the tool call
    if (status.type === "running") {
        return (
            <div className="mb-4 flex w-full flex-col gap-3 rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 py-4">
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
                <div className="mb-4 w-full">
                    <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-green-200 bg-green-50">
                        <CheckCircle className="size-4 text-green-600" />
                        <p className="text-green-800 font-medium">
                            Experiment "{experimentName}" created successfully
                        </p>
                    </div>
                </div>
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
            <div className="mb-4 flex w-full flex-col gap-3 rounded-lg border border-red-200 bg-red-50 py-3">
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
        <div className="mb-4 flex w-full flex-col gap-3 rounded-lg border border-gray-200 py-3">
            <div className="flex items-center gap-2 px-4">
                <AlertCircle className="size-4 text-gray-500" />
                <p className="text-gray-700">
                    Tool call status: {status.type}
                </p>
            </div>
        </div>
    );
};
