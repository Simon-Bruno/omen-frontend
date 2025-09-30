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
          <div>
            {isLoading && (
              <Badge variant="secondary" className="gap-1">
                <Loader2 className="size-3 animate-spin" />
                Loading
              </Badge>
            )}
            {hasError && (
              <Badge className="bg-red-600 hover:bg-red-600">Failed</Badge>
            )}
          </div>
        </div>

        <p className="max-w-3xl text-gray-600 mb-6">
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
            <div className="rounded-lg border bg-background/50 p-3">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: "Coal", className: "bg-neutral-900" },
                  { name: "Snow", className: "bg-white border" },
                  { name: "Gray", className: "bg-neutral-600" },
                  { name: "Tomato", className: "bg-rose-500" },
                ].map((c) => (
                  <div key={c.name} className="flex items-center gap-3">
                    <div className={`size-7 rounded-md ring-1 ring-black/5 ${c.className}`}></div>
                    <span className="text-sm text-muted-foreground">{c.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
