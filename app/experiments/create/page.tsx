'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { ManualExperimentForm } from '@/components/experiments/ManualExperimentForm';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CreateExperimentPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
        <div className="w-10 h-10 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleSuccess = (experimentId: string) => {
    router.push('/analytics');
  };

  const handleCancel = () => {
    router.push('/analytics');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Analytics
          </Button>

          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create New Experiment</h1>
            <p className="text-gray-600 mt-1">
              Manually create an A/B test experiment with custom variants and settings
            </p>
          </div>
        </div>

        {/* Form */}
        <ManualExperimentForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>
    </div>
  );
}
