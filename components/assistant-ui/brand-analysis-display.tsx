import { CheckIcon, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { BrandAnalysisFunctionCallResponse, BrandAnalysisResponse } from "@/lib/chat-types";

export const BrandAnalysisDisplay = (props: any) => {
  const { toolName, argsText, result, status } = props;
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
      <CardHeader className="gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Sparkles className="size-5" />
            </div>
            <CardTitle className="text-3xl">Brand Insights</CardTitle>
          </div>
          <div>
            {isLoading && (
              <Badge variant="secondary" className="gap-1">
                <Loader2 className="size-3 animate-spin" />
                Loading
              </Badge>
            )}
            {isCompleted && (
              <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-600">
                <CheckIcon className="size-3" />
                Complete
              </Badge>
            )}
            {hasError && (
              <Badge className="bg-red-600 hover:bg-red-600">Failed</Badge>
            )}
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
            <div className="flex flex-wrap gap-2 -mt-2 text-lg font-medium text-foreground/90">
              {(brandAnalysisData.brand_personality_words || brandAnalysisData.brand_trait_scores?.brand_personality_words || []).map((word, index) => (
                <span
                  key={word}
                  className="after:mx-2 after:content-['•'] last:after:content-none"
                >
                  {word}
                </span>
              ))}
            </div>
          )
        )}
      </CardHeader>

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
                  <PolarGrid radialLines={false} stroke="#e5e7eb" strokeOpacity={0.6} />
                  <PolarAngleAxis
                    dataKey="trait"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#6b7280", fontSize: 13 }}
                  />
                  <PolarRadiusAxis
                    domain={[0, 100]}
                    tick={false}
                    axisLine={false}
                  />
                  <Radar
                    name="Brand"
                    dataKey="value"
                    stroke="#10b981"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="#10b981"
                    fillOpacity={0.2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="text-sm font-medium text-muted-foreground">Extracted Colors</div>
            <div className="flex flex-col gap-3">
              {brandAnalysisData && brandAnalysisData.brand_colors ? (
                brandAnalysisData.brand_colors.map((color, index) => (
                  <div key={`${color.color}-${index}`} className="flex items-center gap-3">
                    <div
                      className="size-6 rounded-md border border-gray-200"
                      style={{ backgroundColor: color.hex_code }}
                    ></div>
                    <div className="flex flex-col">
                      <span className="text-sm text-foreground/80 font-medium">{color.color}</span>
                      <span className="text-xs text-foreground/60">{color.usage_type}</span>
                    </div>
                  </div>
                ))
              ) : (
                // Fallback when no data is available
                [
                  { name: "Coal", className: "bg-neutral-900" },
                  { name: "Snow", className: "bg-white border" },
                  { name: "Gray", className: "bg-neutral-600" },
                  { name: "Tomato", className: "bg-rose-500" },
                ].map((c) => (
                  <div key={c.name} className="flex items-center gap-3">
                    <div className={`size-6 rounded-md ${c.className}`}></div>
                    <span className="text-sm text-foreground/80">{c.name}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
