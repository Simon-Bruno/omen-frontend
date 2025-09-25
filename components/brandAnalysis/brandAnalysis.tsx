import React, { useEffect, useState } from 'react';
import BrandAnalysisLoading from '../branding/BrandAnalysisLoading';
import { useAuth } from '@/contexts/auth-context';

const brandAnalysis: React.FC = () => {
  const { user, refetchUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const startBrandAnalysis = async () => {
      if (!user?.project?.id) {
        console.error('No project ID available');
        return;
      }

      try {
        console.log('Starting brand analysis for project:', user.project.id);

        // Start the brand analysis
        const response = await fetch('/api/brand-summary', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ projectId: user.project.id }),
        });

        if (!response.ok) {
          throw new Error('Failed to start brand analysis');
        }

        const data = await response.json();
        console.log('Brand analysis started:', data);

        // Poll for completion
        const pollInterval = setInterval(async () => {
          try {
            const statusResponse = await fetch(
              `/api/brand-summary/${data.jobId}?projectId=${user.project?.id}`
            );

            if (!statusResponse.ok) {
              throw new Error('Failed to check brand analysis status');
            }

            const statusData = await statusResponse.json();
            console.log('Brand analysis status:', statusData);

            if (statusData.status === 'completed') {
              clearInterval(pollInterval);
              // Refetch user data to get the updated brand analysis
              await refetchUser();
            } else if (statusData.status === 'failed') {
              clearInterval(pollInterval);
              setError('Brand analysis failed. Please try again.');
            }
          } catch (err) {
            console.error('Error checking brand analysis status:', err);
            clearInterval(pollInterval);
            setError('Failed to check analysis status');
          }
        }, 3000); // Poll every 3 seconds

        // Clean up interval on unmount
        return () => clearInterval(pollInterval);
      } catch (err) {
        console.error('Error starting brand analysis:', err);
        setError('Failed to start brand analysis');
      }
    };

    startBrandAnalysis();
  }, [user?.project?.id, refetchUser]);

  if (error) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return <BrandAnalysisLoading />;
};

export default brandAnalysis;
