'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { analyticsApi, Experiment } from '@/lib/analytics-api';
import { ChevronDown } from 'lucide-react';

interface ExperimentSelectorProps {
  selectedExperimentId: string | null;
  onExperimentSelect: (experimentId: string) => void;
  projectId: string;
  disabled?: boolean;
}

export function ExperimentSelector({ 
  selectedExperimentId, 
  onExperimentSelect, 
  projectId,
  disabled = false 
}: ExperimentSelectorProps) {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadExperiments = async () => {
    if (!projectId) return;
    
    setLoading(true);
    
    try {
      const data = await analyticsApi.getExperiments(projectId);
      setExperiments(data);
      
      // Auto-select first experiment if none selected
      if (!selectedExperimentId && data.length > 0) {
        onExperimentSelect(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load experiments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExperiments();
  }, [projectId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedExperiment = experiments.find(exp => exp.id === selectedExperimentId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || loading}
        className="h-10 px-4 min-w-[200px] justify-between"
      >
        <div className="flex items-center gap-2">
          {selectedExperiment ? (
            <>
              <span className="truncate">{selectedExperiment.name}</span>
              <Badge 
                variant="secondary" 
                className={`text-xs ${getStatusColor(selectedExperiment.status)}`}
              >
                {selectedExperiment.status.toUpperCase()}
              </Badge>
            </>
          ) : (
            <span className="text-gray-500">
              {loading ? 'Loading...' : 'Select experiment'}
            </span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && experiments.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {experiments.map((experiment) => (
            <button
              key={experiment.id}
              onClick={() => {
                onExperimentSelect(experiment.id);
                setIsOpen(false);
              }}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {experiment.name}
                  </p>
                  {experiment.description && (
                    <p className="text-xs text-gray-500 truncate mt-1">
                      {experiment.description}
                    </p>
                  )}
                </div>
                <Badge 
                  variant="secondary" 
                  className={`text-xs ml-2 ${getStatusColor(experiment.status)}`}
                >
                  {experiment.status.toUpperCase()}
                </Badge>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
