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
import { FunnelChart } from '@/components/analytics/FunnelChart';
import { ConversionTable } from '@/components/analytics/ConversionTable';
import { ExposureStats } from '@/components/analytics/ExposureStats';
import { UserJourney } from '@/components/analytics/UserJourney';
import { ExperimentSelector } from '@/components/analytics/ExperimentSelector';
import { ExperimentList } from '@/components/experiments/ExperimentList';
import { analyticsApi, checkAuthStatus, NewFunnelAnalysis, ConversionRate, ExposureStats as ExposureStatsType, UserJourneyEvent, SessionListItem, SessionDetails } from '@/lib/analytics-api';
import { Calendar, RefreshCw, TrendingUp, Users, Target, BarChart3, Plus, Trash2, Settings, ChevronDown, Database } from 'lucide-react';

export default function AnalyticsPage() {
  const { isAuthenticated, isLoading, user, project } = useAuth();
  const { selectedExperimentId, setSelectedExperimentId, loading, setLoading } = useAnalytics();
  const router = useRouter();
  
  // State management
  const [activeTab, setActiveTab] = useState<'overview' | 'experiments' | 'funnel' | 'conversions' | 'traffic' | 'journey'>('overview');
  const [error, setError] = useState<string | null>(null);
  const [useMockData, setUseMockData] = useState(false); // Toggle for mock vs real data
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  // Selection state
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  
  // Data state
  const [funnelData, setFunnelData] = useState<NewFunnelAnalysis | null>(null);
  const [conversionData, setConversionData] = useState<ConversionRate[]>([]);
  const [exposureData, setExposureData] = useState<ExposureStatsType[]>([]);
  const [journeyData, setJourneyData] = useState<UserJourneyEvent[]>([]);
  const [sessionDetails, setSessionDetails] = useState<SessionDetails | null>(null);
  
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
  
  // Mock data for demonstration (replace with real API calls)

  const mockFunnelData: NewFunnelAnalysis = {
    experimentId: 'exp-123',
    variants: [
      {
        variantId: 'A',
        steps: [
          {
            step: 'Session',
            eventType: 'PAGEVIEW',
            count: 50,
            percentage: 100,
            dropoffRate: 0,
          },
          {
            step: 'Exposure',
            eventType: 'EXPOSURE',
            count: 45,
            percentage: 90,
            dropoffRate: 10,
          },
          {
            step: 'Conversion',
            eventType: 'CONVERSION',
            count: 3,
            percentage: 6,
            dropoffRate: 93.3,
          },
        ],
        totalSessions: 50,
        conversionRate: 6.7,
      },
      {
        variantId: 'B',
        steps: [
          {
            step: 'Session',
            eventType: 'PAGEVIEW',
            count: 48,
            percentage: 100,
            dropoffRate: 0,
          },
          {
            step: 'Exposure',
            eventType: 'EXPOSURE',
            count: 44,
            percentage: 91.7,
            dropoffRate: 8.3,
          },
          {
            step: 'Conversion',
            eventType: 'CONVERSION',
            count: 4,
            percentage: 8.3,
            dropoffRate: 90.9,
          },
        ],
        totalSessions: 48,
        conversionRate: 8.3,
      },
    ],
    overallStats: {
      totalSessions: 98,
      totalExposures: 89,
      totalConversions: 7,
      overallConversionRate: 7.5,
    },
  };

  const mockConversionData: ConversionRate[] = [
    {
      experimentId: 'exp-123',
      variantId: 'control',
      sessions: 5000,
      conversions: 500,
      conversionRate: 10.0, // 10% as percentage (matching funnel data format)
      averageValue: 0,
      totalValue: 0,
    },
    {
      experimentId: 'exp-123',
      variantId: 'variant-1',
      sessions: 5000,
      conversions: 700,
      conversionRate: 14.0, // 14% as percentage (matching funnel data format)
      averageValue: 0,
      totalValue: 0,
    },
  ];

  const mockExposureData: ExposureStatsType[] = [
    {
      experimentId: 'exp-123',
      variantId: 'control',
      exposures: 5000,
      uniqueSessions: 4500,
    },
    {
      experimentId: 'exp-123',
      variantId: 'variant-1',
      exposures: 5000,
      uniqueSessions: 4800,
    },
  ];

  const mockJourneyData: UserJourneyEvent[] = [
    {
      id: 'evt-1',
      projectId: 'proj-123',
      experimentId: 'exp-123',
      eventType: 'EXPOSURE',
      sessionId: 'session-abc123',
      viewId: 'view-1',
      properties: { variantId: 'control' },
      timestamp: Date.now() - 3600000,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'evt-2',
      projectId: 'proj-123',
      experimentId: 'exp-123',
      eventType: 'PAGEVIEW',
      sessionId: 'session-abc123',
      viewId: 'view-2',
      properties: { page: '/checkout' },
      timestamp: Date.now() - 3500000,
      createdAt: new Date(Date.now() - 3500000).toISOString(),
    },
    {
      id: 'evt-3',
      projectId: 'proj-123',
      experimentId: 'exp-123',
      eventType: 'CONVERSION',
      sessionId: 'session-abc123',
      viewId: 'view-3',
      properties: { goal: 'conversion' },
      timestamp: Date.now() - 3400000,
      createdAt: new Date(Date.now() - 3400000).toISOString(),
    },
  ];

  // Load sessions when experiment changes
  useEffect(() => {
    if (selectedExperimentId && project?.id) {
      loadSessions();
    } else {
      setSessions([]);
      setSelectedSessionId(null);
    }
  }, [selectedExperimentId, project?.id]);

  // Load session details when session is selected
  useEffect(() => {
    if (selectedSessionId && project?.id) {
      loadSessionDetails();
    } else {
      setSessionDetails(null);
      setJourneyData([]);
    }
  }, [selectedSessionId, project?.id]);

  // Load data based on toggle state and selections
  useEffect(() => {
    // Only load data if we're authenticated and not loading
    if (isAuthenticated && !isLoading && selectedExperimentId) {
      loadData();
    }
  }, [useMockData, isAuthenticated, isLoading, selectedExperimentId, selectedSessionId]);

  // Function to load detailed session information
  const loadSessionDetails = async () => {
    if (!selectedSessionId || !project?.id) return;
    
    try {
      const details = await analyticsApi.getSessionDetails(project.id, selectedSessionId);
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
    if (!selectedExperimentId || !project?.id) return;
    
    try {
      const data = await analyticsApi.getExperimentSessions(project.id, selectedExperimentId, 100, 0);
      
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
    }
  };

  // Function to load data (mock or real)
  const loadData = async () => {
    if (useMockData) {
      // Load mock data
      setFunnelData(mockFunnelData);
      setConversionData(mockConversionData);
      setExposureData(mockExposureData);
      setJourneyData(mockJourneyData);
      setError(null);
    } else {
      // Load real data from API
      setLoading(true);
      setError(null);
      
      try {
        // Use actual project/experiment IDs from user context
        const projectId = project?.id;
        const experimentId = selectedExperimentId;
        const sessionId = selectedSessionId;
        
        if (!projectId || !experimentId) {
          // Fallback to mock data if no project ID or experiment ID is available
          setFunnelData(mockFunnelData);
          setConversionData(mockConversionData);
          setExposureData(mockExposureData);
          setJourneyData(mockJourneyData);
          setError('No project ID or experiment selected. Showing mock data instead.');
          setLoading(false);
          return;
        }
        
        // Load all data in parallel
        const [funnel, conversions, exposures] = await Promise.all([
          analyticsApi.getFunnelAnalysis(projectId, experimentId),
          analyticsApi.getConversionRates(projectId, experimentId),
          analyticsApi.getExposureStats(projectId, experimentId),
        ]);
        
        // Load journey data separately if we have a session selected
        let journey: UserJourneyEvent[] = [];
        if (sessionId) {
          journey = await analyticsApi.getUserJourney(projectId, sessionId);
        }
        
        
        setFunnelData(funnel);
        setConversionData(conversions);
        setExposureData(exposures);
        setJourneyData(journey);
      } catch (err) {
        console.error('Failed to load analytics data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load analytics data');
        
        // Fallback to mock data on error
        setFunnelData(mockFunnelData);
        setConversionData(mockConversionData);
        setExposureData(mockExposureData);
        setJourneyData(mockJourneyData);
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle reset analytics data
  const handleResetAnalytics = async () => {
    if (!project?.id || !selectedExperimentId) {
      setError('No project or experiment selected');
      return;
    }

    setIsResetting(true);
    setError(null);

    try {
      const result = await analyticsApi.resetExperimentEvents(project.id, selectedExperimentId);

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
    { id: 'traffic', label: 'Traffic Overview', icon: Users },
    { id: 'journey', label: 'User Journey', icon: Calendar },
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
            {funnelData?.overallStats.totalSessions.toLocaleString() || '0'}
          </div>
          <div className="flex items-center gap-1 text-sm text-slate-500">
            <span>{funnelData?.overallStats.totalExposures.toLocaleString() || '0'}</span>
            <span>exposures</span>
          </div>
        </div>
        
         <div className="bg-white rounded-lg border border-slate-200 p-6">
           <div className="mb-2">
             <h3 className="text-sm font-semibold text-slate-700">Conversion Rate</h3>
           </div>
          <div className="text-3xl font-semibold text-slate-900 mb-1">
            {funnelData?.overallStats.overallConversionRate.toFixed(1) || '0.0'}%
          </div>
          <div className="flex items-center gap-1 text-sm text-slate-500">
            <span>{funnelData?.overallStats.totalConversions.toLocaleString() || '0'}</span>
            <span>conversions</span>
          </div>
        </div>
        
         <div className="bg-white rounded-lg border border-slate-200 p-6">
           <div className="mb-2">
             <h3 className="text-sm font-semibold text-slate-700">Active Variants</h3>
           </div>
          <div className="text-3xl font-semibold text-slate-900 mb-1">
            {funnelData?.variants.length || 0}
          </div>
          <div className="text-sm text-slate-500">
            {funnelData?.variants.map(v => v.variantId).join(', ') || 'None'}
          </div>
        </div>
        
         <div className="bg-white rounded-lg border border-slate-200 p-6">
           <div className="mb-2">
             <h3 className="text-sm font-semibold text-slate-700">Best Performer</h3>
           </div>
          <div className="text-3xl font-semibold text-slate-900 mb-1">
            {funnelData?.variants && funnelData.variants.length > 0 
              ? funnelData.variants.reduce((best, current) => 
                  current.conversionRate > best.conversionRate ? current : best
                ).variantId 
              : 'N/A'}
          </div>
          <div className="text-sm text-slate-500">
            {funnelData?.variants && funnelData.variants.length > 0 
              ? funnelData.variants.reduce((best, current) => 
                  current.conversionRate > best.conversionRate ? current : best
                ).conversionRate.toFixed(1) + '% conversion'
              : '0.0% conversion'}
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
            {loading && !funnelData?.overallStats ? (
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {funnelData && <FunnelChart data={funnelData} />}
              {conversionData.length > 0 && <ConversionTable data={conversionData} />}
            </div>
          </div>
        );
      case 'experiments':
        return <ExperimentList />;
      case 'funnel':
        return funnelData ? <FunnelChart data={funnelData} /> : <div>No funnel data available</div>;
      case 'conversions':
        return conversionData.length > 0 ? <ConversionTable data={conversionData} /> : <div>No conversion data available</div>;
      case 'traffic':
        return exposureData.length > 0 ? <ExposureStats data={exposureData} /> : <div>No traffic data available</div>;
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
