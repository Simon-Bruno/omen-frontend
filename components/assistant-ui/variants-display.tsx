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
          
          // Start polling for each job immediately
          resultData.jobIds.forEach((jobId: string, index: number) => {
            console.log(`🔄 Starting poll for job ${index + 1}/${resultData.jobIds.length}:`, jobId);
            pollJobStatus(jobId, extractedProjectId);
          });
        } else if (resultData.variantsSchema) {
          console.log('📦 Using OLD direct variants flow');
          // Handle old flow with direct variants (fallback)
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
    console.log(`🎯 Starting pollJobStatus for job: ${jobId}`);
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
            
            // Only stop polling if we have jobs and they're all complete
            if (totalTrackedJobs > 0 && completedCount === totalTrackedJobs) {
              console.log(`🏁 All jobs complete! Stopping polling.`);
              setIsPolling(false);
            }
            
            return newStatuses;
          });
          
          // If job completed, extract variants from result (only process once)
          if (status.status === 'completed' && status.result && !processedJobs.has(jobId)) {
            console.log(`✅ Processing completed job ${jobId} for the first time`);
            try {
              const resultData = typeof status.result === "string" ? JSON.parse(status.result) : status.result;
              const parsedData = typeof resultData.variantsSchema === "string" 
                ? JSON.parse(resultData.variantsSchema) 
                : resultData.variantsSchema;
              
              console.log(`📦 Extracted variants from job ${jobId}:`, {
                variantsCount: parsedData.variants?.length || 0,
                variantLabels: parsedData.variants?.map((v: any) => v.variant_label) || []
              });
              
              if (parsedData.variants) {
                setVariants(prev => {
                  const newVariants = [...prev, ...parsedData.variants];
                  console.log(`🔄 Updated variants array:`, {
                    previousCount: prev.length,
                    addedCount: parsedData.variants.length,
                    newTotalCount: newVariants.length
                  });
                  return newVariants;
                });
                setProcessedJobs(prev => {
                  const newProcessed = new Set([...prev, jobId]);
                  console.log(`📝 Added job ${jobId} to processed jobs:`, Array.from(newProcessed));
                  return newProcessed;
                });
              }
            } catch (e) {
              console.error(`❌ Failed to parse job result for ${jobId}:`, e);
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
        
        // Check if all jobs are complete
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

  const handleCardHover = (index: number, isHovering: boolean) => {
    setCardHoverStates(prev => ({ ...prev, [index]: isHovering }));
  };

  const handleScreenshotClick = (variant: Variant, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card click
    setSelectedScreenshotVariant(variant);
    setIsScreenshotModalOpen(true);
  };

  // Handle function call running state - the function call that will create jobs
  if (status.type === "running") {
    console.log('🔄 Rendering function call running state - waiting for job IDs');
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
    );
  }

  // Calculate job status variables (needed for both polling and final states)
  const completedJobs = Object.values(jobStatuses).filter(job => job.status === 'completed').length;
  const failedJobs = Object.values(jobStatuses).filter(job => job.status === 'failed').length;
  const totalJobs = jobIds.length;
  const isAllJobsComplete = totalJobs > 0 && completedJobs + failedJobs === totalJobs;

  // Handle function call complete and job polling state (including when all jobs are done)
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
      <div className="mb-4 w-full">
        {/* Loading variant cards - same design as real variants */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {loadingVariants.map((variant, index) => {
            const handleVariantClick = (variant: any) => {
              if (variant.screenshot) {
                setSelectedScreenshotVariant(variant);
                setIsScreenshotModalOpen(true);
              }
            };

            return (
              <Card 
                key={`loading-${index}`} 
                className={`relative overflow-hidden transition-all duration-300 ${
                  variant.isPlaceholder 
                    ? (variant.isCompleted 
                        ? 'opacity-100' 
                        : variant.isFailed 
                          ? 'opacity-60' 
                          : 'opacity-50')
                    : 'hover:shadow-lg hover:scale-105'
                } ${variant.isPlaceholder ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                onClick={() => !variant.isPlaceholder && handleVariantClick(variant)}
              >
                {/* Loading overlay - only for placeholders */}
                {variant.isPlaceholder && (
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
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // Handle function call incomplete state
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

  // Now handle job-based rendering (only when function call is complete)

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

  // Show variants if we have any (regardless of job completion status)
  if (variants.length > 0) {
    console.log('📋 Rendering variants display with', variants.length, 'variants');
    const handleVariantClick = (variant: Variant) => {
      if (variant.screenshot) {
        setSelectedScreenshotVariant(variant);
        setIsScreenshotModalOpen(true);
      }
    };

    return (
      <div className="mb-4 w-full">


        {/* Variants grid */}
        <div className={`grid gap-4 ${
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
  }

  // Show loading state only if we're polling but have no variants yet
  if (isPolling && totalJobs > 0) {
    console.log('⏳ Rendering loading state - polling with no variants yet');
    return (
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
    );
  }


  // Fallback for any other states
  console.log('❓ Rendering fallback state - no conditions met');
  return (
    <div className="mb-4 flex w-full flex-col gap-3 rounded-lg border border-gray-200 py-3">
      <div className="flex items-center gap-2 px-4">
        <AlertCircle className="size-4 text-gray-500" />
        <p className="text-gray-700">
          is Polling: {isPolling.toString()}
          Tool call status: {status.type}, job statusses: {JSON.stringify(jobStatuses)}
        </p>
      </div>
    </div>
  );
};
