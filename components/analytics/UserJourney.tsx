'use client';

import React, { useState } from 'react';
import { UserJourneyEvent, SessionListItem, SessionDetails } from '@/lib/analytics-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronRight, Clock, Eye, MousePointer, Target, DollarSign } from 'lucide-react';

interface UserJourneyProps {
  data: UserJourneyEvent[];
  sessions: SessionListItem[];
  selectedSessionId: string | null;
  sessionDetails: SessionDetails | null;
  onSessionSelect: (sessionId: string) => void;
  className?: string;
}

const eventIcons = {
  EXPOSURE: Eye,
  PAGEVIEW: MousePointer,
  CONVERSION: Target,
  PURCHASE: DollarSign,
  CUSTOM: Clock,
};

const eventColors = {
  EXPOSURE: 'bg-blue-100 text-blue-800',
  PAGEVIEW: 'bg-green-100 text-green-800',
  CONVERSION: 'bg-purple-100 text-purple-800',
  PURCHASE: 'bg-yellow-100 text-yellow-800',
  CUSTOM: 'bg-gray-100 text-gray-800',
};

export function UserJourney({ data, sessions, selectedSessionId, sessionDetails, onSessionSelect, className }: UserJourneyProps) {
  // Group events by session
  const sessionEvents = data.reduce((acc, event) => {
    if (!acc[event.sessionId]) {
      acc[event.sessionId] = [];
    }
    acc[event.sessionId].push(event);
    return acc;
  }, {} as Record<string, UserJourneyEvent[]>);

  // Sort events by timestamp within each session
  Object.values(sessionEvents).forEach(events => {
    events.sort((a, b) => a.timestamp - b.timestamp);
  });

  const currentSession = selectedSessionId ? sessionEvents[selectedSessionId] : null;

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getEventDescription = (event: UserJourneyEvent) => {
    switch (event.eventType) {
      case 'EXPOSURE':
        const variantKey = event.properties?.variantKey || 'unknown';
        const device = event.properties?.device || 'unknown device';
        return `Saw variant ${variantKey} on ${device}`;
      case 'PAGEVIEW':
        const title = event.properties?.title || 'page';
        const url = event.properties?.url || '';
        
        // Check if it's a home page
        if (url.endsWith('/') || url.endsWith('/home') || title.toLowerCase().includes('home')) {
          return 'Visited home page';
        }
        
        return `Visited ${title}`;
      case 'CONVERSION':
        return `Completed goal: ${event.properties?.goal || 'conversion'}`;
      case 'PURCHASE':
        return 'Purchase completed';
      case 'CUSTOM':
        return event.properties?.description || 'Custom event';
      default:
        return 'Unknown event';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>User Journey Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Session List */}
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900 mb-3">Sessions ({sessions.length})</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {sessions.map((session) => {
                const events = sessionEvents[session.sessionId] || [];
                const hasConversion = events.some(e => e.eventType === 'CONVERSION');
                const eventCount = session.eventCount;
                
                return (
                  <Button
                    key={session.sessionId}
                    variant={selectedSessionId === session.sessionId ? "default" : "outline"}
                    className="w-full justify-start text-left h-auto p-3"
                    onClick={() => onSessionSelect(session.sessionId)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm font-mono">
                          {session.sessionId}
                        </div>
                        <div className="text-xs text-gray-600">
                          {eventCount} events
                        </div>
                      </div>
                      {hasConversion && (
                        <Badge variant="default" className="bg-green-100 text-green-800 ml-2">
                          Converted
                        </Badge>
                      )}
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Journey Timeline */}
          <div className="lg:col-span-2">
            {currentSession ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900 font-mono">
                    Session: {selectedSessionId}
                  </h3>
                  <Badge variant="outline">
                    {currentSession.length} events
                  </Badge>
                </div>

                
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {currentSession.map((event, index) => {
                    const Icon = eventIcons[event.eventType];
                    const isLast = index === currentSession.length - 1;
                    
                    return (
                      <div key={event.id} className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`p-2 rounded-full ${eventColors[event.eventType]}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          {!isLast && (
                            <div className="w-0.5 h-8 bg-gray-200 mt-2" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge 
                              variant="secondary" 
                              className={eventColors[event.eventType]}
                            >
                              {event.eventType}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {formatTimestamp(event.timestamp)}
                            </span>
                          </div>
                          
                          <div className="text-sm text-gray-900">
                            {getEventDescription(event)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Select a session to view the user journey</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

