import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, CheckCircle, ChevronRight, Zap, Image, Eye, X, AlertCircle, Clock } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Variant, JobStatus } from "@/lib/chat-types";
import { chatApi } from "@/lib/chat-api";
import { getScreenshotUrl } from "@/lib/utils";
import { useVariantJobs } from "@/contexts/variant-jobs-context";
import { motion } from "framer-motion";

export const VariantsDisplay = (props: any) => {
  const { toolName, argsText, result, status } = props;
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  
  // Job and variant data
  const [jobIds, setJobIds] = useState<string[]>([]);
  const [jobStatuses, setJobStatuses] = useState<Record<string, JobStatus>>({});
  const [variants, setVariants] = useState<Variant[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [feedbackByJobId, setFeedbackByJobId] = useState<Record<string, string>>({});
  const [improvedVariantByJobId, setImprovedVariantByJobId] = useState<Record<string, any>>({});
  const [improvementsByJobId, setImprovementsByJobId] = useState<Record<string, string[]>>({});
  const [confidenceByJobId, setConfidenceByJobId] = useState<Record<string, number>>({});
  const [isImprovingByJobId, setIsImprovingByJobId] = useState<Record<string, boolean>>({});

  // Variant jobs context
  const { addVariantJob, updateVariantJobStatus, removeVariantJob } = useVariantJobs();


  // ScreenshotImage component with error handling
  const ScreenshotImage = ({ 
    screenshotPath, 
    alt, 
    className 
  }: { 
    screenshotPath: string; 
    alt: string; 
    className: string; 
  }) => {
    const screenshotUrl = getScreenshotUrl(screenshotPath);

    // Log the URL being used for rendering
    console.log('🖼️ ScreenshotImage rendering:', {
      originalPath: screenshotPath,
      generatedUrl: screenshotUrl,
      alt
    });

    if (!screenshotUrl) {
      return (
        <div className={`${className} bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center`}>
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
          console.error('❌ Failed to load screenshot:', {
            originalPath: screenshotPath,
            generatedUrl: screenshotUrl,
            error: e
          });
          e.currentTarget.style.display = 'none';
        }}
        onLoad={() => {
          console.log('✅ Screenshot loaded successfully:', {
            originalPath: screenshotPath,
            generatedUrl: screenshotUrl
          });
        }}
      />
    );
  };

  // Handle variant click - open preview in new tab
  const handleVariantClick = (variant: Variant, jobId?: string) => {
    console.log('🖱️ Variant clicked:', variant.variant_label, 'jobId:', jobId);
    
    if (jobId) {
      // Determine the correct Shopify URL based on environment
      const isDevelopment = process.env.NODE_ENV === 'development' || 
                           (typeof window !== 'undefined' && window.location.hostname === 'localhost');
      
      const shopifyUrl = isDevelopment 
        ? 'http://localhost:9292' // Your local Shopify development store
        : 'https://omen-mvp.myshopify.com'; // Production store
      
      const previewUrl = `${shopifyUrl}/?preview=true&jobId=${jobId}`;
      console.log('🔗 Opening preview URL:', previewUrl);
      window.open(previewUrl, '_blank', 'noopener,noreferrer');
    } else {
      // Fallback to modal for variants without jobId
      setSelectedVariant(variant);
      setIsModalOpen(true);
    }
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedVariant(null);
  };

  // Handle feedback modal
  const openFeedbackModal = (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedJobId(jobId);
    setIsFeedbackModalOpen(true);
  };

  const closeFeedbackModal = () => {
    setIsFeedbackModalOpen(false);
    setSelectedJobId(null);
  };

  // Extract jobIds from function call result
  useEffect(() => {
    if (status.type === "complete" && result && jobIds.length === 0) {
      try {
        const resultData = typeof result === "string" ? JSON.parse(result) : result;
        
        if (resultData.jobIds && Array.isArray(resultData.jobIds)) {
          console.log('🚀 Starting job polling with jobIds:', resultData.jobIds);
          setJobIds(resultData.jobIds);
          setIsPolling(true);
          
          const extractedProjectId = resultData.projectId || 'default-project';
          setProjectId(extractedProjectId);
          
          // Add jobs to context and start polling for each job
          resultData.jobIds.forEach((jobId: string) => {
            addVariantJob(jobId, extractedProjectId);
            pollJobStatus(jobId, extractedProjectId);
          });
        } else if (resultData.variantsSchema) {
          // Direct variants flow
          const parsedData = typeof resultData.variantsSchema === "string" 
            ? JSON.parse(resultData.variantsSchema) 
            : resultData.variantsSchema;
          setVariants(parsedData.variants || []);
        }
      } catch (e) {
        console.error("❌ Failed to parse result:", e);
      }
    }
  }, [status, result, jobIds.length, addVariantJob, updateVariantJobStatus, removeVariantJob]);

  // Poll job status
  const pollJobStatus = async (jobId: string, projectId: string) => {
    try {
      await chatApi.pollJobStatus(
        jobId,
        projectId,
        (status) => {
          setJobStatuses(prev => ({ ...prev, [jobId]: status }));
          
          // Update job status in context
          updateVariantJobStatus(jobId, status.status);
          
          // If completed or failed, remove from context after a delay
          if (status.status === 'completed' || status.status === 'failed') {
            setTimeout(() => {
              removeVariantJob(jobId);
            }, 2000); // Keep in context for 2 seconds to show completion state
          }
          
          // If completed, extract variant data
          if (status.status === 'completed' && status.result) {
            try {
              const resultData = typeof status.result === "string" ? JSON.parse(status.result) : status.result;
              const parsedData = typeof resultData.variantsSchema === "string"
                ? JSON.parse(resultData.variantsSchema)
                : resultData.variantsSchema;
              
              if (parsedData.variants && parsedData.variants.length > 0) {
                // Log all screenshot URLs for this job
                const screenshotUrls = parsedData.variants.map((variant: any) => ({
                  variant_label: variant.variant_label,
                  originalPath: variant.screenshot,
                  generatedUrl: getScreenshotUrl(variant.screenshot)
                }));
                
                console.log('📸 All Screenshot URLs for job:', {
                  jobId,
                  screenshotUrls
                });
                
                setVariants(prev => [...prev, ...parsedData.variants]);
              }
            } catch (e) {
              console.error(`Failed to parse completed job ${jobId}:`, e);
            }
          }
        }
      );
    } catch (error) {
      console.error(`Error polling job ${jobId}:`, error);
      // Update status to failed and remove from context
      updateVariantJobStatus(jobId, 'failed');
      setTimeout(() => {
        removeVariantJob(jobId);
      }, 2000);
    }
  };

  // Handle function call incomplete state
  if (status.type === "incomplete") {
    return (
      <div data-stage="variants" data-function-call="generate_variants" className="mb-4 flex w-full flex-col gap-3 rounded-lg border border-red-200 bg-red-50 py-3">
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

  // Unified variant display - handles both running state and job polling
  if (status.type === "running" || (status.type === "complete" && jobIds.length > 0)) {
    // Create variants - either from jobIds or placeholder data
    const loadingVariants = jobIds.length > 0 
      ? jobIds.map((jobId, index) => {
          const jobStatus = jobStatuses[jobId];
          const isCompleted = jobStatus?.status === 'completed';
          const isFailed = jobStatus?.status === 'failed';
          const progress = jobStatus?.progress || 0;

      // If completed, try to find the real variant data
      let realVariant = null;
      if (isCompleted && jobStatus?.result) {
        try {
          const resultData = typeof jobStatus.result === "string" ? JSON.parse(jobStatus.result) : jobStatus.result;
          const parsedData = typeof resultData.variantsSchema === "string"
            ? JSON.parse(resultData.variantsSchema)
            : resultData.variantsSchema;
          realVariant = parsedData.variants?.[0];

          // Prefer locally improved variant if present (merge to retain required fields)
          if (improvedVariantByJobId[jobId]) {
            realVariant = { ...realVariant, ...improvedVariantByJobId[jobId] };
          }
          
          // Log screenshot data from source of truth
          if (realVariant?.screenshot) {
            console.log('📸 Screenshot from source of truth:', {
              jobId,
              variant_label: realVariant.variant_label,
              originalScreenshotPath: realVariant.screenshot,
              generatedUrl: getScreenshotUrl(realVariant.screenshot)
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
          progress: 100
        };
      }

      return {
        variant_label: `Variant ${index + 1}`,
        description: isCompleted ? 'Loading...' : isFailed ? 'Failed to generate' : 'Creating...',
        rationale: isCompleted ? 'Processing complete' : isFailed ? 'Generation failed' : 'Creating your variant',
        screenshot: null,
        css_code: '',
        html_code: '',
        target_selector: '',
        injection_method: '',
        new_element_html: '',
        implementation_notes: '',
        accessibility_consideration: '',
        implementation_instructions: '',
        isPlaceholder: true,
        isCompleted,
        isFailed,
        progress
      };
        })
      : [
          // Placeholder variants when we don't have jobIds yet
          {
            variant_label: "Variant 1",
            description: "Creating...",
            rationale: "Creating your first variant",
            screenshot: null,
            css_code: '',
            html_code: '',
            target_selector: '',
            injection_method: '',
            new_element_html: '',
            implementation_notes: '',
            accessibility_consideration: '',
            implementation_instructions: '',
            isPlaceholder: true,
            isCompleted: false,
            isFailed: false,
            progress: 8
          },
          {
            variant_label: "Variant 2", 
            description: "Creating...",
            rationale: "Creating your second variant",
            screenshot: null,
            css_code: '',
            html_code: '',
            target_selector: '',
            injection_method: '',
            new_element_html: '',
            implementation_notes: '',
            accessibility_consideration: '',
            implementation_instructions: '',
            isPlaceholder: true,
            isCompleted: false,
            isFailed: false,
            progress: 5
          },
          {
            variant_label: "Variant 3",
            description: "Creating...",
            rationale: "Creating your third variant", 
            screenshot: null,
            css_code: '',
            html_code: '',
            target_selector: '',
            injection_method: '',
            new_element_html: '',
            implementation_notes: '',
            accessibility_consideration: '',
            implementation_instructions: '',
            isPlaceholder: true,
            isCompleted: false,
            isFailed: false,
            progress: 10
          }
        ];

    return (
      <>
        <div data-stage="variants" data-function-call="generate_variants" className="mb-4 mt-2 w-full">
          <motion.div
            className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {loadingVariants.map((variant, index) => (
              <motion.div
                key={`variant-${index}`}
                className={`group relative overflow-hidden transition-all duration-300 my-1 ${
                  variant.isPlaceholder
                    ? (variant.isCompleted
                        ? 'opacity-100'
                        : variant.isFailed
                          ? 'opacity-60'
                          : 'opacity-50')
                    : 'hover:shadow-sm hover:scale-[1.01] hover:-translate-y-1'
                } ${(variant.isPlaceholder && !variant.isCompleted) ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: 1,
                  y: 0
                }}
                transition={{
                  duration: 0.3,
                  ease: "easeOut",
                  delay: index * 0.05
                }}
                onClick={() => {
                  if (!variant.isPlaceholder || variant.isCompleted) {
                    // Find the jobId for this variant (it's the index in the jobIds array)
                    const jobId = jobIds.length > 0 ? jobIds[index] : undefined;
                    handleVariantClick(variant, jobId);
                  }
                }}
              >
                {/* Loading overlay - only for placeholders */}
                {variant.isPlaceholder && !variant.isCompleted && (
                  <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
                    <div className="text-center px-4">
                      <div className="w-10 h-10 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-sm font-medium text-gray-700 mb-3 leading-relaxed">{variant.description}</p>
                      <div className="w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden mx-auto">
                        <div 
                          className="h-full bg-blue-600 rounded-full transition-all duration-300"
                          style={{ width: `${variant.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <Card className="h-full border border-gray-200 bg-gradient-to-br from-white to-gray-50/50 hover:shadow-md hover:border-gray-300 transition-all duration-300 flex flex-col">
                  <div className="p-4 flex-1 flex flex-col">
                    {/* Header - Top section */}
                    <div className="flex flex-col gap-2">
                      <Badge variant="secondary" className="text-xs font-medium text-gray-600 bg-gray-100/80 border-gray-200">
                        Variant {index + 1}
                      </Badge>
                      <h3 className="font-semibold text-gray-900 text-base leading-tight line-clamp-3">
                        {variant.variant_label}
                      </h3>
                    </div>

                    {/* Bottom section - Status and actions */}
                    <div className="mt-auto flex flex-col gap-3 pt-4">
                      {/* Status indicator */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {variant.isPlaceholder ? (
                            <>
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-500">
                                {variant.isCompleted ? 'Processing...' : variant.isFailed ? 'Failed' : 'Creating...'}
                              </span>
                            </>
                          ) : (
                            <>
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              <span className="text-sm text-gray-600 font-medium">
                                {jobIds.length > 0 && improvedVariantByJobId[jobIds[index]] ? 'Improved' : 'Ready to preview'}
                              </span>
                            </>
                          )}
                        </div>
                        {!variant.isPlaceholder && (
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                        )}
                      </div>

                      {/* Action buttons - only for completed variants */}
                      {!variant.isPlaceholder && jobIds.length > 0 && (
                        <div className="pt-3 border-t border-gray-100">
                          <button
                            onClick={(e) => openFeedbackModal(jobIds[index], e)}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg transition-all duration-200 group"
                          >
                            <svg className="w-4 h-4 group-hover:scale-105 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Modify variant
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Variant Preview Modal */}
        {isModalOpen && selectedVariant && (
          <div 
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={closeModal}
          >
            <div 
              className="relative max-w-5xl max-h-[90vh] bg-white rounded-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedVariant.variant_label}</h3>
                  <p className="text-sm text-gray-600 mt-1">{selectedVariant.description}</p>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="size-5 text-gray-500" />
                </button>
              </div>
              <div className="p-4">
                <ScreenshotImage
                  screenshotPath={selectedVariant.screenshot || ''}
                  alt={`Screenshot of ${selectedVariant.variant_label}`}
                  className="max-w-full max-h-[70vh] w-auto h-auto rounded-lg border border-gray-200"
                />
              </div>
            </div>
          </div>
        )}

        {/* Simple Feedback Modal */}
        {isFeedbackModalOpen && selectedJobId && createPortal(
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={closeFeedbackModal}
          >
            <div 
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Improve Variant</h3>
                <button
                  onClick={closeFeedbackModal}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="size-5 text-gray-500" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What changes would you like to make?
                  </label>
                  <textarea
                    className="w-full text-sm border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 placeholder:text-gray-400"
                    rows={4}
                    placeholder="e.g., Make the button larger and change the color to blue"
                    value={feedbackByJobId[selectedJobId] || ''}
                    onChange={(e) =>
                      setFeedbackByJobId(prev => ({ ...prev, [selectedJobId]: e.target.value }))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={closeFeedbackModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  
                  <button
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      !projectId || !feedbackByJobId[selectedJobId] || isImprovingByJobId[selectedJobId]
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                    disabled={!projectId || !feedbackByJobId[selectedJobId] || isImprovingByJobId[selectedJobId]}
                    onClick={async () => {
                      try {
                        setIsImprovingByJobId(prev => ({ ...prev, [selectedJobId]: true }));
                        const feedback = (feedbackByJobId[selectedJobId] || '').trim();
                        if (!projectId || !feedback) return;
                        
                        const resp = await chatApi.improveVariant(selectedJobId, 0, projectId, feedback);
                        if (resp?.variant) {
                          setImprovedVariantByJobId(prev => ({ ...prev, [selectedJobId]: resp.variant }));
                        }
                        if (Array.isArray(resp?.improvements)) {
                          setImprovementsByJobId(prev => ({ ...prev, [selectedJobId]: resp.improvements }));
                        }
                        if (typeof resp?.confidence === 'number') {
                          const conf = resp.confidence as number;
                          setConfidenceByJobId(prev => ({ ...prev, [selectedJobId]: conf }));
                        }
                        
                        closeFeedbackModal();
                      } catch (err) {
                        console.error('Failed to improve variant', err);
                      } finally {
                        setIsImprovingByJobId(prev => ({ ...prev, [selectedJobId]: false }));
                      }
                    }}
                  >
                    {isImprovingByJobId[selectedJobId] ? (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Improving...
                      </div>
                    ) : (
                      'Make changes'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
      </>
    );
  }

  // Fallback for any other states
  return (
    <div data-stage="variants" data-function-call="generate_variants" className="mb-4 flex w-full flex-col gap-3 rounded-lg border border-gray-200 py-3">
      <div className="flex items-center gap-2 px-4">
        <AlertCircle className="size-4 text-gray-600" />
        <p className="text-gray-800 font-medium">No variants available</p>
      </div>
    </div>
  );
};