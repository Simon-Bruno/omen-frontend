import { Card } from "@/components/ui/card";
import { Sparkles, CheckCircle, ChevronRight, Zap, Image, Eye, X, AlertCircle } from "lucide-react";
import { useState } from "react";
import { Variant } from "@/lib/chat-types";

export const VariantsDisplay = (props: any) => {
  const { toolName, argsText, result, status } = props;
  const [isScreenshotModalOpen, setIsScreenshotModalOpen] = useState(false);
  const [selectedScreenshotVariant, setSelectedScreenshotVariant] = useState<Variant | null>(null);
  const [cardHoverStates, setCardHoverStates] = useState<Record<number, boolean>>({});



  const handleCardHover = (index: number, isHovering: boolean) => {
    setCardHoverStates(prev => ({ ...prev, [index]: isHovering }));
  };

  const handleScreenshotClick = (variant: Variant, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card click
    setSelectedScreenshotVariant(variant);
    setIsScreenshotModalOpen(true);
  };

  // Handle the different statuses of the tool call
  if (status.type === "running") {
    return (
      <div className="mb-4 flex w-full flex-col gap-3 rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 py-4">
        <div className="flex items-center gap-3 px-4">
          <div className="relative">
            <Sparkles className="size-5 animate-pulse text-blue-600" />
            <div className="absolute inset-0 animate-ping">
              <Sparkles className="size-5 text-blue-400 opacity-75" />
            </div>
          </div>
          <div>
            <p className="text-blue-800 font-medium">
              Generating variants...
            </p>
            <p className="text-blue-600 text-sm">
              Creating testable variations for your hypothesis
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
      // Parse the result - it might be a string or already parsed
      const resultData = typeof result === "string" ? JSON.parse(result) : result;
      const parsedData = typeof resultData.variantsSchema === "string" 
        ? JSON.parse(resultData.variantsSchema) 
        : resultData.variantsSchema;
      
      const variants = parsedData.variants || [];

  const handleVariantClick = (variant: Variant) => {
    if (variant.screenshot) {
      setSelectedScreenshotVariant(variant);
      setIsScreenshotModalOpen(true);
    }
  };

      return (
        <div className="mb-4 w-full">
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-green-200 bg-green-50">
            <CheckCircle className="size-4 text-green-600" />
            <p className="text-green-800 font-medium">
              Generated {variants.length} variants
            </p>
          </div>

          <div className={`mt-4 grid gap-4 ${
            variants.length === 1 ? 'grid-cols-1 max-w-md mx-auto' :
            variants.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
            variants.length === 3 ? 'grid-cols-1 md:grid-cols-3' :
            variants.length === 4 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' :
            'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          }`}>
            {variants.map((variant: Variant, index: number) => (
              <Card 
                key={index} 
                className={`p-4 border border-gray-200 transition-all duration-300 group transform ${
                  variant.screenshot 
                    ? 'hover:border-blue-300 hover:shadow-lg cursor-pointer hover:scale-105' 
                    : 'opacity-60'
                } ${
                  cardHoverStates[index] && variant.screenshot ? 'shadow-lg scale-105' : ''
                }`}
                onClick={() => handleVariantClick(variant)}
                onMouseEnter={() => handleCardHover(index, true)}
                onMouseLeave={() => handleCardHover(index, false)}
              >
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center transition-all duration-300 ${
                      cardHoverStates[index] && variant.screenshot
                        ? 'from-blue-600 to-purple-700 scale-110' 
                        : variant.screenshot
                        ? 'from-blue-500 to-purple-600'
                        : 'from-gray-400 to-gray-500'
                    }`}>
                      <span className="text-sm font-bold text-white">
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-300">
                        {variant.variant_label}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-3 group-hover:text-gray-700 transition-colors duration-300">
                        {variant.description}
                      </p>
                    </div>
                    {variant.screenshot && (
                      <ChevronRight className={`size-4 text-gray-400 group-hover:text-blue-500 transition-all duration-300 ${
                        cardHoverStates[index] ? 'translate-x-1' : ''
                      }`} />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500 group-hover:text-blue-500 transition-colors duration-300">
                    {variant.screenshot ? (
                      <>
                        <Image className="size-3" />
                        <span>Click to view screenshot</span>
                      </>
                    ) : (
                      <>
                        <Zap className="size-3" />
                        <span>No screenshot available</span>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Screenshot Modal */}
          {isScreenshotModalOpen && selectedScreenshotVariant && (
            <div 
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
              onClick={() => setIsScreenshotModalOpen(false)}
            >
              <div 
                className="relative max-w-5xl max-h-[90vh] bg-white rounded-lg overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between p-4 border-b">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{selectedScreenshotVariant.variant_label}</h3>
                    <p className="text-sm text-gray-600 mt-1">{selectedScreenshotVariant.description}</p>
                  </div>
                  <button
                    onClick={() => setIsScreenshotModalOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="size-5 text-gray-500" />
                  </button>
                </div>
                <div className="p-4">
                  <img 
                    src={selectedScreenshotVariant.screenshot}
                    alt={`Screenshot of ${selectedScreenshotVariant.variant_label}`}
                    className="max-w-full max-h-[70vh] w-auto h-auto rounded-lg border border-gray-200"
                  />
                </div>
              </div>
            </div>
          )}

        </div>
      );
    } catch (e) {
      console.error("Failed to parse variants JSON:", e);
      return (
        <div className="mb-4 flex w-full flex-col gap-3 rounded-lg border border-red-200 bg-red-50 py-3">
          <div className="flex items-center gap-2 px-4">
            <AlertCircle className="size-4 text-red-600" />
            <p className="text-red-800 font-medium">
              Error displaying variants
            </p>
          </div>
          <div className="px-4 text-sm text-red-700">
            <p>Failed to parse variants data. Raw result:</p>
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
