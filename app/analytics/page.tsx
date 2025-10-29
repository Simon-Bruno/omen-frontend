'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useAnalytics } from '@/contexts/analytics-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
// Components commented out - need updating for new ExperimentSummary format
// import { FunnelChart } from '@/components/analytics/FunnelChart';
// import { ConversionTable } from '@/components/analytics/ConversionTable';
// import { PurchaseStats } from '@/components/analytics/PurchaseStats';
// import { ExposureStats } from '@/components/analytics/ExposureStats';
import { UserJourney } from '@/components/analytics/UserJourney';
import { ExperimentSelector } from '@/components/analytics/ExperimentSelector';
import { ExperimentList } from '@/components/experiments/ExperimentList';
import { RawEventsTable } from '@/components/analytics/RawEventsTable';
import { analyticsApi, checkAuthStatus, ExperimentSummary, UserJourneyEvent, SessionListItem, SessionDetails } from '@/lib/analytics-api';
import { Calendar, RefreshCw, TrendingUp, Users, Target, BarChart3, Plus, Trash2, Settings, ChevronDown, Database, DollarSign, FileText } from 'lucide-react';

export default function AnalyticsPage() {
  const { isAuthenticated, isLoading, user, project } = useAuth();
  const { selectedExperimentId, setSelectedExperimentId, loading, setLoading } = useAnalytics();
  const router = useRouter();
  
  // State management
  const [activeTab, setActiveTab] = useState<'overview' | 'experiments' | 'funnel' | 'conversions' | 'purchases' | 'traffic' | 'journey' | 'events'>('overview');
  const [error, setError] = useState<string | null>(null);
  const [useMockData, setUseMockData] = useState(false); // Toggle for mock vs real data
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  // Selection state
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  
  // Data state - simplified to use single summary
  const [summaryData, setSummaryData] = useState<ExperimentSummary | null>(null);
  const [journeyData, setJourneyData] = useState<UserJourneyEvent[]>([]);
  const [sessionDetails, setSessionDetails] = useState<SessionDetails | null>(null);
  const [totalSessionCount, setTotalSessionCount] = useState<number>(0);
  
  // Sliding underline indicator state for tabs
  const tabsContainerRef = React.useRef<HTMLDivElement | null>(null);
  const tabRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicator, setIndicator] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

  // Update indicator function
  const updateIndicator = () => {
    const container = tabsContainerRef.current;
    const activeEl = tabRefs.current[activeTab];
    if (!container || !activeEl) return;
    const containerRect = container.getBoundingClientRect();
    const activeRect = activeEl.getBoundingClientRect();
    setIndicator({ left: activeRect.left - containerRect.left, width: activeRect.width });
  };
  
  // TODO: Components (FunnelChart, ConversionTable, PurchaseStats, ExposureStats) need updating to use ExperimentSummary format

  // Load sessions when experiment changes
  useEffect(() => {
    if (selectedExperimentId) {
      loadSessions();
    } else {
      setSessions([]);
      setSelectedSessionId(null);
    }
  }, [selectedExperimentId]);

  // Load session details when session is selected
  useEffect(() => {
    if (selectedSessionId) {
      loadSessionDetails();
    } else {
      setSessionDetails(null);
      setJourneyData([]);
    }
  }, [selectedSessionId]);

  // Load data based on toggle state and selections
  useEffect(() => {
    // Only load data if we're authenticated and not loading
    if (isAuthenticated && !isLoading && selectedExperimentId) {
      loadData();
    }
  }, [useMockData, isAuthenticated, isLoading, selectedExperimentId, selectedSessionId]);

  // Function to load detailed session information
  const loadSessionDetails = async () => {
    if (!selectedSessionId) return;
    
    try {
      const details = await analyticsApi.getSessionDetails(selectedSessionId);
      setSessionDetails(details);
      setJourneyData(details.journey);
    } catch (err) {
      console.error('Failed to load session details:', err);
      setSessionDetails(null);
      setJourneyData([]);
    }
  };

  // Function to load sessions for selected experiment
  const loadSessions = async () => {
    if (!selectedExperimentId) return;

    try {
      const data = await analyticsApi.getExperimentSessions(selectedExperimentId, 100, 0);

      // Store the total session count - this is the REAL count from the backend
      setTotalSessionCount(data.total);

      // Sort sessions by event count (descending) to show most active sessions first
      // This helps users find sessions with more interesting activity
      const sortedSessions = data.sessions.sort((a, b) => b.eventCount - a.eventCount);
      setSessions(sortedSessions);

      // Auto-select first session if none selected
      if (!selectedSessionId && sortedSessions.length > 0) {
        setSelectedSessionId(sortedSessions[0].sessionId);
      }
    } catch (err) {
      console.error('Failed to load sessions:', err);
      setSessions([]);
      setTotalSessionCount(0);
    }
  };

  // Function to load data - simplified to use single summary endpoint
  const loadData = async () => {
    if (useMockData) {
      // Mock data removed - components need to be updated to use summary format
      setError('Mock data not supported with new API format');
      setLoading(false);
      return;
    }

    // Load real data from API
    setLoading(true);
    setError(null);
    
    try {
      const experimentId = selectedExperimentId;
      
      if (!experimentId) {
        setError('No experiment selected');
        setLoading(false);
        return;
      }
      
      // Single API call - everything in one request!
      const summary = await analyticsApi.getExperimentSummary(experimentId);
      
      setSummaryData(summary);
      setTotalSessionCount(summary.totalSessions);
      
    } catch (err) {
      console.error('Failed to load analytics data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
      setSummaryData(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle reset analytics data
  const handleResetAnalytics = async () => {
    if (!selectedExperimentId) {
      setError('No experiment selected');
      return;
    }

    setIsResetting(true);
    setError(null);

    try {
      const result = await analyticsApi.resetExperimentEvents(selectedExperimentId);

      if (result.success) {
        // Reload data after successful reset
        await loadData();
        setError(null);
        // Show success message
        console.log(`Successfully reset analytics: ${result.message}`);
      } else {
        setError('Failed to reset analytics data');
      }
    } catch (err) {
      console.error('Failed to reset analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to reset analytics data');
    } finally {
      setIsResetting(false);
      setShowResetConfirm(false);
    }
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Update indicator when activeTab changes
  useEffect(() => {
    updateIndicator();
    const onResize = () => updateIndicator();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [activeTab]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'experiments', label: 'Experiments', icon: Target },
    { id: 'funnel', label: 'Funnel Analysis', icon: TrendingUp },
    { id: 'conversions', label: 'A/B Test Results', icon: Target },
    { id: 'purchases', label: 'Purchase Analytics', icon: DollarSign },
    { id: 'traffic', label: 'Traffic Overview', icon: Users },
    { id: 'journey', label: 'User Journey', icon: Calendar },
    { id: 'events', label: 'Raw Events', icon: Database },
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         <div className="bg-white rounded-lg border border-slate-200 p-6">
           <div className="mb-2">
             <h3 className="text-sm font-semibold text-slate-700">Total Sessions</h3>
           </div>
          <div className="text-3xl font-semibold text-slate-900 mb-1">
            {summaryData?.totalSessions.toLocaleString() || totalSessionCount.toLocaleString() || '0'}
          </div>
          <div className="flex items-center gap-1 text-sm text-slate-500">
            <span>{summaryData?.variants.reduce((sum, v) => sum + v.exposures, 0).toLocaleString() || '0'}</span>
            <span>exposures</span>
          </div>
        </div>
        
         <div className="bg-white rounded-lg border border-slate-200 p-6">
           <div className="mb-2">
             <h3 className="text-sm font-semibold text-slate-700">Conversion Rate</h3>
           </div>
          <div className="text-3xl font-semibold text-slate-900 mb-1">
            {summaryData && summaryData.variants.length > 0 && summaryData.variants[0].goals.length > 0
              ? (summaryData.variants[0].goals[0].conversionRate * 100).toFixed(2) 
              : '0.00'}%
          </div>
          <div className="flex items-center gap-1 text-sm text-slate-500">
            <span>{summaryData?.variants.reduce((sum, v) => sum + v.goals.reduce((gSum, g) => gSum + g.conversions, 0), 0).toLocaleString() || '0'}</span>
            <span>conversions</span>
          </div>
        </div>
        
         <div className="bg-white rounded-lg border border-slate-200 p-6">
           <div className="mb-2">
             <h3 className="text-sm font-semibold text-slate-700">Active Variants</h3>
           </div>
          <div className="text-3xl font-semibold text-slate-900 mb-1">
            {summaryData?.variants.length || 0}
          </div>
          <div className="text-sm text-slate-500">
            {summaryData?.variants.map((v) => v.variantId).join(', ') || 'None'}
          </div>
        </div>
        
         <div className="bg-white rounded-lg border border-slate-200 p-6">
           <div className="mb-2">
             <h3 className="text-sm font-semibold text-slate-700">Best Performer</h3>
           </div>
          <div className="text-3xl font-semibold text-slate-900 mb-1">
            {summaryData?.variants && summaryData.variants.length > 0 
              ? summaryData.variants.reduce((best, current) => {
                  const bestRate = (best.goals[0]?.conversionRate || 0) * 100;
                  const currentRate = (current.goals[0]?.conversionRate || 0) * 100;
                  return currentRate > bestRate ? current : best;
                }).variantId 
              : 'N/A'}
          </div>
          <div className="text-sm text-slate-500">
            {summaryData?.variants && summaryData.variants.length > 0 
              ? ((summaryData.variants.reduce((best, current) => {
                  const bestRate = (best.goals[0]?.conversionRate || 0) * 100;
                  const currentRate = (current.goals[0]?.conversionRate || 0) * 100;
                  return currentRate > bestRate ? current : best;
                }).goals[0]?.conversionRate || 0) * 100).toFixed(2) + '% conversion'
              : '0.00% conversion'}
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    // Show selection prompt if no experiment is selected
    if (!selectedExperimentId) {
      return (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">Select an Experiment</h3>
          <p className="text-slate-500 max-w-md mx-auto">Choose an experiment from the dropdown above to view analytics data and performance insights.</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {loading && !summaryData ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg border border-slate-200 p-6 animate-pulse">
                    <div className="h-4 bg-slate-200 rounded mb-2"></div>
                    <div className="h-8 bg-slate-200 rounded mb-1"></div>
                    <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : (
              renderOverview()
            )}
          </div>
        );
      case 'experiments':
        return <ExperimentList />;
      case 'funnel':
        return <div className="text-center py-16 text-slate-500">Funnel analysis - component needs updating for new API format</div>;
      case 'conversions':
        return (
          <div className="space-y-6">
            {/* Goals breakdown from summary */}
            {summaryData && summaryData.variants.length > 0 && summaryData.variants[0].goals.length > 0 ? (
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Goals Breakdown</h3>
                {/* Debug info */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="text-xs text-gray-500 mb-2">
                    <details>
                      <summary className="cursor-pointer text-blue-600 hover:text-blue-700">Debug: Raw Goals Data</summary>
                      <pre className="mt-1 p-2 bg-gray-50 rounded overflow-x-auto">
                        {JSON.stringify(summaryData, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-600 border-b">
                        <th className="py-2 pr-4">Goal</th>
                        <th className="py-2 pr-4">Type</th>
                        {summaryData.variants.map((v) => (
                          <th key={v.variantId} className="py-2 pr-4">{v.variantId} Conv.</th>
                        ))}
                        <th className="py-2 pr-4">Uplift vs Control</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summaryData.variants[0].goals.map((goal) => {
                        const controlId = summaryData.variants[0].variantId;
                        const controlConv = summaryData.variants[0].goals.find(g => g.name === goal.name)?.conversions || 0;
                        const bestVariant = summaryData.variants.slice(1).reduce((best, variant) => {
                          const bestConv = best.goals.find(g => g.name === goal.name)?.conversions || 0;
                          const currentConv = variant.goals.find(g => g.name === goal.name)?.conversions || 0;
                          return currentConv > bestConv ? variant : best;
                        }, summaryData.variants[0]);
                        const bestConv = bestVariant.goals.find(g => g.name === goal.name)?.conversions || 0;
                        const uplift = controlConv > 0 ? ((bestConv - controlConv) / controlConv) * 100 : (bestConv > 0 ? 100 : 0);
                        return (
                          <tr key={goal.name} className="border-b last:border-0">
                            <td className="py-2 pr-4 font-medium text-slate-800">{goal.name}</td>
                            <td className="py-2 pr-4 text-slate-600">{goal.type}</td>
                            {summaryData.variants.map((v) => {
                              const goalData = v.goals.find(g => g.name === goal.name);
                              return <td key={v.variantId} className="py-2 pr-4">{goalData?.conversions || 0}</td>;
                            })}
                            <td className="py-2 pr-4">
                              <span className={`${uplift >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{uplift.toFixed(1)}%</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Goals Breakdown</h3>
                <p className="text-slate-500 text-sm">No goals data available. This could mean:</p>
                <ul className="mt-2 text-sm text-slate-500 list-disc ml-5">
                  <li>No goals are configured for this experiment</li>
                  <li>Goal names in the database don't match event goal names</li>
                  <li>Events are using different variant keys than expected (check Raw Events tab)</li>
                </ul>
              </div>
            )}
          </div>
        );
      case 'purchases':
        return summaryData ? (
          <div className="space-y-4">
            {summaryData.variants.map((variant) => (
              <Card key={variant.variantId} className="p-4">
                <CardTitle className="text-lg mb-2">{variant.variantId}</CardTitle>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-slate-500">Revenue</div>
                    <div className="font-semibold">${variant.revenue.totalRevenue.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Purchases</div>
                    <div className="font-semibold">{variant.revenue.purchases}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Purchase Rate</div>
                    <div className="font-semibold">{(variant.revenue.purchaseRate * 100).toFixed(2)}%</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Avg Order Value</div>
                    <div className="font-semibold">${variant.revenue.avgOrderValue.toFixed(2)}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : <div>No purchase data available</div>;
      case 'traffic':
        return summaryData ? (
          <div className="space-y-4">
            {summaryData.variants.map((variant) => (
              <Card key={variant.variantId} className="p-4">
                <CardTitle className="text-lg mb-2">{variant.variantId}</CardTitle>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-slate-500">Sessions</div>
                    <div className="font-semibold">{variant.sessions.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Exposures</div>
                    <div className="font-semibold">{variant.exposures.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Pageviews</div>
                    <div className="font-semibold">{variant.pageviews.toLocaleString()}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : <div>No traffic data available</div>;
      case 'journey':
        if (!selectedExperimentId) {
          return (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">Select an Experiment</h3>
              <p className="text-slate-500 max-w-md mx-auto">Choose an experiment to view detailed user journeys and session analytics.</p>
            </div>
          );
        }
        return <UserJourney
          data={journeyData}
          sessions={sessions}
          selectedSessionId={selectedSessionId}
          sessionDetails={sessionDetails}
          onSessionSelect={(sessionId) => setSelectedSessionId(sessionId)}
        />;
      case 'events':
        return <RawEventsTable experimentId={selectedExperimentId || undefined} sessionId={selectedSessionId || undefined} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="h-full  py-6 flex flex-col max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold text-slate-700">Analytics Dashboard</h1>
              <p className="text-sm text-slate-500 mt-1">
                {selectedExperimentId ? 'Experiment insights and performance metrics' : 'Select an experiment to view analytics'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Experiment Selector */}
              {project?.id && (
                <ExperimentSelector
                  selectedExperimentId={selectedExperimentId}
                  onExperimentSelect={setSelectedExperimentId}
                  projectId={project.id}
                  disabled={loading}
                />
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 px-3 text-sm">
                    <Settings className="w-4 h-4 mr-1" />
                    Settings
                    <ChevronDown className="w-3 h-3 ml-1 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="text-xs font-medium text-slate-500">Quick Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => router.push('/experiments/create')} className="text-sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Experiment
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => loadData()} disabled={loading || !selectedExperimentId} className="text-sm">
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Loading...' : 'Refresh Data'}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => setUseMockData(!useMockData)}
                    disabled={loading}
                    className="text-sm"
                  >
                    <Database className="w-4 h-4 mr-2" />
                    {useMockData ? 'Use Live Data' : 'Use Mock Data'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => setShowResetConfirm(true)}
                    disabled={loading || isResetting || !selectedExperimentId}
                    className="text-sm text-red-600 focus:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Reset Data
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {showResetConfirm && (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-sm text-red-600">Reset all data?</span>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleResetAnalytics}
              disabled={isResetting}
            >
              {isResetting ? 'Resetting...' : 'Confirm'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResetConfirm(false)}
              disabled={isResetting}
            >
              Cancel
            </Button>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-slate-200 mb-6">
          <nav className="-mb-px flex items-center justify-between">
            <div ref={tabsContainerRef} className="relative flex space-x-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    ref={(el) => { tabRefs.current[tab.id] = el; }}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 py-3 px-1 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'text-slate-900'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
              <div
                aria-hidden
                className="pointer-events-none absolute -bottom-px h-[2px] rounded bg-slate-900 transition-all duration-300 ease-out"
                style={{ left: `${indicator.left}px`, width: `${indicator.width}px` }}
              />
            </div>
            
            {/* Mock Data Badge */}
            <Badge 
              className={`rounded-full ${
                useMockData 
                  ? 'bg-amber-100 text-amber-700 border-amber-200' 
                  : 'bg-emerald-100 text-emerald-700 border-emerald-200'
              }`}
            >
              {useMockData ? 'Mock Data' : 'Live Data'}
            </Badge>
          </nav>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-red-800">Error Loading Analytics</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
                {error.includes('Authentication required') && (
                  <div className="mt-2 text-xs text-red-600">
                    <p>💡 <strong>Debug tips:</strong></p>
                    <ul className="mt-1 ml-4 list-disc">
                      <li>Check if you're logged in (look for user info in top-right)</li>
                      <li>Open browser dev tools → Application → Cookies</li>
                      <li>Look for 'better-auth.session_token' cookie</li>
                      <li>Try refreshing the page and logging in again</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-700">Loading analytics data...</p>
            </div>
          </div>
        )}


        {/* Content */}
        {renderContent()}
      </div>
    </div>
  );
}
