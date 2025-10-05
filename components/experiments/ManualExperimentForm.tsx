'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X, AlertCircle, CheckCircle } from 'lucide-react';

interface Variant {
  variantId: string;
  selector: string;
  html: string;
  css: string;
  position: 'INNER' | 'OUTER' | 'BEFORE' | 'AFTER' | 'APPEND' | 'PREPEND';
}

interface ManualExperimentFormProps {
  onSuccess?: (experimentId: string) => void;
  onCancel?: () => void;
}

export function ManualExperimentForm({ onSuccess, onCancel }: ManualExperimentFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [oec, setOec] = useState('');
  const [minDays, setMinDays] = useState(7);
  const [minSessionsPerVariant, setMinSessionsPerVariant] = useState(1000);
  const [targetUrls, setTargetUrls] = useState('');

  // Hypothesis state
  const [hypothesis, setHypothesis] = useState('');
  const [rationale, setRationale] = useState('');
  const [primaryKpi, setPrimaryKpi] = useState('');

  // Variants state
  const [variants, setVariants] = useState<Variant[]>([
    { variantId: 'A', selector: 'body', html: '', css: '', position: 'INNER' },
  ]);

  // Traffic distribution state
  const [useCustomTraffic, setUseCustomTraffic] = useState(false);
  const [trafficDistribution, setTrafficDistribution] = useState<Record<string, number>>({});

  const addVariant = () => {
    const nextId = String.fromCharCode(65 + variants.length); // A, B, C, etc.
    setVariants([...variants, {
      variantId: nextId,
      selector: 'body',
      html: '',
      css: '',
      position: 'INNER',
    }]);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: keyof Variant, value: string) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const payload: any = {
        name,
        oec,
        minDays,
        minSessionsPerVariant,
        hypothesis: {
          hypothesis,
          rationale,
          primaryKpi,
        },
        variants: variants.map(v => ({
          variantId: v.variantId,
          selector: v.selector || 'body',
          html: v.html || '',
          css: v.css || undefined,
          position: v.position || 'INNER',
        })),
      };

      // Add optional fields
      if (targetUrls.trim()) {
        payload.targetUrls = targetUrls.split(',').map(url => url.trim()).filter(url => url);
      }

      if (useCustomTraffic) {
        payload.trafficDistribution = trafficDistribution;
      }

      const response = await fetch('/api/experiments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create experiment');
      }

      setSuccess(true);
      if (onSuccess && data.experiment?.id) {
        setTimeout(() => onSuccess(data.experiment.id), 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create experiment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
      {/* Error/Success Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Error Creating Experiment</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-green-800">Experiment Created Successfully</h3>
            <p className="text-sm text-green-700 mt-1">Redirecting...</p>
          </div>
        </div>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Experiment Name *
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Button Color Test"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Overall Evaluation Criterion (OEC) *
            </label>
            <Input
              type="text"
              value={oec}
              onChange={(e) => setOec(e.target.value)}
              placeholder="e.g., Increase add-to-cart conversion rate"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Days
              </label>
              <Input
                type="number"
                value={minDays}
                onChange={(e) => setMinDays(parseInt(e.target.value))}
                min={1}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Sessions Per Variant
              </label>
              <Input
                type="number"
                value={minSessionsPerVariant || ''}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setMinSessionsPerVariant(isNaN(value) ? 0 : value);
                }}
                min={1}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target URLs (optional, comma-separated)
            </label>
            <Input
              type="text"
              value={targetUrls}
              onChange={(e) => setTargetUrls(e.target.value)}
              placeholder="e.g., /products/*, /checkout"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to run on all pages. Use wildcards like /products/* for patterns.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Hypothesis */}
      <Card>
        <CardHeader>
          <CardTitle>Hypothesis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hypothesis Statement *
            </label>
            <textarea
              value={hypothesis}
              onChange={(e) => setHypothesis(e.target.value)}
              placeholder="e.g., Changing the button color to green will increase conversions"
              required
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rationale *
            </label>
            <textarea
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="e.g., Green is associated with positive action"
              required
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Primary KPI *
            </label>
            <Input
              type="text"
              value={primaryKpi}
              onChange={(e) => setPrimaryKpi(e.target.value)}
              placeholder="e.g., add_to_cart_rate"
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* Variants */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Variants</CardTitle>
          <Button type="button" onClick={addVariant} size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Variant
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {variants.map((variant, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">Variant {variant.variantId}</h4>
                {variants.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => removeVariant(index)}
                    size="sm"
                    variant="ghost"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Variant ID
                  </label>
                  <Input
                    type="text"
                    value={variant.variantId}
                    onChange={(e) => updateVariant(index, 'variantId', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    ⭐ APPEND/PREPEND are safer for CSS injection and content addition
                  </p>
                  <select
                    value={variant.position}
                    onChange={(e) => updateVariant(index, 'position', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="INNER">Inner (Replace content)</option>
                    <option value="OUTER">Outer (Replace element)</option>
                    <option value="BEFORE">Before (Insert before)</option>
                    <option value="AFTER">After (Insert after)</option>
                    <option value="APPEND">Append (Add as last child) ⭐</option>
                    <option value="PREPEND">Prepend (Add as first child) ⭐</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CSS Selector
                </label>
                <Input
                  type="text"
                  value={variant.selector}
                  onChange={(e) => updateVariant(index, 'selector', e.target.value)}
                  placeholder="e.g., .add-to-cart-button"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  HTML Content
                </label>
                <textarea
                  value={variant.html}
                  onChange={(e) => updateVariant(index, 'html', e.target.value)}
                  placeholder="e.g., <button>Click Me</button>"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CSS Styles
                </label>
                <textarea
                  value={variant.css}
                  onChange={(e) => updateVariant(index, 'css', e.target.value)}
                  placeholder="e.g., .button { background: green; }"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        {onCancel && (
          <Button type="button" onClick={onCancel} variant="outline" disabled={loading}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Experiment'}
        </Button>
      </div>
    </form>
  );
}
