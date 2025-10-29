'use client';

import React, { useState, useEffect } from 'react';
import { analyticsApi, AnalyticsEvent, RawEventsResponse } from '@/lib/analytics-api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, ChevronLeft, ChevronRight, Database, Calendar, Globe, Hash, Activity } from 'lucide-react';

interface RawEventsTableProps {
  experimentId?: string;
  sessionId?: string;
}

export function RawEventsTable({ experimentId, sessionId }: RawEventsTableProps) {
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState(100);
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Pagination state
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(totalCount / limit);

  // Load raw events
  const loadEvents = async () => {
    setLoading(true);
    setError(null);

    try {
      const rawEventsResponse = await analyticsApi.getRawEvents({
        experimentId,
        sessionId,
        limit,
        offset
      });

      setEvents(rawEventsResponse.events);
      setTotalCount(rawEventsResponse.total);
    } catch (err) {
      console.error('Failed to load events:', err);
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount and when filters change
  useEffect(() => {
    if (experimentId || sessionId) {
      loadEvents();
    }
  }, [experimentId, sessionId, limit, offset]);

  // Event type badge colors
  const getEventTypeBadge = (eventType: string) => {
    const colors: Record<string, string> = {
      'EXPOSURE': 'bg-blue-100 text-blue-700 border-blue-200',
      'PAGEVIEW': 'bg-slate-100 text-slate-700 border-slate-200',
      'CONVERSION': 'bg-green-100 text-green-700 border-green-200',
      'PURCHASE': 'bg-purple-100 text-purple-700 border-purple-200',
      'CUSTOM': 'bg-amber-100 text-amber-700 border-amber-200'
    };
    return colors[eventType] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Truncate long strings
  const truncate = (str: string | undefined, maxLen: number = 30) => {
    if (!str) return '-';
    return str.length > maxLen ? str.substring(0, maxLen) + '...' : str;
  };

  return (
    <div className="space-y-6">
      {/* Raw Events Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Raw Analytics Events
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {totalCount.toLocaleString()} total events
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={loadEvents}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          ) : loading && events.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">Loading events...</p>
              </div>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8">
              <Database className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No events found</p>
            </div>
          ) : (
            <>
              {/* Events Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-600">
                      <th className="py-2 pr-4">
                        <div className="flex items-center gap-1">
                          <Hash className="w-3 h-3" />
                          ID
                        </div>
                      </th>
                      <th className="py-2 px-4">
                        <div className="flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          Type
                        </div>
                      </th>
                      <th className="py-2 px-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Timestamp
                        </div>
                      </th>
                      <th className="py-2 px-4">Session</th>
                      <th className="py-2 px-4">Variant</th>
                      <th className="py-2 px-4">
                        <div className="flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          URL
                        </div>
                      </th>
                      <th className="py-2 px-4">Properties</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((event) => (
                      <tr key={event.id} className="border-b hover:bg-gray-50">
                        <td className="py-2 pr-4 font-mono text-xs text-gray-600">
                          {event.id.substring(0, 8)}...
                        </td>
                        <td className="py-2 px-4">
                          <Badge className={getEventTypeBadge(event.eventType)}>
                            {event.eventType}
                          </Badge>
                        </td>
                        <td className="py-2 px-4 text-gray-600">
                          {formatTimestamp(event.timestamp)}
                        </td>
                        <td className="py-2 px-4 font-mono text-xs text-gray-600">
                          {event.sessionId.substring(0, 12)}...
                        </td>
                        <td className="py-2 px-4">
                          {event.assignedVariants?.map(av => (
                            <Badge key={av.variantId} variant="outline" className="mr-1">
                              {av.variantId}
                            </Badge>
                          )) || '-'}
                        </td>
                        <td className="py-2 px-4 text-gray-600 text-xs max-w-xs truncate">
                          {truncate(event.url, 40)}
                        </td>
                        <td className="py-2 px-4">
                          <details className="cursor-pointer">
                            <summary className="text-xs text-blue-600 hover:text-blue-700">
                              View JSON
                            </summary>
                            <pre className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-x-auto max-w-xs">
                              {JSON.stringify(event.properties, null, 2)}
                            </pre>
                          </details>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">
                  Showing {offset + 1} - {Math.min(offset + limit, totalCount)} of {totalCount.toLocaleString()} events
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOffset(Math.max(0, offset - limit))}
                    disabled={offset === 0 || loading}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOffset(offset + limit)}
                    disabled={offset + limit >= totalCount || loading}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}