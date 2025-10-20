import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, X, AlertCircle, Clock, Check, RefreshCcw } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Variant, JobStatus } from "@/lib/chat-types";
import { chatApi } from "@/lib/chat-api";
import { getPreviewBaseUrl } from "@/lib/utils";
import { useVariantJobs } from "@/contexts/variant-jobs-context";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/auth-context";

export const VariantsDisplay = (props: any) => {
  const { toolName, argsText, result, status } = props;
  const { project } = useAuth();
  
  // Feedback modal states
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
  const [acceptedByJobId, setAcceptedByJobId] = useState<Record<string, boolean>>({});
  const [declinedByJobId, setDeclinedByJobId] = useState<Record<string, boolean>>({});
  const hasMountedRef = useRef(false);

  // Variant jobs context
  const { addVariantJob, updateVariantJobStatus, removeVariantJob } = useVariantJobs();


  // Handle variant click - open preview in new tab
  const handleVariantClick = (variant: Variant, jobId?: string) => {
    console.log('🖱️ Variant clicked:', variant.variant_label, 'jobId:', jobId);
    
    if (jobId) {
      const base = getPreviewBaseUrl(project || undefined);
      const previewUrl = `${base}/?preview=true&jobId=${jobId}`;
      console.log('🔗 Opening preview URL:', previewUrl);
      window.open(previewUrl, '_blank', 'noopener,noreferrer');
    } else {
      // No preview available without jobId
    }
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
    // mark mounted to avoid re-applying entrance delays on state toggles
    if (!hasMountedRef.current) hasMountedRef.current = true;
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
          
          // No screenshot handling
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
                className={`group relative overflow-hidden transition-transform duration-300 my-1 ${(() => {
                  const jobId = jobIds.length > 0 ? jobIds[index] : undefined;
                  const isDeclined = jobId && declinedByJobId[jobId] === true;
                  if (variant.isPlaceholder) {
                    return variant.isCompleted ? 'opacity-100' : (variant.isFailed ? 'opacity-60' : 'opacity-50');
                  }
                  return isDeclined ? 'opacity-60' : '';
                })()} ${(variant.isPlaceholder && !variant.isCompleted) ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                initial={{ opacity: 1, y: 20 }}
                animate={{ y: 0 }}
                whileHover={(() => {
                  const jobId = jobIds.length > 0 ? jobIds[index] : undefined;
                  const isDeclined = jobId && declinedByJobId[jobId] === true;
                  if (variant.isPlaceholder || isDeclined) return undefined;
                  return { scale: 1.01, y: -4 };
                })()}
                transition={{
                  duration: 0.25,
                  ease: "easeOut",
                  delay: hasMountedRef.current ? 0 : index * 0.05
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
                          {/* Accept / Decline / Regenerate row (full-width, same radius as Modify button) */}
                          <div className="mt-2.5 w-full grid grid-cols-3 gap-2.5">
                            {/* Accept */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const jobId = jobIds[index];
                                setAcceptedByJobId(prev => ({ ...prev, [jobId]: true }));
                                setDeclinedByJobId(prev => ({ ...prev, [jobId]: false }));
                              }}
                              className={`w-full h-10 inline-flex items-center justify-center rounded-lg border transition-colors ${(() => {
                                const jobId = jobIds[index];
                                return acceptedByJobId[jobId]
                                  ? 'bg-green-50 border-green-200 text-green-700'
                                  : 'bg-white border-gray-200/80 text-gray-700 hover:bg-gray-50 hover:border-gray-300';
                              })()}`}
                              aria-label="Accept variant"
                              title="Accept"
                            >
                              <Check className="w-4 h-4" />
                            </button>

                            {/* Decline */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const jobId = jobIds[index];
                                setDeclinedByJobId(prev => ({ ...prev, [jobId]: true }));
                                setAcceptedByJobId(prev => ({ ...prev, [jobId]: false }));
                              }}
                              className={`w-full h-10 inline-flex items-center justify-center rounded-lg border transition-colors ${(() => {
                                const jobId = jobIds[index];
                                return declinedByJobId[jobId]
                                  ? 'bg-red-50 border-red-200 text-red-700'
                                  : 'bg-white border-gray-200/80 text-gray-700 hover:bg-gray-50 hover:border-gray-300';
                              })()}`}
                              aria-label="Decline variant"
                              title="Decline"
                            >
                              <X className="w-4 h-4" />
                            </button>

                            {/* Regenerate */}
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                const jobId = jobIds[index];
                                try {
                                  setIsImprovingByJobId(prev => ({ ...prev, [jobId]: true }));
                                  const resp = await chatApi.improveVariant(jobId, 0, projectId || 'default-project', 'Regenerate an alternative version');
                                  if (resp?.variant) {
                                    setImprovedVariantByJobId(prev => ({ ...prev, [jobId]: resp.variant }));
                                  }
                                  if (Array.isArray(resp?.improvements)) {
                                    setImprovementsByJobId(prev => ({ ...prev, [jobId]: resp.improvements }));
                                  }
                                  if (typeof resp?.confidence === 'number') {
                                    const conf = resp.confidence as number;
                                    setConfidenceByJobId(prev => ({ ...prev, [jobId]: conf }));
                                  }
                                } catch (err) {
                                  console.error('Failed to regenerate variant', err);
                                } finally {
                                  setIsImprovingByJobId(prev => ({ ...prev, [jobId]: false }));
                                }
                              }}
                              className={`w-full h-10 inline-flex items-center justify-center rounded-lg border transition-colors ${(() => {
                                const jobId = jobIds[index];
                                return isImprovingByJobId[jobId]
                                  ? 'bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed'
                                  : 'bg-white border-gray-200/80 text-gray-700 hover:bg-gray-50 hover:border-gray-300';
                              })()}`}
                              disabled={(() => {
                                const jobId = jobIds[index];
                                return !!isImprovingByJobId[jobId];
                              })()}
                              aria-label="Regenerate variant"
                              title="Regenerate"
                            >
                              {(() => {
                                const jobId = jobIds[index];
                                return isImprovingByJobId[jobId] ? (
                                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
                                ) : (
                                  <RefreshCcw className="w-4 h-4" />
                                );
                              })()}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* No variant preview modal */}

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