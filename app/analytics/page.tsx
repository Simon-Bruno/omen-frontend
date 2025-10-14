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
import { PurchaseStats } from '@/components/analytics/PurchaseStats';
import { analyticsApi, checkAuthStatus, NewFunnelAnalysis, ConversionRate, ExposureStats as ExposureStatsType, PurchaseStats as PurchaseStatsType, UserJourneyEvent, SessionListItem, SessionDetails } from '@/lib/analytics-api';
import { Calendar, RefreshCw, TrendingUp, Users, Target, BarChart3, Plus, ShoppingCart, Trash2, Settings, ChevronDown, Database } from 'lucide-react';

export default function AnalyticsPage() {
  const { isAuthenticated, isLoading, user, project } = useAuth();
  const { selectedExperimentId, setSelectedExperimentId, loading, setLoading } = useAnalytics();
  const router = useRouter();
  
  // State management
  const [activeTab, setActiveTab] = useState<'overview' | 'experiments' | 'funnel' | 'conversions' | 'purchases' | 'traffic' | 'journey'>('overview');
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
  const [purchaseData, setPurchaseData] = useState<PurchaseStatsType[]>([]);
  const [journeyData, setJourneyData] = useState<UserJourneyEvent[]>([]);
  const [sessionDetails, setSessionDetails] = useState<SessionDetails | null>(null);
  
  // Mock data for demonstration (replace with real API calls)
  const mockPurchaseData: PurchaseStatsType[] = [
    {
      experimentId: 'exp-123',
      variantId: 'A',
      sessions: 50,
      purchases: 3,
      purchaseRate: 0.06,
      totalRevenue: 89.97,
      averageOrderValue: 29.99,
      revenuePerSession: 1.80
    },
    {
      experimentId: 'exp-123',
      variantId: 'B',
      sessions: 48,
      purchases: 5,
      purchaseRate: 0.104,
      totalRevenue: 149.95,
      averageOrderValue: 29.99,
      revenuePerSession: 3.12
    }
  ];

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
      conversionRate: 10.0,
      averageValue: 25.50,
      totalValue: 12750,
    },
    {
      experimentId: 'exp-123',
      variantId: 'variant-1',
      sessions: 5000,
      conversions: 700,
      conversionRate: 14.0,
      averageValue: 28.75,
      totalValue: 20125,
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
      properties: { goal: 'purchase', value: 25.50 },
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
      setPurchaseData(mockPurchaseData);
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
          setPurchaseData(mockPurchaseData);
          setJourneyData(mockJourneyData);
          setError('No project ID or experiment selected. Showing mock data instead.');
          setLoading(false);
          return;
        }
        
        // Load all data in parallel
        const [funnel, conversions, exposures, purchases] = await Promise.all([
          analyticsApi.getFunnelAnalysis(projectId, experimentId),
          analyticsApi.getConversionRates(projectId, experimentId),
          analyticsApi.getExposureStats(projectId, experimentId),
          analyticsApi.getPurchaseStats(projectId, experimentId),
        ]);
        
        // Load journey data separately if we have a session selected
        let journey: UserJourneyEvent[] = [];
        if (sessionId) {
          journey = await analyticsApi.getUserJourney(projectId, sessionId);
        }
        
        
        setFunnelData(funnel);
        setConversionData(conversions);
        setExposureData(exposures);
        setPurchaseData(purchases);
        setJourneyData(journey);
      } catch (err) {
        console.error('Failed to load analytics data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load analytics data');
        
        // Fallback to mock data on error
        setFunnelData(mockFunnelData);
        setConversionData(mockConversionData);
        setExposureData(mockExposureData);
        setPurchaseData(mockPurchaseData);
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
    { id: 'purchases', label: 'Purchase Analytics', icon: ShoppingCart },
    { id: 'traffic', label: 'Traffic Overview', icon: Users },
    { id: 'journey', label: 'User Journey', icon: Calendar },
  ];

  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold">Total Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold">
            {funnelData?.overallStats.totalSessions.toLocaleString() || '0'}
          </div>
          <p className="text-xs text-muted-foreground">
            {funnelData?.overallStats.totalExposures.toLocaleString() || '0'} exposures
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold">Conversion Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold">
            {funnelData?.overallStats.overallConversionRate.toFixed(1) || '0.0'}%
          </div>
          <p className="text-xs text-muted-foreground">
            {funnelData?.overallStats.totalConversions.toLocaleString() || '0'} conversions
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold">Active Variants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold">
            {funnelData?.variants.length || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            {funnelData?.variants.map(v => v.variantId).join(', ') || 'None'}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold">Best Performer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold">
              {funnelData?.variants && funnelData.variants.length > 0 
              ? funnelData.variants.reduce((best, current) => 
                  current.conversionRate > best.conversionRate ? current : best
                ).variantId 
              : 'N/A'}
          </div>
          <p className="text-xs text-muted-foreground">
            {funnelData?.variants && funnelData.variants.length > 0 
              ? funnelData.variants.reduce((best, current) => 
                  current.conversionRate > best.conversionRate ? current : best
                ).conversionRate.toFixed(1) + '% conversion'
              : '0.0% conversion'}
          </p>
        </CardContent>
      </Card>
    </div>
  );

  // Sliding underline indicator state for tabs
  const tabsContainerRef = React.useRef<HTMLDivElement | null>(null);
  const tabRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicator, setIndicator] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

  const updateIndicator = () => {
    const container = tabsContainerRef.current;
    const activeEl = tabRefs.current[activeTab];
    if (!container || !activeEl) return;
    const containerRect = container.getBoundingClientRect();
    const activeRect = activeEl.getBoundingClientRect();
    setIndicator({ left: activeRect.left - containerRect.left, width: activeRect.width });
  };

  useEffect(() => {
    updateIndicator();
    const onResize = () => updateIndicator();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [activeTab]);

  const renderContent = () => {
    // Show selection prompt if no experiment is selected
    if (!selectedExperimentId) {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Experiment</h3>
          <p className="text-gray-500">Choose an experiment from the dropdown above to view analytics data.</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'overview':
        return (
          <div>
            {renderOverview()}
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
      case 'purchases':
        return purchaseData.length > 0 ? <PurchaseStats data={purchaseData} /> : <div>No purchase data available</div>;
      case 'traffic':
        return exposureData.length > 0 ? <ExposureStats data={exposureData} /> : <div>No traffic data available</div>;
      case 'journey':
        if (!selectedExperimentId) {
          return (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Experiment</h3>
              <p className="text-gray-500">Choose an experiment to view user journeys.</p>
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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4" />
                    Project Settings
                    <ChevronDown className="w-4 h-4 ml-1 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => router.push('/experiments/create')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Experiment
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => loadData()} disabled={loading || !selectedExperimentId}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Loading...' : 'Refresh'}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => setUseMockData(!useMockData)}
                    disabled={loading}
                  >
                    <Database className="w-4 h-4 mr-2" />
                    {useMockData ? 'Use Live Data' : 'Use Mock Data'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => setShowResetConfirm(true)}
                    disabled={loading || isResetting || !selectedExperimentId}
                    className="text-red-600 focus:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Reset Data
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Badge variant={useMockData ? 'secondary' : 'default'}>
                {useMockData ? 'Mock Data' : 'Live Data'}
              </Badge>
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
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex items-center justify-between">
            <div ref={tabsContainerRef} className="relative flex space-x-8">
              {tabs.map((tab) => {
                return (
                  <button
                    key={tab.id}
                    ref={(el) => { tabRefs.current[tab.id] = el; }}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center py-2 px-1 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'text-black'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
              <div
                aria-hidden
                className="pointer-events-none absolute -bottom-2 h-[2px] rounded bg-black transition-all duration-300 ease-out"
                style={{ left: `${indicator.left}px`, width: `${indicator.width}px` }}
              />
            </div>
            
            {/* Experiment Selector */}
            {project?.id && (
              <div className="ml-8 mb-2">
                <ExperimentSelector
                  selectedExperimentId={selectedExperimentId}
                  onExperimentSelect={setSelectedExperimentId}
                  projectId={project.id}
                  disabled={loading}
                />
              </div>
            )}
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
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-blue-800">Loading analytics data...</p>
            </div>
          </div>
        )}


        {/* Content */}
        {renderContent()}
      </div>
    </div>
  );
}
