'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { ExperimentDetails, experimentsApi, experimentUtils } from '@/lib/experiments-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle, 
  Trash2, 
  Calendar,
  Clock,
  Target,
  Users,
  Code,
  Palette
} from 'lucide-react';

export default function ExperimentDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [experiment, setExperiment] = useState<ExperimentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (id && typeof id === 'string') {
      loadExperiment();
    }
  }, [id]);

  const loadExperiment = async () => {
    if (!id || typeof id !== 'string') return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await experimentsApi.getExperiment(id);
      setExperiment(data);
    } catch (err) {
      console.error('Failed to load experiment:', err);
      setError(err instanceof Error ? err.message : 'Failed to load experiment');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (action: 'start' | 'pause' | 'resume' | 'complete') => {
    if (!experiment) return;
    
    try {
      setActionLoading(true);
      const updatedExperiment = await experimentsApi.updateStatus(experiment.id, action);
      setExperiment({ ...experiment, ...updatedExperiment });
    } catch (err) {
      console.error('Failed to update experiment status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update experiment status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!experiment) return;
    
    if (!confirm('Are you sure you want to delete this experiment? This action cannot be undone.')) {
      return;
    }

    try {
      setActionLoading(true);
      await experimentsApi.deleteExperiment(experiment.id);
      router.push('/analytics');
    } catch (err) {
      console.error('Failed to delete experiment:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete experiment');
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
        <div className="w-10 h-10 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading experiment...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Experiment</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={loadExperiment} variant="outline">
                Try Again
              </Button>
              <Button onClick={() => router.push('/analytics')} variant="ghost">
                Back to Analytics
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!experiment) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Experiment Not Found</h3>
            <p className="text-gray-500 mb-4">The experiment you're looking for doesn't exist or has been deleted.</p>
            <Button onClick={() => router.push('/analytics')} variant="outline">
              Back to Analytics
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const availableActions = experimentUtils.getAvailableActions(experiment.status);
  const canDelete = experimentUtils.canDelete(experiment.status);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/analytics')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Analytics
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{experiment.name}</h1>
                <Badge className={experimentUtils.getStatusColor(experiment.status)}>
                  {experimentUtils.getStatusLabel(experiment.status)}
                </Badge>
              </div>
              <p className="text-gray-600 text-lg">{experiment.oec}</p>
            </div>
            
            <div className="flex items-center gap-2">
              {availableActions.map((action) => (
                <Button
                  key={action.action}
                  onClick={() => handleStatusUpdate(action.action)}
                  disabled={actionLoading}
                  variant={action.action === 'start' ? 'default' : 'outline'}
                >
                  {action.action === 'start' && <Play className="w-4 h-4 mr-2" />}
                  {action.action === 'pause' && <Pause className="w-4 h-4 mr-2" />}
                  {action.action === 'resume' && <RotateCcw className="w-4 h-4 mr-2" />}
                  {action.action === 'complete' && <CheckCircle className="w-4 h-4 mr-2" />}
                  {action.label}
                </Button>
              ))}
              {canDelete && (
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  disabled={actionLoading}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Experiment Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Experiment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Created:</span>
                <span>{experimentUtils.formatDate(experiment.createdAt)}</span>
              </div>
              {experiment.publishedAt && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Duration:</span>
                  <span>{experimentUtils.getDuration(experiment)}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Min Sessions:</span>
                <span>{experiment.minSessionsPerVariant.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Min Days:</span>
                <span>{experiment.minDays}</span>
              </div>
            </CardContent>
          </Card>

          {/* Hypothesis */}
          <Card>
            <CardHeader>
              <CardTitle>Hypothesis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Hypothesis</h4>
                  <p className="text-sm text-gray-600">{experiment.hypothesis.hypothesis}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Rationale</h4>
                  <p className="text-sm text-gray-600">{experiment.hypothesis.rationale}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Primary KPI</h4>
                  <p className="text-sm text-gray-600">{experiment.hypothesis.primaryKpi}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Traffic Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Traffic Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {experiment.traffic.map((traffic) => (
                  <div key={traffic.variantId} className="flex justify-between items-center">
                    <span className="font-medium">{traffic.variantId}</span>
                    <span className="text-sm text-gray-600">
                      {(parseFloat(traffic.percentage) * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Variants */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              Variants ({experiment.variants.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {experiment.variants.map((variant) => (
                <div key={variant.id} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline">{variant.variantId}</Badge>
                    <Badge variant="secondary" className="text-xs">
                      {variant.position}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Selector:</span>
                      <code className="ml-1 text-xs bg-gray-100 px-1 rounded">
                        {variant.selector}
                      </code>
                    </div>
                    
                    {variant.html && (
                      <div>
                        <span className="font-medium text-gray-600">HTML:</span>
                        <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                          {variant.html}
                        </pre>
                      </div>
                    )}
                    
                    {variant.css && (
                      <div>
                        <span className="font-medium text-gray-600">CSS:</span>
                        <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                          {variant.css}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}






