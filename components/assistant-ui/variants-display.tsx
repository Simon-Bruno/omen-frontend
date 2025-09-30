import { Card } from "@/components/ui/card";
import {
  Sparkles,
  CheckCircle,
  ChevronRight,
  Zap,
  Image,
  Eye,
  X,
  AlertCircle,
  Clock,
} from "lucide-react";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Variant, JobStatus } from "@/lib/chat-types";
import { chatApi } from "@/lib/chat-api";
import { getScreenshotUrl } from "@/lib/utils";

export const VariantsDisplay = (props: any) => {
  const { toolName, argsText, result, status } = props;

  // Simple modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);

  // Job and variant data
  const [jobIds, setJobIds] = useState<string[]>([]);
  const [jobStatuses, setJobStatuses] = useState<Record<string, JobStatus>>({});
  const [variants, setVariants] = useState<Variant[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);

  // ScreenshotImage component with error handling
  const ScreenshotImage = ({
    screenshotPath,
    alt,
    className,
  }: {
    screenshotPath: string;
    alt: string;
    className: string;
  }) => {
    const screenshotUrl = getScreenshotUrl(screenshotPath);

    // Log the URL being used for rendering
    console.log("🖼️ ScreenshotImage rendering:", {
      originalPath: screenshotPath,
      generatedUrl: screenshotUrl,
      alt,
    });

    if (!screenshotUrl) {
      return (
        <div
          className={`${className} bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center`}
        >
          <div className="text-center text-gray-500">
            <Image className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Screenshot unavailable</p>
          </div>
        </div>
      );
    }

    return (
      <img
        src={screenshotUrl}
        alt={alt}
        className={className}
        loading="lazy"
        onError={(e) => {
          console.error("❌ Failed to load screenshot:", {
            originalPath: screenshotPath,
            generatedUrl: screenshotUrl,
            error: e,
          });
          e.currentTarget.style.display = "none";
        }}
        onLoad={() => {
          console.log("✅ Screenshot loaded successfully:", {
            originalPath: screenshotPath,
            generatedUrl: screenshotUrl,
          });
        }}
      />
    );
  };

  // Handle variant click - simple and clean
  const handleVariantClick = (variant: Variant) => {
    console.log("🖱️ Variant clicked:", variant.variant_label);
    setSelectedVariant(variant);
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Extract jobIds from function call result
  useEffect(() => {
    if (status.type === "complete" && result && jobIds.length === 0) {
      try {
        const resultData =
          typeof result === "string" ? JSON.parse(result) : result;

        if (resultData.jobIds && Array.isArray(resultData.jobIds)) {
          console.log(
            "🚀 Starting job polling with jobIds:",
            resultData.jobIds
          );
          setJobIds(resultData.jobIds);
          setIsPolling(true);

          const extractedProjectId = resultData.projectId || "default-project";
          setProjectId(extractedProjectId);

          // Start polling for each job
          resultData.jobIds.forEach((jobId: string) => {
            pollJobStatus(jobId, extractedProjectId);
          });
        } else if (resultData.variantsSchema) {
          // Direct variants flow
          const parsedData =
            typeof resultData.variantsSchema === "string"
              ? JSON.parse(resultData.variantsSchema)
              : resultData.variantsSchema;
          setVariants(parsedData.variants || []);
        }
      } catch (e) {
        console.error("❌ Failed to parse result:", e);
      }
    }
  }, [status, result, jobIds.length]);

  // Poll job status
  const pollJobStatus = async (jobId: string, projectId: string) => {
    try {
      await chatApi.pollJobStatus(jobId, projectId, (status) => {
        setJobStatuses((prev) => ({ ...prev, [jobId]: status }));

        // If completed, extract variant data
        if (status.status === "completed" && status.result) {
          try {
            const resultData =
              typeof status.result === "string"
                ? JSON.parse(status.result)
                : status.result;
            const parsedData =
              typeof resultData.variantsSchema === "string"
                ? JSON.parse(resultData.variantsSchema)
                : resultData.variantsSchema;

            if (parsedData.variants && parsedData.variants.length > 0) {
              // Log all screenshot URLs for this job
              const screenshotUrls = parsedData.variants.map(
                (variant: any) => ({
                  variant_label: variant.variant_label,
                  originalPath: variant.screenshot,
                  generatedUrl: getScreenshotUrl(variant.screenshot),
                })
              );

              console.log("📸 All Screenshot URLs for job:", {
                jobId,
                screenshotUrls,
              });

              setVariants((prev) => [...prev, ...parsedData.variants]);
            }
          } catch (e) {
            console.error(`Failed to parse completed job ${jobId}:`, e);
          }
        }
      });
    } catch (error) {
      console.error(`Error polling job ${jobId}:`, error);
    }
  };

  // Handle function call running state
  if (status.type === "running") {
    return (
      <div
        data-stage="variants"
        className="mb-4 flex w-full flex-col gap-3 rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 py-4"
      >
        <div className="flex items-center gap-3 px-4">
          <div className="relative">
            <Sparkles className="size-5 animate-pulse text-blue-600" />
            <div className="absolute inset-0 animate-ping">
              <Sparkles className="size-5 text-blue-400 opacity-75" />
            </div>
          </div>
          <div>
            <p className="text-blue-800 font-medium">Preparing variants...</p>
            <p className="text-blue-600 text-sm">
              Setting up testable variations for your hypothesis
            </p>
          </div>
        </div>
        <div className="px-4">
          <div className="flex space-x-1">
            <div
              className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            ></div>
            <div
              className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            ></div>
            <div
              className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  // Handle function call incomplete state
  if (status.type === "incomplete") {
    return (
      <div
        data-stage="variants"
        className="mb-4 flex w-full flex-col gap-3 rounded-lg border border-red-200 bg-red-50 py-3"
      >
        <div className="flex items-center gap-2 px-4">
          <AlertCircle className="size-4 text-red-600" />
          <p className="text-red-800 font-medium">
            Tool call failed: {status.reason || "unknown error"}
          </p>
        </div>
        {status.error && (
          <div className="px-4 text-sm text-red-700">
            <pre className="whitespace-pre-wrap text-xs bg-red-100 p-2 rounded">
              {typeof status.error === "string"
                ? status.error
                : JSON.stringify(status.error, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  }

  // Handle job polling/completion state
  if (status.type === "complete" && jobIds.length > 0) {
    // Create loading placeholders for each job
    const loadingVariants = jobIds.map((jobId, index) => {
      const jobStatus = jobStatuses[jobId];
      const isCompleted = jobStatus?.status === "completed";
      const isFailed = jobStatus?.status === "failed";
      const progress = jobStatus?.progress || 0;

      // If completed, try to find the real variant data
      let realVariant = null;
      if (isCompleted && jobStatus?.result) {
        try {
          const resultData =
            typeof jobStatus.result === "string"
              ? JSON.parse(jobStatus.result)
              : jobStatus.result;
          const parsedData =
            typeof resultData.variantsSchema === "string"
              ? JSON.parse(resultData.variantsSchema)
              : resultData.variantsSchema;
          realVariant = parsedData.variants?.[0];

          // Log screenshot data from source of truth
          if (realVariant?.screenshot) {
            console.log("📸 Screenshot from source of truth:", {
              jobId,
              variant_label: realVariant.variant_label,
              originalScreenshotPath: realVariant.screenshot,
              generatedUrl: getScreenshotUrl(realVariant.screenshot),
            });
          }
        } catch (e) {
          console.error(`Failed to parse completed job ${jobId}:`, e);
        }
      }

      // Use real variant data if available, otherwise use placeholder
      if (realVariant) {
        return {
          ...realVariant,
          isPlaceholder: false,
          isCompleted: true,
          isFailed: false,
          progress: 100,
        };
      }

      return {
        variant_label: `Variant ${index + 1}`,
        description: isCompleted
          ? "Loading..."
          : isFailed
          ? "Failed to generate"
          : `Creating... ${progress}%`,
        rationale: isCompleted
          ? "Processing complete"
          : isFailed
          ? "Generation failed"
          : "Creating your variant",
        screenshot: null,
        css_code: "",
        html_code: "",
        target_selector: "",
        injection_method: "",
        new_element_html: "",
        implementation_notes: "",
        accessibility_consideration: "",
        implementation_instructions: "",
        isPlaceholder: true,
        isCompleted,
        isFailed,
        progress,
      };
    });

    return (
      <>
        <div data-stage="variants" className="mb-4 mt-2 w-full">
          <div className="mb-3 flex items-start justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="size-4 text-emerald-600" />
              <p className="text-sm font-medium text-emerald-900">
                Variants are being prepared
              </p>
            </div>
            <span className="rounded-full border border-emerald-200 bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
              Active
            </span>
          </div>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {loadingVariants.map((variant, index) => (
              <div
                key={`loading-${index}`}
                className={`relative overflow-hidden transition-all duration-300 border rounded-lg ${
                  variant.isPlaceholder
                    ? variant.isFailed
                      ? "border-rose-200 bg-rose-50 opacity-60"
                      : variant.isCompleted
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-blue-100 bg-white opacity-50"
                    : "border-gray-200 bg-white hover:shadow-sm hover:scale-105"
                } ${
                  variant.isPlaceholder && !variant.isCompleted
                    ? "cursor-not-allowed"
                    : "cursor-pointer"
                } `}
                onClick={() => {
                  if (!variant.isPlaceholder || variant.isCompleted) {
                    handleVariantClick(variant);
                  }
                }}
              >
                {/* Loading overlay - only for placeholders */}
                {variant.isPlaceholder && !variant.isCompleted && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                    <div className="text-center">
                      <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">
                        {variant.description}
                      </p>
                    </div>
                  </div>
                )}

                <Card className="h-full">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {`Variant ${index + 1}`}
                      </h3>
                      {variant.isPlaceholder ? (
                        variant.isFailed ? (
                          <span className="rounded-full border border-rose-200 bg-rose-50 px-2 text-[10px] font-medium text-rose-700">
                            Failed
                          </span>
                        ) : variant.isCompleted ? (
                          <span className="rounded-full border border-emerald-200 bg-emerald-100 px-2 text-[10px] font-medium text-emerald-700">
                            Ready
                          </span>
                        ) : (
                          <span className="rounded-full border border-blue-200 bg-blue-50 px-2 text-[10px] font-medium text-blue-700">
                            Generating
                          </span>
                        )
                      ) : (
                        <span className="rounded-full border border-emerald-200 bg-emerald-100 px-2 text-[10px] font-medium text-emerald-700">
                          Ready
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {variant.variant_label}
                    </p>

                    <div className="flex items-center justify-between text-xs">
                      <span
                        className={`${
                          variant.isFailed
                            ? "text-rose-700"
                            : variant.isPlaceholder && !variant.isCompleted
                            ? "text-blue-700"
                            : "text-blue-700"
                        } flex items-center gap-1`}
                      >
                        {variant.isPlaceholder ? (
                          variant.isFailed ? (
                            <>
                              <AlertCircle className="w-3 h-3" />
                              Failed
                            </>
                          ) : variant.isCompleted ? (
                            <>
                              <Eye className="w-3 h-3 text-blue-600" />
                              Preview
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" />
                              Generating...
                            </>
                          )
                        ) : (
                          <>
                            <Eye className="w-3 h-3 text-blue-600" />
                            Preview
                          </>
                        )}
                      </span>
                      {(!variant.isPlaceholder || variant.isCompleted) && (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>

        {/* Modal with smooth fade animations */}
        <AnimatePresence onExitComplete={() => setSelectedVariant(null)}>
          {isModalOpen && selectedVariant && (
            <motion.div
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
              onClick={closeModal}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <motion.div
                className="relative max-w-5xl max-h-[90vh] bg-white rounded-lg overflow-hidden"
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0.98, scale: 0.98 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <button
                  onClick={closeModal}
                  aria-label="Close"
                  className="absolute top-4 right-4 inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-gray-100"
                >
                  <X className="size-5 text-gray-500" />
                </button>
                <div className="p-4 border-b">
                  <div className="grid grid-cols-3 gap-4 items-start">
                    <div className="col-span-3 sm:col-span-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {(() => {
                          const i = variants.findIndex((v) => v.variant_label === selectedVariant.variant_label);
                          const position = i >= 0 ? `${i + 1}${variants.length ? `/${variants.length}` : ""}` : "?";
                          return `Variant ${position} — ${selectedVariant.variant_label}`;
                        })()}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {selectedVariant.description}
                      </p>
                    </div>
                    <div className="col-span-3 sm:col-span-1 flex sm:justify-end gap-6 self-center">
                      <div className="min-w-[8rem] text-right sm:text-left">
                        <div className="text-2xl md:text-3xl font-semibold leading-none tracking-tight text-slate-900 truncate max-w-[16rem]" title="Checkout conversion">
                          Checkout conversion
                        </div>
                        <div className="mt-1 text-xs text-slate-500">Primary outcome</div>
                      </div>
                      <div className="min-w-[8rem] text-right sm:text-left">
                        <div className="text-2xl md:text-3xl font-semibold leading-none tracking-tight text-slate-900 truncate max-w-[16rem]" title="2.4%">
                          2.4%
                        </div>
                        <div className="mt-1 text-xs text-slate-500">Current number</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <ScreenshotImage
                    screenshotPath={selectedVariant.screenshot || ""}
                    alt={`Screenshot of ${selectedVariant.variant_label}`}
                    className="max-w-full max-h-[70vh] w-auto h-auto rounded-lg border border-gray-200"
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Fallback for any other states
  return (
    <div
      data-stage="variants"
      className="mb-4 flex w-full flex-col gap-3 rounded-lg border border-gray-200 py-3"
    >
      <div className="flex items-center gap-2 px-4">
        <AlertCircle className="size-4 text-gray-600" />
        <p className="text-gray-800 font-medium">No variants available</p>
      </div>
    </div>
  );
};
