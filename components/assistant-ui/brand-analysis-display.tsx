import { CheckIcon, Loader2, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from "recharts";

export const BrandAnalysisDisplay = (props: any) => {
  const { status } = props;
  const isLoading = status.type === "running";
  const isCompleted = status.type === "complete";
  const hasError = status.type === "incomplete";

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
          {/* Summary placeholder */}
          Here is the brand analysis I came up with for your brand. It's important for you to review this and provide feedback.
        </p>

        <div className="flex flex-wrap gap-2 -mt-2 text-lg font-medium text-foreground/90">
          {/* Keywords row placeholder */}
          <span className="after:mx-2 after:content-['•'] last:after:content-none">Modern</span>
          <span className="after:mx-2 after:content-['•'] last:after:content-none">Adventurous</span>
          <span className="after:mx-2 after:content-['•'] last:after:content-none">Sporty</span>
          <span>Clean</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <div className="text-xl font-semibold">Brand Archetype</div>
            <div className="mt-3 h-80 pointer-events-none">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart
                  data={[
                    { trait: "Premium", value: 70 },
                    { trait: "Energetic", value: 85 },
                    { trait: "Innovator", value: 65 },
                    { trait: "Social Proof", value: 55 },
                    { trait: "Curated", value: 75 },
                    { trait: "Crazy", value: 75 },
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
              {[
                { name: "Coal", className: "bg-neutral-900" },
                { name: "Snow", className: "bg-white border" },
                { name: "Gray", className: "bg-neutral-600" },
                { name: "Tomato", className: "bg-rose-500" },
              ].map((c) => (
                <div key={c.name} className="flex items-center gap-3">
                  <div className={`size-6 rounded-md ${c.className}`}></div>
                  <span className="text-sm text-foreground/80">{c.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
