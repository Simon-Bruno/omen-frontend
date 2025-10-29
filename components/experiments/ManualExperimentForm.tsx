'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X, AlertCircle, CheckCircle } from 'lucide-react';

interface Variant {
  variantId: string;
  selector: string;
  html: string;
  css: string;
  js?: string;
  position: 'INNER' | 'OUTER' | 'BEFORE' | 'AFTER' | 'APPEND' | 'PREPEND';
}

interface Goal {
  name: string;
  type: 'conversion' | 'custom' | 'purchase';
  role?: 'primary' | 'mechanism' | 'guardrail';
  selector?: string;
  eventType?: string;
  customJs?: string;
  value?: number;
  // Purchase-specific fields
  valueSelector?: string;
  itemCountSelector?: string;
  currency?: string;
  // Goal-specific targeting (optional - overrides experiment targeting)
  targetUrls?: string[];
  bodyClasses?: string[];
  targeting?: {
    match: 'all' | 'any';
    timeoutMs?: number;
    rules: Array<{
      type: 'selectorExists' | 'selectorNotExists' | 'textContains' | 'attrEquals' | 'meta' | 'cookie' | 'localStorage' | 'urlParam';
      selector?: string;
      text?: string;
      attr?: string;
      value?: string;
      name?: string;
      by?: 'name' | 'property';
      key?: string;
    }>;
  };
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
  const [targetingJson, setTargetingJson] = useState('');
  const [allowedDevices, setAllowedDevices] = useState<string[]>(['mobile', 'tablet', 'desktop']);

  // Hypothesis state
  const [hypothesis, setHypothesis] = useState('');
  const [rationale, setRationale] = useState('');
  const [primaryKpi, setPrimaryKpi] = useState('');

  // Variants state
  const [variants, setVariants] = useState<Variant[]>([
    { variantId: 'A', selector: 'body', html: '', css: '', js: '', position: 'INNER' },
  ]);

  // Traffic distribution state
  const [useCustomTraffic, setUseCustomTraffic] = useState(false);
  const [trafficDistribution, setTrafficDistribution] = useState<Record<string, number>>({});
  const [skipControl, setSkipControl] = useState(false);

