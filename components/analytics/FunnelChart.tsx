'use client';

import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { NewFunnelAnalysis, FunnelVariant } from '@/lib/analytics-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface FunnelChartProps {
    data: NewFunnelAnalysis;
    className?: string;
}

export function FunnelChart({ data, className }: FunnelChartProps) {
    const [selectedVariants, setSelectedVariants] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<'overall' | 'variants'>('overall');

    // Safety checks
    if (!data || !data.variants || !Array.isArray(data.variants)) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle>Conversion Funnel</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-gray-500 py-8">
                        No valid funnel data available
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Initialize selected variants with all variants if none selected
    React.useEffect(() => {
        if (selectedVariants.length === 0 && data.variants.length > 0) {
            setSelectedVariants(data.variants.map(v => v.variantId));
        }
    }, [data.variants, selectedVariants.length]);

    // Get variants to display
    const displayVariants = data.variants.filter(v => selectedVariants.includes(v.variantId));
    
    // Transform data for Recharts based on view mode
    const chartData = viewMode === 'overall' 
        ? (() => {
            // Calculate overall stats by combining all variants
            const stepNames = data.variants[0]?.steps?.map(step => step.step) || [];
            return stepNames.map((stepName, stepIndex) => {
                let totalCount = 0;
                let totalSessions = 0;
                
                // Sum up counts from all variants for this step
                data.variants.forEach(variant => {
                    const step = variant.steps?.[stepIndex];
                    if (step) {
                        totalCount += step.count || 0;
                    }
                    // Use the first variant's totalSessions as reference (they should all be similar)
                    if (stepIndex === 0) {
                        totalSessions += variant.totalSessions || 0;
                    }
                });
                
                // Calculate percentage based on total sessions
                const percentage = totalSessions > 0 ? (totalCount / totalSessions) * 100 : 0;
                
                // Calculate dropoff rate (compare with previous step)
                let dropoffRate = 0;
                if (stepIndex > 0) {
                    let previousTotalCount = 0;
                    data.variants.forEach(variant => {
                        const prevStep = variant.steps?.[stepIndex - 1];
                        if (prevStep) {
                            previousTotalCount += prevStep.count || 0;
                        }
                    });
                    if (previousTotalCount > 0) {
                        dropoffRate = ((previousTotalCount - totalCount) / previousTotalCount) * 100;
                    }
                }
                
                return {
                    name: stepName || `Step ${stepIndex + 1}`,
                    count: totalCount,
                    percentage: percentage,
                    dropoffRate: dropoffRate,
                    eventType: data.variants[0]?.steps?.[stepIndex]?.eventType || 'EXPOSURE',
                    isLastStep: stepIndex === stepNames.length - 1,
                };
            });
        })()
        : (() => {
            // For variant comparison, we need to group by step name and create columns for each variant
            const stepNames = data.variants[0]?.steps?.map(step => step.step) || [];
            return stepNames.map((stepName, stepIndex) => {
                const stepData: any = {
                    name: stepName || `Step ${stepIndex + 1}`,
                };
                
                // Add each variant's data for this step (all variants, not just selected)
                data.variants.forEach(variant => {
                    const step = variant.steps?.[stepIndex];
                    if (step) {
                        stepData[variant.variantId] = step.count || 0;
                    }
                });
                
                return stepData;
            });
        })();

    const colors = ['#3B82F6', '#60A5FA', '#1D4ED8', '#93C5FD', '#A5B4FC']; // Softer blue palette

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-3 border border-gray-100 rounded-xl shadow-lg">
                    <p className="font-medium text-gray-900">{label}</p>
                    {viewMode === 'overall' ? (
                        <>
                            <p className="text-sm text-gray-600">
                                Count: <span className="font-medium">{(data.count || 0).toLocaleString()}</span>
                            </p>
                            <p className="text-sm text-gray-600">
                                Percentage: <span className="font-medium">{(data.percentage || 0).toFixed(1)}%</span>
                            </p>
                            {!data.isLastStep && (
                                <p className="text-sm text-red-600">
                                    Dropoff: <span className="font-medium">{(data.dropoffRate || 0).toFixed(1)}%</span>
                                </p>
                            )}
                        </>
                    ) : (
                        payload.map((entry: any, index: number) => (
                            <div key={index} className="mt-2">
                                <p className="text-sm text-blue-600 font-medium">
                                    {entry.dataKey}: {(entry.value || 0).toLocaleString()}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            );
        }
        return null;
    };

    const toggleVariant = (variantId: string) => {
        setSelectedVariants(prev => 
            prev.includes(variantId) 
                ? prev.filter(id => id !== variantId)
                : [...prev, variantId]
        );
    };

    const CustomLegend = ({ payload }: any) => {
        return (
            <div className="flex flex-wrap gap-3 justify-center mt-4">
                {payload?.map((entry: any, index: number) => {
                    const variantId = entry.dataKey;
                    const variant = data.variants.find(v => v.variantId === variantId);
                    const isSelected = selectedVariants.includes(variantId);
                    
                    return (
                        <button
                            key={`legend-${index}`}
                            onClick={() => toggleVariant(variantId)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-300 ease-in-out ${
                                isSelected 
                                    ? 'bg-gray-800 hover:bg-gray-700 border-gray-900 scale-100' 
                                    : 'bg-white hover:bg-gray-50 border-gray-200 scale-95'
                            }`}
                        >
                            <div 
                                className="w-3 h-3 rounded-full transition-all duration-300 ease-in-out"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className={`text-sm font-medium transition-colors duration-300 ease-in-out ${
                                isSelected ? 'text-white' : 'text-gray-900'
                            }`}>
                                {variantId}
                            </span>
                            {variant && (
                                <span className={`text-xs transition-colors duration-300 ease-in-out ${
                                    isSelected ? 'text-gray-300' : 'text-gray-600'
                                }`}>
                                    ({(variant.conversionRate || 0).toFixed(1)}%)
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        );
    };

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-gray-900">Conversion Funnel</CardTitle>
                    <div className="flex gap-1">
                        <Button
                            size="sm"
                            variant={viewMode === 'overall' ? 'default' : 'outline'}
                            onClick={() => setViewMode('overall')}
                        >
                            Overall
                        </Button>
                        <Button
                            size="sm"
                            variant={viewMode === 'variants' ? 'default' : 'outline'}
                            onClick={() => setViewMode('variants')}
                        >
                            Compare Variants
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            margin={{
                                top: 12,
                                right: 16,
                                left: 8,
                                bottom: 8,
                            }}
                            barCategoryGap="8%"
                            barGap={2}
                        >
                            <CartesianGrid strokeDasharray="4 8" stroke="#E5E7EB" vertical={false} />
                            <XAxis
                                dataKey="name"
                                tick={{ fontSize: 12, fill: '#64748B' }}
                                axisLine={false}
                                tickLine={false}
                                interval={0}
                            />
                            <YAxis
                                tick={{ fontSize: 12, fill: '#64748B' }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(value) => value.toLocaleString()}
                                width={44}
                                allowDecimals={false}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={false} />
                            {viewMode === 'overall' ? (
                                <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={64} fillOpacity={0.95}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                    ))}
                                </Bar>
                            ) : (
                                data.variants.map((variant, variantIndex) => (
                                    <Bar 
                                        key={variant.variantId}
                                        dataKey={variant.variantId} 
                                        name={variant.variantId}
                                        fill={colors[variantIndex % colors.length]}
                                        radius={[8, 8, 0, 0]}
                                        maxBarSize={64}
                                        fillOpacity={selectedVariants.includes(variant.variantId) ? 0.9 : 0}
                                        hide={!selectedVariants.includes(variant.variantId)}
                                    />
                                ))
                            )}
                            {viewMode === 'variants' && <Legend content={<CustomLegend />} />}
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Total Sessions</span>
                            <span className="font-medium text-gray-900">{(data.overallStats?.totalSessions || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Overall Conversion Rate</span>
                            <span className="font-medium text-green-600">{(data.overallStats?.overallConversionRate || 0).toFixed(2)}%</span>
                        </div>
                    </div>
                    
                    {viewMode === 'variants' && displayVariants.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Variant Performance</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {displayVariants.map(variant => (
                                    <div key={variant.variantId} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                        <span className="font-medium">{variant.variantId}</span>
                                        <div className="text-right">
                                            <div className="text-sm text-gray-600">
                                                {(variant.totalSessions || 0).toLocaleString()} sessions
                                            </div>
                                            <div className="text-sm font-medium text-green-600">
                                                {(variant.conversionRate || 0).toFixed(1)}% conversion
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
