import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Sparkles, Target, Code, Palette, MousePointer, AlertCircle, CheckCircle, ChevronRight, Copy, ExternalLink, Zap } from "lucide-react";
import { useState } from "react";

export const VariantsDisplay = (props: any) => {
  const { toolName, argsText, result, status } = props;
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [cardHoverStates, setCardHoverStates] = useState<Record<number, boolean>>({});


  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(type);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleCardHover = (index: number, isHovering: boolean) => {
    setCardHoverStates(prev => ({ ...prev, [index]: isHovering }));
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

      const handleVariantClick = (variant: any) => {
        setSelectedVariant(variant);
        setIsModalOpen(true);
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
            {variants.map((variant: any, index: number) => (
              <Card 
                key={index} 
                className={`p-4 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 cursor-pointer group transform hover:scale-105 ${
                  cardHoverStates[index] ? 'shadow-lg scale-105' : ''
                }`}
                onClick={() => handleVariantClick(variant)}
                onMouseEnter={() => handleCardHover(index, true)}
                onMouseLeave={() => handleCardHover(index, false)}
              >
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center transition-all duration-300 ${
                      cardHoverStates[index] 
                        ? 'from-blue-600 to-purple-700 scale-110' 
                        : 'from-blue-500 to-purple-600'
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
                    <ChevronRight className={`size-4 text-gray-400 group-hover:text-blue-500 transition-all duration-300 ${
                      cardHoverStates[index] ? 'translate-x-1' : ''
                    }`} />
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500 group-hover:text-blue-500 transition-colors duration-300">
                    <Zap className="size-3" />
                    <span>Click to explore</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Modal for variant details */}
          <Sheet open={isModalOpen} onOpenChange={setIsModalOpen}>
            <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="text-xl font-bold text-gray-900">
                  {selectedVariant?.variant_label}
                </SheetTitle>
                <SheetDescription className="text-gray-600">
                  {selectedVariant?.description}
                </SheetDescription>
              </SheetHeader>
              
              {selectedVariant && (
                <div className="mt-6 space-y-6">
                  {/* Rationale */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Target className="size-4 text-blue-600" />
                      <h4 className="font-semibold text-gray-900">Rationale</h4>
                    </div>
                    <p className="text-gray-700 pl-6">{selectedVariant.rationale}</p>
                  </div>

                  {/* Accessibility Consideration */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="size-4 text-orange-600" />
                      <h4 className="font-semibold text-gray-900">Accessibility Consideration</h4>
                    </div>
                    <p className="text-gray-700 pl-6">{selectedVariant.accessibility_consideration}</p>
                  </div>

                  {/* Implementation Notes */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Code className="size-4 text-green-600" />
                      <h4 className="font-semibold text-gray-900">Implementation Notes</h4>
                    </div>
                    <p className="text-gray-700 pl-6">{selectedVariant.implementation_notes}</p>
                  </div>

                  {/* CSS Code */}
                  {selectedVariant.css_code && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Palette className="size-4 text-purple-600" />
                          <h4 className="font-semibold text-gray-900">CSS Code</h4>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(selectedVariant.css_code, 'css')}
                          className="flex items-center gap-2"
                        >
                          <Copy className="size-3" />
                          {copiedCode === 'css' ? 'Copied!' : 'Copy'}
                        </Button>
                      </div>
                      <div className="pl-6">
                        <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto border">
                          <code>{selectedVariant.css_code}</code>
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Implementation Instructions */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MousePointer className="size-4 text-indigo-600" />
                        <h4 className="font-semibold text-gray-900">Implementation Instructions</h4>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(selectedVariant.implementation_instructions, 'instructions')}
                        className="flex items-center gap-2"
                      >
                        <Copy className="size-3" />
                        {copiedCode === 'instructions' ? 'Copied!' : 'Copy'}
                      </Button>
                    </div>
                    <div className="pl-6">
                      <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded-lg border">
                        {selectedVariant.implementation_instructions}
                      </pre>
                    </div>
                  </div>

                  {/* Target Selector */}
                  {selectedVariant.target_selector && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900">Target Selector</h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(selectedVariant.target_selector, 'selector')}
                          className="flex items-center gap-2"
                        >
                          <Copy className="size-3" />
                          {copiedCode === 'selector' ? 'Copied!' : 'Copy'}
                        </Button>
                      </div>
                      <div className="pl-6">
                        <code className="bg-blue-100 text-blue-800 px-3 py-2 rounded text-sm font-mono border">
                          {selectedVariant.target_selector}
                        </code>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </SheetContent>
          </Sheet>
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
