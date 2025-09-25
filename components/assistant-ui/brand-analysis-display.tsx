import { ToolCallContentPartComponent } from "@assistant-ui/react";
import { CheckIcon, Loader2 } from "lucide-react";

export const BrandAnalysisDisplay: ToolCallContentPartComponent = ({
  toolName,
  argsText,
  result,
  status,
}) => {
  const isLoading = status.type === "running";
  const isCompleted = status.type === "complete";
  const hasError = status.type === "error";

  return (
    <div className="mb-4 flex w-full flex-col gap-3 rounded-lg border py-3">
      <div className="flex items-center gap-2 px-4">
        {isLoading && <Loader2 className="size-4 animate-spin" />}
        {isCompleted && <CheckIcon className="size-4 text-green-600" />}
        {hasError && <div className="size-4 rounded-full bg-red-500" />}
        
        <p className="">
          {isLoading && "Analyzing brand..."}
          {isCompleted && "Brand analysis completed"}
          {hasError && "Brand analysis failed"}
        </p>
      </div>
      
      {isLoading && (
        <div className="px-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <span>Processing your brand data...</span>
          </div>
        </div>
      )}
      
      {isCompleted && (
        <div className="px-4">
          <div className="text-sm text-green-600">
            ✓ Brand analysis has been completed. The assistant will now provide you with detailed insights.
          </div>
        </div>
      )}
      
      {hasError && (
        <div className="px-4">
          <div className="text-sm text-red-600">
            ✗ There was an error during brand analysis. Please try again.
          </div>
        </div>
      )}
    </div>
  );
};
