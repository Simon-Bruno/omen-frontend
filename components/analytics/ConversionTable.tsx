'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ConversionRate } from '@/lib/analytics-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { analyticsUtils } from '@/lib/analytics-api';

interface ConversionTableProps {
  data: ConversionRate[];
  className?: string;
}

export function ConversionTable({ data, className }: ConversionTableProps) {
  // Transform data for Recharts
  const chartData = data.map((item, index) => ({
    variant: `Variant ${index + 1}`,
    conversionRate: item.conversionRate, // Already in percentage format
    sessions: item.sessions,
    conversions: item.conversions,
    variantId: item.variantId,
  }));

  const colors = ['#3B82F6', '#60A5FA', '#1D4ED8', '#93C5FD', '#A5B4FC']; // Softer blue palette

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-100 rounded-xl shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-sm text-gray-600">
            Conversion Rate: <span className="font-medium">{data.conversionRate.toFixed(2)}%</span>
          </p>
          <p className="text-sm text-gray-600">
            Sessions: <span className="font-medium">{data.sessions.toLocaleString()}</span>
          </p>
          <p className="text-sm text-gray-600">
            Conversions: <span className="font-medium">{data.conversions.toLocaleString()}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Calculate statistical significance if we have control and variant data
  const getSignificanceInfo = (variant: ConversionRate, control: ConversionRate | undefined) => {
    if (!control || variant.variantId === control.variantId) return null;
    
    try {
      const significance = analyticsUtils.calculateSignificance(
        control.conversionRate / 100, // Convert percentage to decimal
        control.sessions,
        variant.conversionRate / 100, // Convert percentage to decimal
        variant.sessions
      );
      
      return significance;
    } catch (error) {
      console.warn('Error calculating significance:', error);
      return null;
    }
  };

  // Find control variant by variantId
  const controlVariant = data.find(v => v.variantId === 'control');

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-gray-900">A/B Test Results</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Chart */}
        <div className="h-48 w-full mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{
                top: 12,
                right: 16,
                left: 8,
                bottom: 8,
              }}
              barCategoryGap="8%"
              barGap={2}
            >
              <CartesianGrid strokeDasharray="4 8" stroke="#E5E7EB" horizontal={false} />
              <XAxis 
                type="number"
                tick={{ fontSize: 12, fill: '#64748B' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `${value}%`}
                allowDecimals={false}
              />
              <YAxis 
                type="category"
                dataKey="variant" 
                tick={{ fontSize: 12, fill: '#64748B' }}
                axisLine={false}
                tickLine={false}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} cursor={false} />
              <Bar dataKey="conversionRate" radius={[0, 8, 8, 0]} maxBarSize={64} fillOpacity={0.95}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-2 font-medium text-gray-900">Variant</th>
                <th className="text-right py-3 px-2 font-medium text-gray-900">Sessions</th>
                <th className="text-right py-3 px-2 font-medium text-gray-900">Conversions</th>
                <th className="text-right py-3 px-2 font-medium text-gray-900">Conversion Rate</th>
                <th className="text-center py-3 px-2 font-medium text-gray-900">Significance</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => {
                const significance = getSignificanceInfo(item, controlVariant);
                const isControl = item.variantId === 'control';
                
                return (
                  <tr key={item.variantId} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: colors[index % colors.length] }}
                        />
                        <span className="font-medium">
                          {isControl ? 'Control' : (item.variantId || `Variant ${index}`)}
                        </span>
                      </div>
                    </td>
                    <td className="text-right py-3 px-2 text-gray-600">
                      {item.sessions.toLocaleString()}
                    </td>
                    <td className="text-right py-3 px-2 text-gray-600">
                      {item.conversions.toLocaleString()}
                    </td>
                    <td className="text-right py-3 px-2">
                      <span className="font-medium text-gray-900">
                        {item.conversionRate.toFixed(2)}%
                      </span>
                    </td>
                    <td className="text-center py-3 px-2">
                      {significance ? (
                        <Badge 
                          variant={significance.isSignificant ? "default" : "secondary"}
                          className={significance.isSignificant ? "bg-green-100 text-green-800" : ""}
                        >
                          {significance.isSignificant ? 'Significant' : 'Not Significant'}
                        </Badge>
                      ) : isControl ? (
                        <span className="text-gray-400 text-xs">Control</span>
                      ) : (
                        <span className="text-gray-400 text-xs">No Control</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {data.reduce((sum, item) => sum + item.sessions, 0).toLocaleString()}
              </div>
              <div className="text-gray-500">Total Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {data.reduce((sum, item) => sum + item.conversions, 0).toLocaleString()}
              </div>
              <div className="text-gray-500">Total Conversions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {(data.reduce((sum, item) => sum + item.conversions, 0) / 
                  data.reduce((sum, item) => sum + item.sessions, 0) * 100).toFixed(2)}%
              </div>
              <div className="text-gray-500">Overall Rate</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