  // Goals state
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedShopifyEvents, setSelectedShopifyEvents] = useState<Set<string>>(new Set());

  const shopifyEventConfig: Record<string, { name: string; type: 'custom' | 'purchase'; role: 'primary' | 'mechanism' | 'guardrail' }> = {
    'checkout_completed': { name: 'Purchase Conversion', type: 'purchase', role: 'primary' },
    'product_added_to_cart': { name: 'Add to Cart', type: 'custom', role: 'mechanism' },
    'product_viewed': { name: 'Product Views', type: 'custom', role: 'guardrail' },
    'page_viewed': { name: 'Page Views', type: 'custom', role: 'guardrail' },
  };

  const shopifyEventNames = ['checkout_completed', 'product_added_to_cart', 'product_viewed', 'page_viewed'];

  const isShopifyEventGoal = (goal: Goal): boolean => {
    return !!goal.eventType && shopifyEventNames.includes(goal.eventType);
  };

  const handleShopifyEventToggle = (eventType: string, checked: boolean) => {
    const newSelected = new Set(selectedShopifyEvents);
    if (checked) {
      newSelected.add(eventType);
      // Add the goal automatically
      const config = shopifyEventConfig[eventType];
      if (config) {
        setGoals([...goals, {
          name: config.name,
          type: config.type,
          role: config.role,
          eventType: eventType,
        }]);
      }
    } else {
      newSelected.delete(eventType);
      // Remove the corresponding goal (only if it matches the eventType)
      setGoals(goals.filter(goal => !(goal.eventType === eventType && isShopifyEventGoal(goal))));
    }
    setSelectedShopifyEvents(newSelected);
  };

  const addVariant = () => {
    const nextId = String.fromCharCode(65 + variants.length); // A, B, C, etc.
    setVariants([...variants, {
      variantId: nextId,
      selector: 'body',
      html: '',
      css: '',
      js: '',
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

  const addGoal = () => {
    setGoals([...goals, {
      name: '',
      type: 'conversion',
      role: 'primary',
      eventType: 'click',
    }]);
  };

  const removeGoal = (index: number) => {
    const goalToRemove = goals[index];
    // If it's a Shopify event goal, remove from selectedShopifyEvents
    if (goalToRemove && isShopifyEventGoal(goalToRemove) && goalToRemove.eventType) {
      const newSelected = new Set(selectedShopifyEvents);
      newSelected.delete(goalToRemove.eventType);
      setSelectedShopifyEvents(newSelected);
    }
    setGoals(goals.filter((_, i) => i !== index));
  };

  const updateGoal = (index: number, field: keyof Goal, value: any) => {
    const updated = [...goals];
    const oldGoal = updated[index];
    updated[index] = { ...updated[index], [field]: value };
    
    // If eventType is changed and it was a Shopify event, update checkboxes
    if (field === 'eventType') {
      const newSelected = new Set(selectedShopifyEvents);
      // Remove old Shopify event if it was one
      if (oldGoal.eventType && shopifyEventNames.includes(oldGoal.eventType)) {
        newSelected.delete(oldGoal.eventType);
      }
      // Add new Shopify event if it's one
      if (value && shopifyEventNames.includes(value)) {
        newSelected.add(value);
      }
      setSelectedShopifyEvents(newSelected);
    }
    
    setGoals(updated);
  };

  // Sync checkboxes with existing goals on mount
  useEffect(() => {
    const shopifyGoals = goals.filter(goal => isShopifyEventGoal(goal));
    const eventTypes = new Set(shopifyGoals.map(goal => goal.eventType).filter(Boolean) as string[]);
    setSelectedShopifyEvents(eventTypes);
  }, []); // Only run on mount

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
          js: v.js || undefined,
          position: v.position || 'INNER',
        })),
        goals: goals.filter(g => g.name).map(g => ({
          name: g.name,
          type: g.type,
          role: g.role || 'primary',
          ...(g.selector && { selector: g.selector }),
          ...(g.eventType && { eventType: g.eventType }),
          ...(g.customJs && { customJs: g.customJs }),
          ...(g.targetUrls && g.targetUrls.length > 0 && { targetUrls: g.targetUrls }),
          ...(g.bodyClasses && g.bodyClasses.length > 0 && { bodyClasses: g.bodyClasses }),
          ...(g.value !== undefined && { value: g.value }),
          ...(g.valueSelector && { valueSelector: g.valueSelector }),
          ...(g.currency && { currency: g.currency }),
        })),
      };

      // DEBUG: Log the payload being sent
      console.log('🚀 [ManualExperimentForm] Sending payload:', JSON.stringify(payload, null, 2));
      console.log('🎯 [ManualExperimentForm] Goals being sent:', goals.filter(g => g.name));

      // Add optional fields
      if (targetUrls.trim()) {
        try {
          // Try to parse as JSON first (in case it's a stringified array)
          const parsed = JSON.parse(targetUrls);
          if (Array.isArray(parsed)) {
            payload.targetUrls = parsed;
          } else {
            // Fallback to comma-split
            payload.targetUrls = targetUrls.split(',').map(url => url.trim()).filter(url => url);
          }
        } catch {
          // Not JSON, treat as comma-separated
          payload.targetUrls = targetUrls.split(',').map(url => url.trim()).filter(url => url);
        }
      }

      // Add device targeting if not all devices selected
      if (allowedDevices.length > 0 && allowedDevices.length < 3) {
        payload.allowedDevices = allowedDevices;
      }

      if (useCustomTraffic) {
        payload.trafficDistribution = trafficDistribution;
      }

      // Skip control allocation flag
      if (skipControl) {
        payload.skipControl = true;
        // Optional UX guard: if custom traffic was provided, strip any accidental 'control' key
        if (payload.trafficDistribution && 'control' in payload.trafficDistribution) {
          const { control, ...rest } = payload.trafficDistribution as Record<string, number>;
          payload.trafficDistribution = rest;
        }
      }

      // Optional DOM targeting JSON block
      console.log('🔍 targetingJson value:', JSON.stringify(targetingJson));
      if (targetingJson.trim()) {
        try {
          const parsed = JSON.parse(targetingJson);
          console.log('🔍 parsed targeting:', parsed);
          // Validate required structure
          if (!parsed.rules || !Array.isArray(parsed.rules) || parsed.rules.length === 0) {
            throw new Error('targeting must have a non-empty rules array. Expected: {"match":"all","rules":[{"type":"selectorExists","selector":"..."}]}');
          }
          // Ensure match and timeoutMs have defaults
          if (!parsed.match) parsed.match = 'all';
          if (!parsed.timeoutMs) parsed.timeoutMs = 1500;
          payload.targeting = parsed;
          console.log('✅ targeting added to payload');
        } catch (err) {
          console.error('❌ targeting parse error:', err);
          throw new Error(`Invalid DOM targeting JSON: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      } else {
        console.log('ℹ️ No targeting JSON provided');
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

          <div className="flex items-center gap-3 pt-2">
            <input
              id="skip-control"
              type="checkbox"
              checked={skipControl}
              onChange={(e) => setSkipControl(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="skip-control" className="text-sm text-gray-700 select-none">
              Skip control allocation (allocate 100% across variants only)
            </label>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Device Targeting
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowedDevices.includes('mobile')}
                  onChange={(e) => {
                    setAllowedDevices(prev =>
                      e.target.checked
                        ? [...prev, 'mobile']
                        : prev.filter(d => d !== 'mobile')
                    );
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Mobile</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowedDevices.includes('tablet')}
                  onChange={(e) => {
                    setAllowedDevices(prev =>
                      e.target.checked
                        ? [...prev, 'tablet']
                        : prev.filter(d => d !== 'tablet')
                    );
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Tablet</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowedDevices.includes('desktop')}
                  onChange={(e) => {
                    setAllowedDevices(prev =>
                      e.target.checked
                        ? [...prev, 'desktop']
                        : prev.filter(d => d !== 'desktop')
                    );
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Desktop</span>
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Select which device types should see this experiment. All devices selected by default.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              DOM Targeting JSON (optional)
            </label>
            <textarea
              value={targetingJson}
              onChange={(e) => setTargetingJson(e.target.value)}
              placeholder='{"match":"all","timeoutMs":1500,"rules":[{"type":"selectorExists","selector":"form[action*=/cart/add]"}]}'
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Declarative rules: selectorExists, selectorNotExists, textContains, attrEquals, meta, cookie, localStorage, urlParam
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  JavaScript (optional)
                </label>
                <textarea
                  value={variant.js || ''}
                  onChange={(e) => updateVariant(index, 'js', e.target.value)}
                  placeholder="e.g., document.querySelector('.btn')?.addEventListener('click', () => {...})"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Goals - Universal conversion tracking */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Conversion Goals</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Define conversion events that apply to ALL variants (including control)
            </p>
          </div>
          <Button type="button" onClick={addGoal} size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Goal
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Shopify Web Pixel Events */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <label className="block text-sm font-medium text-gray-900 mb-3">
              Shopify Web Pixel Events
            </label>
            <p className="text-xs text-gray-600 mb-3">
              Select Shopify events to automatically add as goals. These will track events from your Shopify web pixel.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedShopifyEvents.has('checkout_completed')}
                  onChange={(e) => handleShopifyEventToggle('checkout_completed', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Checkout Completed (Purchase)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedShopifyEvents.has('product_added_to_cart')}
                  onChange={(e) => handleShopifyEventToggle('product_added_to_cart', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Product Added to Cart</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedShopifyEvents.has('product_viewed')}
                  onChange={(e) => handleShopifyEventToggle('product_viewed', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Product Viewed</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedShopifyEvents.has('page_viewed')}
                  onChange={(e) => handleShopifyEventToggle('page_viewed', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Page Viewed</span>
              </label>
            </div>
          </div>
          {goals.length === 0 ? (
            <p className="text-gray-500 text-sm">
              No goals defined. Add goals to track conversions consistently across all variants.
            </p>
          ) : (
            goals.map((goal, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">Goal {index + 1}</h4>
                  <Button
                    type="button"
                    onClick={() => removeGoal(index)}
                    size="sm"
                    variant="ghost"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Goal Name *
                    </label>
                    <Input
                      type="text"
                      value={goal.name}
                      onChange={(e) => updateGoal(index, 'name', e.target.value)}
                      placeholder="e.g., signup_click, add_to_cart"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Used in analytics to identify this conversion
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      value={goal.role || 'primary'}
                      onChange={(e) => updateGoal(index, 'role', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="primary">Primary (main KPI)</option>
                      <option value="mechanism">Mechanism (how it works)</option>
                      <option value="guardrail">Guardrail (safety check)</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Primary: Main success metric. Mechanism: How the variant works. Guardrail: Safety check.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Event Type
                    </label>
                    <select
                      value={goal.type}
                      onChange={(e) => updateGoal(index, 'type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="conversion">Conversion Event</option>
                      <option value="custom">Custom Event</option>
                      <option value="purchase">Purchase Event</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Conversion events count toward conversion rate
                    </p>
                  </div>
                </div>

                {/* Show Shopify event indicator if this is a Shopify goal */}
                {isShopifyEventGoal(goal) && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-800">
                      <strong>Shopify Event:</strong> This goal tracks the <code className="px-1 py-0.5 bg-blue-100 rounded">{goal.eventType}</code> event from your Shopify web pixel.
                    </p>
                  </div>
                )}

                {/* DOM-based tracking */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Element Selector (optional - for DOM tracking)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      type="text"
                      value={goal.selector || ''}
                      onChange={(e) => updateGoal(index, 'selector', e.target.value)}
                      placeholder="e.g., button.signup, #checkout-btn"
                      disabled={isShopifyEventGoal(goal)}
                      className="disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                    <select
                      value={goal.eventType || 'click'}
                      onChange={(e) => updateGoal(index, 'eventType', e.target.value)}
                      disabled={!goal.selector || isShopifyEventGoal(goal)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="click">Click</option>
                      <option value="submit">Submit</option>
                      <option value="change">Change</option>
                      <option value="focus">Focus</option>
                      <option value="blur">Blur</option>
                    </select>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Track when users interact with specific elements. {isShopifyEventGoal(goal) && 'Disabled for Shopify events.'}
                  </p>
                </div>

                {/* Custom JavaScript */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom JavaScript Condition (optional)
                  </label>
                  <textarea
                    value={goal.customJs || ''}
                    onChange={(e) => updateGoal(index, 'customJs', e.target.value)}
                    placeholder="e.g., window.scrollY > 1000 || document.querySelector('.video').currentTime > 30"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    JavaScript expression that returns true when goal should fire
                  </p>
                </div>

                {/* Navigation/Pageview tracking */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target URLs (optional - for navigation goals)
                  </label>
                  <Input
                    type="text"
                    value={goal.targetUrls?.join(', ') || ''}
                    onChange={(e) => {
                      const urls = e.target.value.split(',').map(u => u.trim()).filter(u => u);
                      updateGoal(index, 'targetUrls', urls.length > 0 ? urls : undefined);
                    }}
                    placeholder="e.g., /collections/*, /products/*"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Track pageviews to these URLs. Works with all tracking methods above.
                  </p>
                </div>

                {/* Body Classes tracking */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Body Classes (optional - for page type matching)
                  </label>
                  <Input
                    type="text"
                    value={goal.bodyClasses?.join(', ') || ''}
                    onChange={(e) => {
                      const classes = e.target.value.split(',').map(c => c.trim()).filter(c => c);
                      updateGoal(index, 'bodyClasses', classes.length > 0 ? classes : undefined);
                    }}
                    placeholder="e.g., catalog-category-view, cms-page-view"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Track pages with specific body classes (useful for Magento, etc.)
                  </p>
                </div>

                {/* Optional value */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Goal Value (optional)
                  </label>
                  <Input
                    type="number"
                    value={goal.value || ''}
                    onChange={(e) => updateGoal(index, 'value', parseFloat(e.target.value) || undefined)}
                    placeholder="e.g., 10.00"
                    step="0.01"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Numeric value for this conversion (e.g., cart value, progress %)
                  </p>
                </div>

                {/* Purchase-specific fields */}
                {goal.type === 'purchase' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Value Selector (required for purchase)
                      </label>
                      <Input
                        type="text"
                        value={goal.valueSelector || ''}
                        onChange={(e) => updateGoal(index, 'valueSelector', e.target.value)}
                        placeholder="e.g., .total-price, #order-total"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        CSS selector to extract purchase value from DOM
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Item Count Selector (optional)
                      </label>
                      <Input
                        type="text"
                        value={goal.itemCountSelector || ''}
                        onChange={(e) => updateGoal(index, 'itemCountSelector', e.target.value)}
                        placeholder="e.g., .item-count, #quantity"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        CSS selector to extract number of items purchased
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Currency
                      </label>
                      <Input
                        type="text"
                        value={goal.currency || 'USD'}
                        onChange={(e) => updateGoal(index, 'currency', e.target.value)}
                        placeholder="USD"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Currency code for the purchase (default: USD)
                      </p>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
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
