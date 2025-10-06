'use client';

import React, { useState, useEffect } from 'react';
import { Experiment, experimentsApi, experimentUtils } from '@/lib/experiments-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle, 
  Trash2, 
  Eye, 
  Plus,
  MoreHorizontal,
  Calendar,
  Clock,
  Target
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ExperimentListProps {
  className?: string;
}

export function ExperimentList({ className }: ExperimentListProps) {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const router = useRouter();

  // Load experiments on mount
  useEffect(() => {
    loadExperiments();
  }, []);

  const loadExperiments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await experimentsApi.getExperiments();
      setExperiments(data);
    } catch (err) {
      console.error('Failed to load experiments:', err);
      setError(err instanceof Error ? err.message : 'Failed to load experiments');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, action: 'start' | 'pause' | 'resume' | 'complete') => {
    try {
      setActionLoading(id);
      await experimentsApi.updateStatus(id, action);
      await loadExperiments(); // Reload to get updated status
    } catch (err) {
      console.error('Failed to update experiment status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update experiment status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this experiment? This action cannot be undone.')) {
      return;
    }

    try {
      setActionLoading(id);
      await experimentsApi.deleteExperiment(id);
      await loadExperiments(); // Reload to remove deleted experiment
    } catch (err) {
      console.error('Failed to delete experiment:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete experiment');
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewDetails = (id: string) => {
    router.push(`/experiments/${id}`);
  };

  const handleCreateNew = () => {
    router.push('/experiments/create');
  };

  if (loading) {
    return (
      <div className={className}>
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading experiments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Experiments</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={loadExperiments} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (experiments.length === 0) {
    return (
      <div className={className}>
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Experiments Yet</h3>
          <p className="text-gray-500 mb-6">Create your first A/B test experiment to get started.</p>
          <Button onClick={handleCreateNew}>
            <Plus className="w-4 h-4 mr-2" />
            Create Experiment
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Experiments</h2>
          <p className="text-gray-600">Manage your A/B test experiments</p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="w-4 h-4 mr-2" />
          Create Experiment
        </Button>
      </div>

      <div className="grid gap-6">
        {experiments.map((experiment) => {
          const availableActions = experimentUtils.getAvailableActions(experiment.status);
          const canDelete = experimentUtils.canDelete(experiment.status);
          const isActionLoading = actionLoading === experiment.id;

          return (
            <Card key={experiment.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-lg">{experiment.name}</CardTitle>
                      <Badge className={experimentUtils.getStatusColor(experiment.status)}>
                        {experimentUtils.getStatusLabel(experiment.status)}
                      </Badge>
                    </div>
                    <p className="text-gray-600 text-sm">{experiment.oec}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(experiment.id)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    {canDelete && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(experiment.id)}
                        disabled={isActionLoading}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Created {experimentUtils.formatDate(experiment.createdAt)}</span>
                  </div>
                  {experiment.publishedAt && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>Duration: {experimentUtils.getDuration(experiment)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Target className="w-4 h-4" />
                    <span>Min {experiment.minSessionsPerVariant} sessions/variant</span>
                  </div>
                </div>

                {availableActions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {availableActions.map((action) => (
                      <Button
                        key={action.action}
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusUpdate(experiment.id, action.action)}
                        disabled={isActionLoading}
                        className="text-xs"
                      >
                        {action.action === 'start' && <Play className="w-3 h-3 mr-1" />}
                        {action.action === 'pause' && <Pause className="w-3 h-3 mr-1" />}
                        {action.action === 'resume' && <RotateCcw className="w-3 h-3 mr-1" />}
                        {action.action === 'complete' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

