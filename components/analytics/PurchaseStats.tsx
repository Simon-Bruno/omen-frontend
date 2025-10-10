'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { PurchaseStats as PurchaseStatsType } from '@/lib/analytics-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, ShoppingCart, TrendingUp, Users } from 'lucide-react';

interface PurchaseStatsProps {
  data: PurchaseStatsType[];
  className?: string;
}

export function PurchaseStats({ data, className }: PurchaseStatsProps) {
  if (!data || data.length === 0) {
    return (
      <div className={className}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Purchase Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">No purchase data available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate totals
  const totalSessions = data.reduce((sum, item) => sum + item.sessions, 0);
  const totalPurchases = data.reduce((sum, item) => sum + item.purchases, 0);
  const totalRevenue = data.reduce((sum, item) => sum + item.totalRevenue, 0);
  const overallPurchaseRate = totalSessions > 0 ? (totalPurchases / totalSessions) * 100 : 0;
  const averageOrderValue = totalPurchases > 0 ? totalRevenue / totalPurchases : 0;

  // Prepare chart data
  const chartData = data.map(item => ({
    variant: item.variantId,
    purchases: item.purchases,
    revenue: item.totalRevenue,
    purchaseRate: item.purchaseRate * 100,
    averageOrderValue: item.averageOrderValue,
    revenuePerSession: item.revenuePerSession
  }));

  // Colors for variants
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];

  return (
    <div className={className}>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {totalPurchases} purchases
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Purchase Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallPurchaseRate.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">
              {totalPurchases} of {totalSessions} sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${averageOrderValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              per purchase
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue/Session</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalRevenue / totalSessions).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              per session
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Purchase Rate by Variant */}
        <Card>
          <CardHeader>
            <CardTitle>Purchase Rate by Variant</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="variant" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `${value.toFixed(2)}%`, 
                    name === 'purchaseRate' ? 'Purchase Rate' : name
                  ]}
                />
                <Bar dataKey="purchaseRate" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: any) => `${props.variant}: $${props.revenue.toFixed(0)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="revenue"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Purchase Statistics by Variant</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Variant</th>
                  <th className="text-right p-2">Sessions</th>
                  <th className="text-right p-2">Purchases</th>
                  <th className="text-right p-2">Purchase Rate</th>
                  <th className="text-right p-2">Total Revenue</th>
                  <th className="text-right p-2">Avg Order Value</th>
                  <th className="text-right p-2">Revenue/Session</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr key={item.variantId} className="border-b">
                    <td className="p-2">
                      <Badge variant="outline">{item.variantId}</Badge>
                    </td>
                    <td className="text-right p-2">{item.sessions.toLocaleString()}</td>
                    <td className="text-right p-2">{item.purchases.toLocaleString()}</td>
                    <td className="text-right p-2">
                      <span className="font-medium">{(item.purchaseRate * 100).toFixed(2)}%</span>
                    </td>
                    <td className="text-right p-2 font-medium">${item.totalRevenue.toFixed(2)}</td>
                    <td className="text-right p-2">${item.averageOrderValue.toFixed(2)}</td>
                    <td className="text-right p-2">${item.revenuePerSession.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
