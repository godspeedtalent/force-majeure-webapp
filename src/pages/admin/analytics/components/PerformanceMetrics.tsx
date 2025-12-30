/**
 * Performance Metrics
 *
 * Displays Web Vitals and performance data.
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/shadcn/card';
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
  }
> = {
  largest_contentful_paint: {
    name: 'LCP',
    unit: 'ms',
    goodThreshold: 2500,
    poorThreshold: 4000,
    description: 'Largest Contentful Paint',
  },
  first_input_delay: {
    name: 'FID',
    unit: 'ms',
    goodThreshold: 100,
    poorThreshold: 300,
    description: 'First Input Delay',
  },
  cumulative_layout_shift: {
    name: 'CLS',
    unit: '',
    goodThreshold: 0.1,
    poorThreshold: 0.25,
    description: 'Cumulative Layout Shift',
  },
  interaction_to_next_paint: {
    name: 'INP',
    unit: 'ms',
    goodThreshold: 200,
    poorThreshold: 500,
    description: 'Interaction to Next Paint',
  },
  first_contentful_paint: {
    name: 'FCP',
    unit: 'ms',
    goodThreshold: 1800,
    poorThreshold: 3000,
    description: 'First Contentful Paint',
  },
  time_to_first_byte: {
    name: 'TTFB',
    unit: 'ms',
    goodThreshold: 800,
    poorThreshold: 1800,
    description: 'Time to First Byte',
  },
  page_load: {
    name: 'Page Load',
    unit: 'ms',
    goodThreshold: 3000,
    poorThreshold: 6000,
    description: 'Full page load time',
  },
  api_response: {
    name: 'API Response',
    unit: 'ms',
    goodThreshold: 200,
    poorThreshold: 500,
    description: 'API response time',
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
                  <span className="text-sm font-medium font-canela">
                    {metric.config.name}
                  </span>
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
