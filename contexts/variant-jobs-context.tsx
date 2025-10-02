"use client";

import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface VariantJob {
  jobId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  projectId: string;
}

interface VariantJobsContextType {
  variantJobs: VariantJob[];
  addVariantJob: (jobId: string, projectId: string) => void;
  updateVariantJobStatus: (jobId: string, status: VariantJob['status']) => void;
  removeVariantJob: (jobId: string) => void;
  hasRunningVariantJobs: boolean;
}

const VariantJobsContext = createContext<VariantJobsContextType | undefined>(undefined);

export const useVariantJobs = () => {
  const context = useContext(VariantJobsContext);
  if (context === undefined) {
    throw new Error('useVariantJobs must be used within a VariantJobsProvider');
  }
  return context;
};

interface VariantJobsProviderProps {
  children: ReactNode;
}

export const VariantJobsProvider: React.FC<VariantJobsProviderProps> = ({ children }) => {
  const [variantJobs, setVariantJobs] = useState<VariantJob[]>([]);

  const addVariantJob = useCallback((jobId: string, projectId: string) => {
    setVariantJobs(prev => {
      // Check if job already exists
      if (prev.some(job => job.jobId === jobId)) {
        return prev;
      }
      return [...prev, { jobId, status: 'pending', projectId }];
    });
  }, []);

  const updateVariantJobStatus = useCallback((jobId: string, status: VariantJob['status']) => {
    setVariantJobs(prev => 
      prev.map(job => 
        job.jobId === jobId ? { ...job, status } : job
      )
    );
  }, []);

  const removeVariantJob = useCallback((jobId: string) => {
    setVariantJobs(prev => prev.filter(job => job.jobId !== jobId));
  }, []);

  const hasRunningVariantJobs = variantJobs.some(job => 
    job.status === 'pending' || job.status === 'running'
  );

  const contextValue: VariantJobsContextType = {
    variantJobs,
    addVariantJob,
    updateVariantJobStatus,
    removeVariantJob,
    hasRunningVariantJobs,
  };

  return (
    <VariantJobsContext.Provider value={contextValue}>
      {children}
    </VariantJobsContext.Provider>
  );
};
