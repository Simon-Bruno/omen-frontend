import { Card } from "@/components/ui/card";
import { Sparkles, CheckCircle, ChevronRight, Zap, Image, Eye, X, AlertCircle, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { Variant, JobStatus } from "@/lib/chat-types";
import { chatApi } from "@/lib/chat-api";

export const VariantsDisplay = (props: any) => {
  const { toolName, argsText, result, status } = props;
  const [isScreenshotModalOpen, setIsScreenshotModalOpen] = useState(false);
  const [selectedScreenshotVariant, setSelectedScreenshotVariant] = useState<Variant | null>(null);
  const [cardHoverStates, setCardHoverStates] = useState<Record<number, boolean>>({});
  const [jobIds, setJobIds] = useState<string[]>([]);
  const [jobStatuses, setJobStatuses] = useState<Record<string, JobStatus>>({});
  const [variants, setVariants] = useState<Variant[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [processedJobs, setProcessedJobs] = useState<Set<string>>(new Set());

  // Extract jobIds from function call result - only when function call is complete
  useEffect(() => {
    console.log('🔍 VariantsDisplay useEffect triggered:', {
      statusType: status.type,
      hasResult: !!result,
      currentJobIdsLength: jobIds.length,
      shouldProcess: status.type === "complete" && result && jobIds.length === 0,
      resultContent: result
    });

    if (status.type === "complete" && result && jobIds.length === 0) {
      try {
        const resultData = typeof result === "string" ? JSON.parse(result) : result;
        console.log('📊 Parsed result data:', {
          hasJobIds: !!resultData.jobIds,
          jobIdsArray: resultData.jobIds,
          hasVariantsSchema: !!resultData.variantsSchema,
          projectId: resultData.projectId
        });
        
        // Check if result contains jobIds (new flow)
        if (resultData.jobIds && Array.isArray(resultData.jobIds)) {
          console.log('🚀 Starting NEW job polling flow with jobIds:', resultData.jobIds);
          setJobIds(resultData.jobIds);
          setIsPolling(true);
          
          // Extract projectId from the result or use a default
          const extractedProjectId = resultData.projectId || 'default-project';
          setProjectId(extractedProjectId);
          console.log('📝 Set projectId:', extractedProjectId);
          
          // Start polling for each job
          resultData.jobIds.forEach((jobId: string, index: number) => {
            console.log(`🔄 Starting poll for job ${index + 1}/${resultData.jobIds.length}:`, jobId);
            pollJobStatus(jobId, extractedProjectId);
          });
        } else if (resultData.variantsSchema) {
          // Fallback to old direct variants flow
          console.log('📦 Using OLD direct variants flow');
          const parsedData = typeof resultData.variantsSchema === "string" 
            ? JSON.parse(resultData.variantsSchema) 
            : resultData.variantsSchema;
          console.log('📦 Parsed variants count:', parsedData.variants?.length || 0);
          setVariants(parsedData.variants || []);
        }
      } catch (e) {
        console.error("❌ Failed to parse result:", e);
      }
    } else {
      console.log('⏭️ Skipping processing - conditions not met');
    }
  }, [status, result, jobIds.length]);

  const pollJobStatus = async (jobId: string, projectId: string) => {
    try {
      await chatApi.pollJobStatus(
        jobId,
        projectId,
        (status) => {
          console.log(`📡 Job status update for ${jobId}:`, {
            status: status.status,
            progress: status.progress,
            hasResult: !!status.result,
            isCompleted: status.status === 'completed',
            alreadyProcessed: processedJobs.has(jobId)
          });

          setJobStatuses(prev => {
            const newStatuses = { ...prev, [jobId]: status };
            
            // Check if all jobs are complete
            const allJobs = Object.values(newStatuses);
            const completedCount = allJobs.filter(job => job.status === 'completed' || job.status === 'failed').length;
            const totalTrackedJobs = allJobs.length;
            console.log(`📊 Job completion status:`, {
              totalTrackedJobs,
              totalJobIds: jobIds.length,
              completedCount,
              allJobsComplete: totalTrackedJobs > 0 && completedCount === totalTrackedJobs,
              jobStatuses: Object.keys(newStatuses)
            });
            
            if (totalTrackedJobs > 0 && completedCount === totalTrackedJobs) {
              console.log(`🏁 All jobs complete! Stopping polling.`);
              setIsPolling(false);
            }
            
            return newStatuses;
          });

          // Process completed job results
          if (status.status === 'completed' && status.result && !processedJobs.has(jobId)) {
            console.log(`✅ Processing completed job ${jobId}. Variants before: ${variants.length}`);
            try {
              const resultData = typeof status.result === "string" ? JSON.parse(status.result) : status.result;
              const parsedData = typeof resultData.variantsSchema === "string" 
                ? JSON.parse(resultData.variantsSchema) 
                : resultData.variantsSchema;
              
              if (parsedData.variants) {
                setVariants(prev => {
                  const newVariants = [...prev, ...parsedData.variants];
                  console.log(`🔄 Variants after processing ${jobId}:`, newVariants.map(v => v.variant_label));
                  return newVariants;
                });
                setProcessedJobs(prev => new Set([...prev, jobId]));
                console.log(`📝 Added ${jobId} to processedJobs. Current processedJobs:`, Array.from(processedJobs));
              }
            } catch (e) {
              console.error(`❌ Failed to parse completed job ${jobId}:`, e);
            }
          } else if (status.status === 'completed' && processedJobs.has(jobId)) {
            console.log(`⏭️ Skipping already processed job ${jobId}`);
          }
        }
      );
      console.log(`🏁 Polling completed for job ${jobId}`);
    } catch (error) {
      console.error(`Failed to poll job ${jobId}:`, error);
      setJobStatuses(prev => {
        const newStatuses = {
          ...prev,
          [jobId]: {
            jobId,
            status: 'failed' as const,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        };
        
        // Check if all jobs are complete (including failed ones)
        const allJobs = Object.values(newStatuses);
        const completedCount = allJobs.filter(job => job.status === 'completed' || job.status === 'failed').length;
        const totalTrackedJobs = allJobs.length;
        if (totalTrackedJobs > 0 && completedCount === totalTrackedJobs) {
          console.log(`🏁 All jobs complete (error case)! Stopping polling.`);
          setIsPolling(false);
        }
        
        return newStatuses;
      });
    }
  };

  // Calculate job status variables
  const completedJobs = Object.values(jobStatuses).filter(job => job.status === 'completed').length;
  const failedJobs = Object.values(jobStatuses).filter(job => job.status === 'failed').length;
  const totalJobs = jobIds.length;
  const isAllJobsComplete = totalJobs > 0 && completedJobs + failedJobs === totalJobs;

  // Debug rendering state
  console.log('🎨 VariantsDisplay rendering state:', {
    statusType: status.type,
    isPolling,
    totalJobs,
    completedJobs,
    failedJobs,
    isAllJobsComplete,
    variantsCount: variants.length,
    jobIds,
    jobStatuses: Object.keys(jobStatuses),
    processedJobs: Array.from(processedJobs)
  });

  // Handle function call running state
  if (status.type === "running") {
    console.log('🔄 Rendering function call running state - waiting for job IDs');
    return (
      <>
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
                Preparing variants...
              </p>
              <p className="text-blue-600 text-sm">
                Setting up testable variations for your hypothesis
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
      </>
    );
  }

  // Handle function call incomplete state
  if (status.type === "incomplete") {
    return (
      <>
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
      </>
    );
  }

  // Handle job polling/completion state (when function call is complete and we have job IDs)
  if (status.type === "complete" && jobIds.length > 0) {
    console.log('🔄 Rendering job state - jobs are running or completed');

    // Create loading placeholders for each job, but use real data if completed
    const loadingVariants = jobIds.map((jobId, index) => {
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
          realVariant = parsedData.variants?.[0]; // Get the first variant from the job
        } catch (e) {
          console.error(`Failed to parse completed job ${jobId}:`, e);
        }
      }

      // Use real variant data if available, otherwise use placeholder
      if (realVariant) {
        console.log('✅ Using real variant data for job', jobId, ':', {
          variant_label: realVariant.variant_label,
          hasScreenshot: !!realVariant.screenshot,
          isPlaceholder: false
        });
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
        description: isCompleted ? 'Loading...' : isFailed ? 'Failed to generate' : `Generating... ${progress}%`,
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
    });

    return (
      <>
        <div className="mb-4 w-full">
          {/* Loading variant cards - same design as real variants */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {loadingVariants.map((variant, index) => {
              const handleVariantClick = (variant: any) => {
                console.log('🖱️ Variant clicked:', {
                  variant_label: variant.variant_label,
                  isPlaceholder: variant.isPlaceholder,
                  hasScreenshot: !!variant.screenshot,
                  screenshot: variant.screenshot
                });
                
                // Always show the variant details, even without screenshot
                if (variant.screenshot) {
                  console.log('🖼️ Setting screenshot variant and opening modal:', {
                    variant_label: variant.variant_label,
                    screenshot: variant.screenshot
                  });
                  setSelectedScreenshotVariant(variant);
                  setIsScreenshotModalOpen(true);
                  console.log('🖼️ Modal state should now be open');
                } else {
                  // For variants without screenshots, we could show a different modal or just log
                  console.log('📋 Variant details (no screenshot):', {
                    label: variant.variant_label,
                    description: variant.description,
                    rationale: variant.rationale
                  });
                  // You could add a different modal here for text-only variants
                }
              };

              return (
                <div
                  key={`loading-${index}`} 
                  className={`relative overflow-hidden transition-all duration-300 border rounded-lg ${
                    variant.isPlaceholder 
                      ? (variant.isCompleted 
                          ? 'opacity-100' 
                          : variant.isFailed 
                            ? 'opacity-60' 
                            : 'opacity-50')
                      : 'hover:shadow-lg hover:scale-105'
                  } ${variant.isPlaceholder ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  onClick={() => {
                    console.log('🖱️ Card clicked:', {
                      variant_label: variant.variant_label,
                      isPlaceholder: variant.isPlaceholder,
                      willCallHandler: !variant.isPlaceholder
                    });
                    if (!variant.isPlaceholder) {
                      handleVariantClick(variant);
                    }
                  }}
                >
                  {/* Loading overlay - only for placeholders */}
                  {(() => {
                    console.log('🎭 Rendering overlay check:', {
                      variant_label: variant.variant_label,
                      isPlaceholder: variant.isPlaceholder,
                      willShowOverlay: variant.isPlaceholder
                    });
                    return variant.isPlaceholder;
                  })() && (
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center">
                      <div className="flex flex-col items-center gap-2">
                        {variant.isCompleted ? (
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <div className="w-4 h-4 bg-green-600 rounded-full"></div>
                          </div>
                        ) : variant.isFailed ? (
                          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                            <div className="w-4 h-4 bg-red-600 rounded-full"></div>
                          </div>
                        ) : (
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <div className="w-4 h-4 bg-blue-600 rounded-full animate-pulse"></div>
                          </div>
                        )}
                        <span className="text-sm font-medium text-gray-700">
                          {variant.isCompleted ? 'Ready' : variant.isFailed ? 'Failed' : 'Processing...'}
                        </span>
                        {!variant.isCompleted && !variant.isFailed && (
                          <div className="w-24 bg-gray-200 rounded-full h-1">
                            <div
                              className="bg-blue-600 h-1 rounded-full transition-all duration-500"
                              style={{ width: `${variant.progress}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Card content - same as real variant cards */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 text-sm">
                        {variant.variant_label}
                      </h3>
                      {!variant.isPlaceholder && variant.screenshot && (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                            <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                          </div>
                        </div>
                      )}
                    </div>

                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {variant.description}
                    </p>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{variant.isPlaceholder ? 'Processing...' : 'Click to view details'}</span>
                      {!variant.isPlaceholder && <Zap className="size-3" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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
      </>
    );
  }

  // Show loading state only if we're polling but have no variants yet
  if (isPolling && totalJobs > 0) {
    console.log('⏳ Rendering loading state - polling with no variants yet');
    return (
      <>
        <div className="mb-4 flex w-full flex-col gap-3 rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 py-4">
          <div className="flex items-center gap-3 px-4">
            <div className="relative">
              <Clock className="size-5 animate-pulse text-blue-600" />
              <div className="absolute inset-0 animate-ping">
                <Clock className="size-5 text-blue-400 opacity-75" />
              </div>
            </div>
            <div>
              <p className="text-blue-800 font-medium">
                Processing variants... ({completedJobs}/{totalJobs} completed)
              </p>
              <p className="text-blue-600 text-sm">
                {failedJobs > 0 && `${failedJobs} failed, `}Generating testable variations for your hypothesis
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
      </>
    );
  }

  // Fallback for any other states
  console.log('❓ Rendering fallback state - no conditions met');
  return (
    <>
      <div className="mb-4 flex w-full flex-col gap-3 rounded-lg border border-gray-200 py-3">
        <div className="flex items-center gap-2 px-4">
          <AlertCircle className="size-4 text-gray-500" />
          <p className="text-gray-700">
            is Polling: {isPolling.toString()}
            Tool call status: {status.type}, job statusses: {JSON.stringify(jobStatuses)}
          </p>
        </div>
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
    </>
  );
};