import { CheckIcon, Loader2, Sparkles, AlertCircle, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { BrandAnalysisFunctionCallResponse, BrandAnalysisResponse } from "@/lib/chat-types";
import { useState } from "react";
import { Button } from "../ui/button";
import { AnimatePresence, motion } from "framer-motion";

export const BrandAnalysisDisplay = (props: any) => {
  const { toolName, argsText, result, status } = props;
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isLoading = status.type === "running";
  const isCompleted = status.type === "complete";
  const hasError = status.type === "incomplete";

  // Extract brand analysis data from function call result
  let brandAnalysisData: BrandAnalysisResponse | null = null;
  let functionCallResponse: BrandAnalysisFunctionCallResponse | null = null;

  if (isCompleted && result) {
    try {
      const resultData = typeof result === "string" ? JSON.parse(result) : result;
      functionCallResponse = resultData as BrandAnalysisFunctionCallResponse;

      if (functionCallResponse.success && functionCallResponse.data) {
        brandAnalysisData = functionCallResponse.data;
      }
    } catch (e) {
      console.error("Failed to parse brand analysis result:", e);
    }
  }

  // Handle error state - no brand analysis found
  if (isCompleted && functionCallResponse && !functionCallResponse.success) {
    return (
      <Card data-stage="brand-analysis" className="mb-4 mt-2 w-full">
        <CardHeader className="gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-md bg-red-100 text-red-600">
                <AlertCircle className="size-5" />
              </div>
              <CardTitle className="text-3xl">Brand Analysis</CardTitle>
            </div>
            <Badge className="bg-red-600 hover:bg-red-600">No Data</Badge>
          </div>
          <p className="max-w-3xl text-muted-foreground">
            {functionCallResponse.message || "No brand analysis found for this project. Please run a brand analysis first."}
          </p>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card data-stage="brand-analysis" className="mb-4 mt-2 w-full">
      <CardHeader className="">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center">
              {/* Refined gradient sparkles icon (no rounded background) */}
              <svg
                className="size-9"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="brandSparklesGradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="55%" stopColor="#a78bfa" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                  <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="0.8" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Central 8-point sparkle */}
                <g stroke="url(#brandSparklesGradient)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" filter="url(#softGlow)">
                  <path d="M12 2.75V7.5M12 16.5v4.75M2.75 12H7.5M16.5 12h4.75" />
                  <path d="M5.5 5.5l3.2 3.2M15.3 15.3l3.2 3.2M18.5 5.5l-3.2 3.2M8.7 15.3l-3.2 3.2" />
                </g>

                {/* Secondary sparkles */}
                <g stroke="url(#brandSparklesGradient)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.9">
                  <path d="M6 4.75V6.5M5.25 5.25H7" />
                  <path d="M17.5 17.25V19M16.75 18H18.5" />
                </g>
              </svg>
            </div>
            <CardTitle className="text-3xl">Brand Insights</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {isLoading && (
              <Badge variant="secondary" className="gap-1">
                <Loader2 className="size-3 animate-spin" />
                Loading
              </Badge>
            )}
            {hasError && (
              <Badge className="bg-red-600 hover:bg-red-600">Failed</Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              aria-label={isCollapsed ? "Expand brand insights" : "Collapse brand insights"}
            >
              {isCollapsed ? <ChevronDownIcon className="size-4" /> : <ChevronUpIcon className="size-4" />}
            </Button>
          </div>
        </div>

        <p className="max-w-3xl text-muted-foreground">
          {brandAnalysisData && brandAnalysisData.brand_description && (
            <span className="text-foreground/90">
              {brandAnalysisData.brand_description}
            </span>
          )}
        </p>

        {brandAnalysisData && (
          // Handle both correct structure and current incorrect structure where personality_words is nested
          (brandAnalysisData.brand_personality_words || brandAnalysisData.brand_trait_scores?.brand_personality_words) && (
            <div className="flex flex-wrap items-center -mt-1 text-lg font-medium text-foreground/90">
              {(brandAnalysisData.brand_personality_words || brandAnalysisData.brand_trait_scores?.brand_personality_words || []).map((word, index) => (
                <span
                  key={word}
                  className="before:content-['•'] before:mx-2 first:before:hidden"
                >
                  {word}
                </span>
              ))}
            </div>
          )
        )}
      </CardHeader>

      <AnimatePresence initial={false} mode="wait">
        {!isCollapsed && (
          <motion.div
            key="brand-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="md:col-span-2">
                  <div className="text-xl font-semibold">Brand Archetype</div>
                  <div className="mt-3 h-80 pointer-events-none">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart
                        data={brandAnalysisData ? [
                          { trait: "Premium", value: brandAnalysisData.brand_trait_scores.premium.score },
                          { trait: "Energetic", value: brandAnalysisData.brand_trait_scores.energetic.score },
                          { trait: "Innovator", value: brandAnalysisData.brand_trait_scores.innovator.score },
                          { trait: "Social Proof", value: brandAnalysisData.brand_trait_scores.social_proof.score },
                          { trait: "Curated", value: brandAnalysisData.brand_trait_scores.curated.score },
                          { trait: "Serious", value: brandAnalysisData.brand_trait_scores.serious.score },
                        ] : [
                          { trait: "Premium", value: 0 },
                          { trait: "Energetic", value: 0 },
                          { trait: "Innovator", value: 0 },
                          { trait: "Social Proof", value: 0 },
                          { trait: "Curated", value: 0 },
                          { trait: "Serious", value: 0 },
                        ]}
                        outerRadius="80%"
                      >
                        <PolarGrid 
                          radialLines={false} 
                          stroke="#d1d5db" 
                          strokeOpacity={0.9}
                          strokeLinejoin="round"
                          strokeLinecap="round"
                        />
                        <PolarAngleAxis 
                          dataKey="trait"
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: "#374151", fontSize: 14, fontWeight: 600 }}
                        />
                        <PolarRadiusAxis
                          domain={[0, 100]}
                          tick={false}
                          axisLine={false}
                        />
                        <Radar 
                          name="Brand" 
                          dataKey="value" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="#3b82f6" 
                          fillOpacity={0.2}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="text-xl font-semibold">Extracted Colors</div>
                  <div className="mt-2 flex flex-col gap-3">
                    {brandAnalysisData && brandAnalysisData.brand_colors ? (
                      brandAnalysisData.brand_colors.map((color, index) => (
                        <div key={`${color.color}-${index}`} className="flex items-center gap-4">
                          <div
                            className="size-8 rounded-md border border-gray-200"
                            style={{ backgroundColor: color.hex_code }}
                          ></div>
                          <div className="flex flex-col">
                            <span className="text-base text-foreground/80 font-medium">{color.color}</span>
                            <span className="text-xs text-foreground/60">{color.usage_type}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      [
                        { name: "Coal", className: "bg-neutral-900" },
                        { name: "Snow", className: "bg-white border" },
                        { name: "Gray", className: "bg-neutral-600" },
                        { name: "Tomato", className: "bg-rose-500" },
                      ].map((c) => (
                        <div key={c.name} className="flex items-center gap-4">
                          <div className={`size-8 rounded-md ${c.className}`}></div>
                          <span className="text-base text-foreground/80">{c.name}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};
