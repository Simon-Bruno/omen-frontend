'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TrafficSplitChartProps {
  variants: Array<{
    variantId: string;
    sessions: number;
    sessionPercent: number;
  }>;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export function TrafficSplitChart({ variants }: TrafficSplitChartProps) {
  const chartData = variants.map((v) => ({
    name: v.variantId === 'control' ? 'Control' : v.variantId,
    value: v.sessions,
    percent: v.sessionPercent,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percent = (data.payload as any)?.percent || 0;
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
          <p className="font-medium text-slate-900">{data.name}</p>
          <p className="text-sm text-slate-600">
            Sessions: <span className="font-semibold">{data.value.toLocaleString()}</span>
          </p>
          <p className="text-sm text-slate-600">
            Split: <span className="font-semibold">{(percent * 100).toFixed(1)}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold text-slate-700">Traffic Split</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) => {
                  const percent = entry.percent || (entry.value / chartData.reduce((sum, d) => sum + d.value, 0)) * 100;
                  return `${entry.name} ${percent.toFixed(1)}%`;
                }}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

