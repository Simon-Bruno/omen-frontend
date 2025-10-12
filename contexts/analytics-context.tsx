'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AnalyticsContextType {
  selectedExperimentId: string | null;
  setSelectedExperimentId: (experimentId: string | null) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const [selectedExperimentId, setSelectedExperimentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <AnalyticsContext.Provider value={{
      selectedExperimentId,
      setSelectedExperimentId,
      loading,
      setLoading,
    }}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
}








