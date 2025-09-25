import { Card } from "@/components/ui/card";
import { Sparkles, Target, BarChart3, CheckCircle, AlertCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";

export const HypothesesDisplay = (props: any) => {
  const { toolName, argsText, result, status } = props;
  const [isCollapsed, setIsCollapsed] = useState(false);


  // Handle the different statuses of the tool call
  if (status.type === "running") {
    return (
      <div className="mb-4 flex w-full flex-col gap-3 rounded-lg border border-blue-200 bg-blue-50 py-3">
        <div className="flex items-center gap-2 px-4">
          <Sparkles className="size-4 animate-pulse text-blue-600" />
          <p className="text-blue-800 font-medium">
            Generating hypotheses...
          </p>
        </div>
      </div>
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

      return (
        <div className="mb-4 w-full">
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-green-200 bg-green-50">
            <CheckCircle className="size-4 text-green-600" />
            <p className="text-green-800 font-medium">
              Generated {hypotheses.length} hypotheses
            </p>
            <div className="flex-grow" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? <ChevronDownIcon className="size-4" /> : <ChevronUpIcon className="size-4" />}
            </Button>
          </div>

          {!isCollapsed && (
            <div className="mt-3 space-y-4">
              {hypotheses.map((hypothesis: any, index: number) => (
                <Card key={index} className="p-4 border border-gray-200">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-semibold text-blue-600">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2">
                          {hypothesis.hypothesis}
                        </h3>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-start gap-2">
                            <Target className="size-4 text-gray-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="font-medium text-gray-700">Rationale:</span>
                              <p className="text-gray-600 mt-1">{hypothesis.rationale}</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <BarChart3 className="size-4 text-gray-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="font-medium text-gray-700">Measurable Tests:</span>
                              <p className="text-gray-600 mt-1">{hypothesis.measurable_tests}</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <CheckCircle className="size-4 text-gray-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="font-medium text-gray-700">Success Metrics:</span>
                              <p className="text-gray-600 mt-1">{hypothesis.success_metrics}</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <BarChart3 className="size-4 text-gray-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="font-medium text-gray-700">OEC (Overall Evaluation Criteria):</span>
                              <p className="text-gray-600 mt-1">{hypothesis.oec}</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <AlertCircle className="size-4 text-gray-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="font-medium text-gray-700">Accessibility Check:</span>
                              <p className="text-gray-600 mt-1">{hypothesis.accessibility_check}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      );
    } catch (e) {
      console.error("Failed to parse hypotheses JSON:", e);
      return (
        <div className="mb-4 flex w-full flex-col gap-3 rounded-lg border border-red-200 bg-red-50 py-3">
          <div className="flex items-center gap-2 px-4">
            <AlertCircle className="size-4 text-red-600" />
            <p className="text-red-800 font-medium">
              Error displaying hypotheses
            </p>
          </div>
          <div className="px-4 text-sm text-red-700">
            <p>Failed to parse hypotheses data. Raw result:</p>
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
            Tool call failed: {status.reason || "unknown error"}
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
