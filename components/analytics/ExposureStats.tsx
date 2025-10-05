'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ExposureStats as ExposureStatsType } from '@/lib/analytics-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { analyticsUtils } from '@/lib/analytics-api';

interface ExposureStatsProps {
  data: ExposureStatsType[];
  className?: string;
}

export function ExposureStats({ data, className }: ExposureStatsProps) {
  // Transform data for Recharts - use sessions for distribution
  const chartData = data.map((item, index) => ({
    name: item.variantId === 'control' ? 'Control' : (item.variantId || `Variant ${index + 1}`),
    exposures: item.exposures,
    uniqueSessions: item.uniqueSessions,
    sessions: item.uniqueSessions, // Use sessions for pie chart distribution
    variantId: item.variantId,
  }));

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = (data.uniqueSessions / totalSessions) * 100;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
            Sessions: <span className="font-medium">{data.uniqueSessions.toLocaleString()}</span>
          </p>
          <p className="text-sm text-gray-600">
            Distribution: <span className="font-medium">{percentage.toFixed(1)}%</span>
          </p>
          <p className="text-sm text-gray-600">
            Exposures: <span className="font-medium">{data.exposures.toLocaleString()}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const totalExposures = data.reduce((sum, item) => sum + item.exposures, 0);
  const totalSessions = data.reduce((sum, item) => sum + item.uniqueSessions, 0);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Traffic Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name} ${((percent as number) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="sessions"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Stats Table */}
          <div className="space-y-4">
            <div className="space-y-3">
            {data
              .sort((a, b) => b.uniqueSessions - a.uniqueSessions) // Sort by sessions descending
              .map((item, index) => {
              const percentage = (item.uniqueSessions / totalSessions) * 100; // Use sessions for percentage
              const sessionRate = (item.uniqueSessions / item.exposures) * 100;
              const isControl = item.variantId === 'control';
              
              return (
                <div key={item.variantId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: colors[index % colors.length] }}
                    />
                    <div>
                      <div className="font-medium text-gray-900">
                        {isControl ? 'Control' : (item.variantId || `Variant ${index + 1}`)}
                      </div>
                        <div className="text-sm text-gray-600">
                          {percentage.toFixed(1)}% of traffic
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        {item.uniqueSessions.toLocaleString()} <span className="text-sm font-normal text-gray-600">sessions</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {item.exposures.toLocaleString()} exposures
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary Stats */}
            <div className="pt-4 border-t">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {totalSessions.toLocaleString()}
                  </div>
                  <div className="text-gray-600">Total Sessions</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-500">
                    {totalExposures.toLocaleString()}
                  </div>
                  <div className="text-gray-500">Total Exposures</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
