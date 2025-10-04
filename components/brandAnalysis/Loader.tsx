import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const Loader = () => {
  const { user, refetchUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [retrying, setRetrying] = useState(false);

  // Start the brand summary generation
  useEffect(() => {
    const startGeneration = async () => {
      if (!user?.project?.id) {
        setError('No project ID available');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/brand-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId: user.project.id }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to start brand summary generation');
        }

        const data = await response.json();
        setJobId(data.jobId);
        setLoading(false);
        setRetryCount(0); // Reset retry count on success
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);

        // Retry after 5 seconds if we haven't exceeded max retries
        if (retryCount < 3) {
          setRetrying(true);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            setRetrying(false);
            setError(null);
          }, 5000);
        }
      }
    };

    startGeneration();
  }, [user?.project?.id, retryCount]);

  // Poll for status if we have a jobId
  useEffect(() => {
    if (!jobId || !user?.project?.id) return;

    let interval: NodeJS.Timeout | null = null;

    const pollStatus = async () => {
      try {
        console.log('Project ID:', user.project?.id);
        const response = await fetch(`/api/brand-summary/${jobId}?projectId=${user.project?.id}`);
        if (response.ok) {
          const data = await response.json();
          setStatus(data.status);

          // Stop polling if job is completed or failed
          if (data.status === 'completed' || data.status === 'failed') {
            if (interval) {
              clearInterval(interval);
              interval = null;
            }

            // If completed, refetch user profile to get updated brandAnalysis
            if (data.status === 'completed') {
              console.log('Brand summary completed, refetching user profile...');
              await refetchUser();
            }

            return true; // Signal to stop polling
          }
        } else {
          console.error('Status check failed:', response.status, response.statusText);
        }
      } catch (err) {
        console.error('Failed to check status:', err);
      }
      return false; // Continue polling
    };

    // Poll immediately, then every 2 seconds
    pollStatus().then((shouldStop) => {
      if (!shouldStop) {
        interval = setInterval(async () => {
          const shouldStop = await pollStatus();
          if (shouldStop && interval) {
            clearInterval(interval);
            interval = null;
          }
        }, 2000);
      }
    });

    // Cleanup function
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [jobId, user?.project?.id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-lg font-medium">Starting brand summary generation...</p>
      </div>
    );
  }

  if (error && !retrying) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <XCircle className="h-8 w-8 text-red-600" />
        <p className="text-lg font-medium text-red-600">Failed to start generation</p>
        <p className="text-sm text-gray-500">{error}</p>
        {retryCount < 3 && (
          <p className="text-sm text-blue-500">Retrying in 5 seconds... (Attempt {retryCount + 1} of 3)</p>
        )}
      </div>
    );
  }

  if (retrying) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-lg font-medium">Retrying...</p>
        <p className="text-sm text-gray-500">Attempt {retryCount + 1} of 3</p>
      </div>
    );
  }

  if (status === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-lg font-medium">Generating brand summary...</p>
        <p className="text-sm text-gray-500">This may take a few minutes</p>
      </div>
    );
  }

  if (status === 'completed') {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <CheckCircle className="h-8 w-8 text-green-600" />
        <p className="text-lg font-medium text-green-600">Brand summary completed!</p>
        <p className="text-sm text-gray-500">Redirecting to home...</p>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <XCircle className="h-8 w-8 text-red-600" />
        <p className="text-lg font-medium text-red-600">Generation failed</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      <p className="text-lg font-medium">Checking status...</p>
    </div>
  );
};

export default Loader;