/**
 * Performance Metrics
 *
 * Displays Web Vitals and performance data.
 */

import { useMemo } from 'react';
import { HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/shadcn/card';
import { FmPortalTooltip } from '@/components/common/feedback/FmPortalTooltip';
import type { PerformanceSummary, PerformanceMetricType } from '@/features/analytics';

interface PerformanceMetricsProps {
  data: PerformanceSummary[];
}

const METRIC_CONFIG: Record<
  PerformanceMetricType,
  {
    name: string;
    unit: string;
    goodThreshold: number;
    poorThreshold: number;
    description: string;
    tooltip: string;
  }
> = {
  largest_contentful_paint: {
    name: 'LCP',
    unit: 'ms',
    goodThreshold: 2500,
    poorThreshold: 4000,
    description: 'Largest Contentful Paint',
    tooltip: 'Measures how long it takes for the largest content element (image, text block, or video) to become visible. Good: ≤2.5s, Poor: >4s. Improve by optimizing images, using a CDN, and preloading key resources.',
  },
  first_input_delay: {
    name: 'FID',
    unit: 'ms',
    goodThreshold: 100,
    poorThreshold: 300,
    description: 'First Input Delay',
    tooltip: 'Measures the time from when a user first interacts (click, tap, keypress) to when the browser responds. Good: ≤100ms, Poor: >300ms. Improve by reducing JavaScript execution time and breaking up long tasks.',
  },
  cumulative_layout_shift: {
    name: 'CLS',
    unit: '',
    goodThreshold: 0.1,
    poorThreshold: 0.25,
    description: 'Cumulative Layout Shift',
    tooltip: 'Measures visual stability by tracking unexpected layout shifts. Score is unitless (0-1+). Good: ≤0.1, Poor: >0.25. Improve by setting explicit dimensions for images/embeds and avoiding inserting content above existing content.',
  },
  interaction_to_next_paint: {
    name: 'INP',
    unit: 'ms',
    goodThreshold: 200,
    poorThreshold: 500,
    description: 'Interaction to Next Paint',
    tooltip: 'Measures responsiveness to all user interactions throughout the page lifecycle. Replaced FID as a Core Web Vital in 2024. Good: ≤200ms, Poor: >500ms. Improve by optimizing event handlers and reducing main thread blocking.',
  },
  first_contentful_paint: {
    name: 'FCP',
    unit: 'ms',
    goodThreshold: 1800,
    poorThreshold: 3000,
    description: 'First Contentful Paint',
    tooltip: 'Measures when the first text or image is painted on screen. Good: ≤1.8s, Poor: >3s. Improve by reducing server response time, eliminating render-blocking resources, and optimizing critical CSS.',
  },
  time_to_first_byte: {
    name: 'TTFB',
    unit: 'ms',
    goodThreshold: 800,
    poorThreshold: 1800,
    description: 'Time to First Byte',
    tooltip: 'Measures how long it takes for the browser to receive the first byte from the server. Good: ≤800ms, Poor: >1.8s. Improve by optimizing server code, using a CDN, and enabling caching.',
  },
  page_load: {
    name: 'Page Load',
    unit: 'ms',
    goodThreshold: 3000,
    poorThreshold: 6000,
    description: 'Full page load time',
    tooltip: 'Total time from navigation start until the page is fully loaded (including all resources). Good: ≤3s, Poor: >6s. Improve by reducing resource size, lazy loading non-critical resources, and optimizing network requests.',
  },
  api_response: {
    name: 'API Response',
    unit: 'ms',
    goodThreshold: 200,
    poorThreshold: 500,
    description: 'API response time',
    tooltip: 'Measures how long API calls take to return data. Good: ≤200ms, Poor: >500ms. Improve by optimizing database queries, adding indexes, using caching layers, and reducing payload sizes.',
  },
};

function getRatingColor(value: number, metric: PerformanceMetricType): string {
  const config = METRIC_CONFIG[metric];
  if (!config) return 'text-gray-400';

  if (value <= config.goodThreshold) return 'text-green-400';
  if (value <= config.poorThreshold) return 'text-yellow-400';
  return 'text-red-400';
}

function formatValue(value: number, unit: string): string {
  if (unit === 'ms' && value >= 1000) {
    return `${(value / 1000).toFixed(2)}s`;
  }
  if (unit === '') {
    return value.toFixed(3);
  }
  return `${Math.round(value)}${unit}`;
}

export function PerformanceMetrics({ data }: PerformanceMetricsProps) {
  // Get latest values for each metric type
  const latestMetrics = useMemo(() => {
    const byType = new Map<PerformanceMetricType, PerformanceSummary>();

    data.forEach(item => {
      const existing = byType.get(item.metric_type);
      if (!existing || item.day > existing.day) {
        byType.set(item.metric_type, item);
      }
    });

    return Array.from(byType.entries())
      .filter(([type]) => METRIC_CONFIG[type])
      .map(([type, summary]) => ({
        type,
        config: METRIC_CONFIG[type],
        ...summary,
      }));
  }, [data]);

  // Calculate health score percentages
  const healthScores = useMemo(() => {
    const totals = { good: 0, needsImprovement: 0, poor: 0, total: 0 };

    data.forEach(item => {
      totals.good += item.good_count;
      totals.needsImprovement += item.needs_improvement_count;
      totals.poor += item.poor_count;
      totals.total += item.sample_count;
    });

    if (totals.total === 0) return null;

    return {
      good: (totals.good / totals.total) * 100,
      needsImprovement: (totals.needsImprovement / totals.total) * 100,
      poor: (totals.poor / totals.total) * 100,
    };
  }, [data]);

  if (latestMetrics.length === 0) {
    return (
      <Card className="bg-black/60 border-white/20 rounded-none backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="font-canela">Performance metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            No performance data available.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Health Score Bar */}
      {healthScores && (
        <Card className="bg-black/60 border-white/20 rounded-none backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="font-canela">Overall health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-4 flex rounded-none overflow-hidden">
              <div
                className="bg-green-500 transition-all"
                style={{ width: `${healthScores.good}%` }}
              />
              <div
                className="bg-yellow-500 transition-all"
                style={{ width: `${healthScores.needsImprovement}%` }}
              />
              <div
                className="bg-red-500 transition-all"
                style={{ width: `${healthScores.poor}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                Good: {healthScores.good.toFixed(1)}%
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-yellow-500 rounded-full" />
                Needs improvement: {healthScores.needsImprovement.toFixed(1)}%
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-red-500 rounded-full" />
                Poor: {healthScores.poor.toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Core Web Vitals */}
      <Card className="bg-black/60 border-white/20 rounded-none backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="font-canela">Core Web Vitals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {latestMetrics.map(metric => (
              <div key={metric.type} className="space-y-2">
                <div className="flex items-center justify-between">
                  <FmPortalTooltip
                    content={
                      <div className="max-w-xs">
                        <div className="font-medium mb-1">{metric.config.description}</div>
                        <div className="text-muted-foreground">{metric.config.tooltip}</div>
                      </div>
                    }
                    side="top"
                    delayDuration={200}
                  >
                    <span className="text-sm font-medium font-canela cursor-help flex items-center gap-1 hover:text-fm-gold transition-colors">
                      {metric.config.name}
                      <HelpCircle className="h-3 w-3 text-muted-foreground" />
                    </span>
                  </FmPortalTooltip>
                  <span className="text-xs text-muted-foreground">
                    {metric.sample_count} samples
                  </span>
                </div>

                {/* P50 (Median) */}
                <div>
                  <div className="text-xs text-muted-foreground">P50 (median)</div>
                  <div
                    className={`text-xl font-bold font-canela ${getRatingColor(
                      metric.p50_value,
                      metric.type
                    )}`}
                  >
                    {formatValue(metric.p50_value, metric.config.unit)}
                  </div>
                </div>

                {/* P75 and P95 */}
                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">P75: </span>
                    <span className={getRatingColor(metric.p75_value, metric.type)}>
                      {formatValue(metric.p75_value, metric.config.unit)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">P95: </span>
                    <span className={getRatingColor(metric.p95_value, metric.type)}>
                      {formatValue(metric.p95_value, metric.config.unit)}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  {metric.config.description}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
