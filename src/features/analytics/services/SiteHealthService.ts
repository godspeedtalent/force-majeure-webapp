/**
 * Site Health Service
 *
 * Aggregates data from multiple sources to generate a comprehensive
 * site health report optimized for AI analysis.
 */

import { supabase, logger } from '@/shared';
import { SupabaseAnalyticsAdapter } from '../adapters/SupabaseAnalyticsAdapter';
import { SupabaseErrorLogAdapter } from '@/features/error-logging/adapters/SupabaseErrorLogAdapter';
import { FEATURE_FLAGS, FEATURE_FLAG_METADATA } from '@/shared/config/featureFlags';
import { DEFAULT_ANALYTICS_CONFIG } from '../types';
import type {
  SiteHealthReport,
  SiteHealthOverview,
  PerformanceHealthSection,
  ErrorHealthSection,
  FunnelHealthSection,
  ConfigurationSection,
  WebVitalSummary,
  SlowPageEntry,
  SlowEndpointEntry,
  ErrorPattern,
  RecentError,
  ErrorCountByLevel,
} from '../types/siteHealth';
import type { PerformanceSummary, MetricRating } from '../types';
import type { StoredErrorLog } from '@/features/error-logging/types';

const healthLogger = logger.createNamespace('SiteHealthService');

// Web Vitals display configuration
const WEB_VITALS_CONFIG: Record<
  string,
  { displayName: string; unit: string; goodThreshold: number; poorThreshold: number }
> = {
  largest_contentful_paint: { displayName: 'LCP', unit: 'ms', goodThreshold: 2500, poorThreshold: 4000 },
  first_input_delay: { displayName: 'FID', unit: 'ms', goodThreshold: 100, poorThreshold: 300 },
  cumulative_layout_shift: { displayName: 'CLS', unit: '', goodThreshold: 0.1, poorThreshold: 0.25 },
  interaction_to_next_paint: { displayName: 'INP', unit: 'ms', goodThreshold: 200, poorThreshold: 500 },
  first_contentful_paint: { displayName: 'FCP', unit: 'ms', goodThreshold: 1800, poorThreshold: 3000 },
  time_to_first_byte: { displayName: 'TTFB', unit: 'ms', goodThreshold: 800, poorThreshold: 1800 },
  page_load: { displayName: 'Page Load', unit: 'ms', goodThreshold: 3000, poorThreshold: 6000 },
  api_response: { displayName: 'API Response', unit: 'ms', goodThreshold: 500, poorThreshold: 1500 },
};

export class SiteHealthService {
  private analyticsAdapter: SupabaseAnalyticsAdapter;
  private errorLogAdapter: SupabaseErrorLogAdapter;
  private readonly QUERY_TIMEOUT_MS = 10_000; // 10 second timeout for health queries

  constructor() {
    this.analyticsAdapter = new SupabaseAnalyticsAdapter();
    this.errorLogAdapter = new SupabaseErrorLogAdapter(supabase);
  }

  /**
   * Wrap a promise with a timeout to prevent indefinite hangs
   */
  private withTimeout<T>(promise: Promise<T>, timeoutMs: number = this.QUERY_TIMEOUT_MS): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Query timeout after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
  }

  /**
   * Generate a complete site health report
   */
  async generateHealthReport(dateRange: { start: Date; end: Date }): Promise<SiteHealthReport> {
    healthLogger.info('Generating site health report', {
      startDate: dateRange.start.toISOString(),
      endDate: dateRange.end.toISOString(),
    });

    const days = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));

    // Fetch all data in parallel with timeout protection
    const [overview, performance, errors, funnel, configuration] = await this.withTimeout(
      Promise.all([
        this.getOverview(dateRange),
        this.getPerformanceHealth(dateRange),
        this.getErrorHealth(dateRange),
        this.getFunnelHealth(),
        this.getConfiguration(),
      ]),
      30_000 // 30 second timeout for entire health report generation
    );

    return {
      generatedAt: new Date().toISOString(),
      dateRange: {
        start: dateRange.start.toISOString(),
        end: dateRange.end.toISOString(),
        days,
      },
      overview,
      performance,
      errors,
      funnel,
      configuration,
    };
  }

  /**
   * Get overview statistics
   */
  private async getOverview(dateRange: { start: Date; end: Date }): Promise<SiteHealthOverview> {
    const result = await this.analyticsAdapter.getOverviewStats(dateRange.start, dateRange.end);

    if (!result.success || !result.data) {
      healthLogger.warn('Failed to fetch overview stats', { error: result.error });
      return {
        totalSessions: 0,
        uniqueUsers: 0,
        totalPageViews: 0,
        avgSessionDurationMs: 0,
        bounceRate: 0,
        avgPagesPerSession: 0,
        activeSessions: 0,
      };
    }

    return {
      totalSessions: result.data.totalSessions,
      uniqueUsers: result.data.totalUsers,
      totalPageViews: result.data.totalPageViews,
      avgSessionDurationMs: result.data.avgSessionDuration,
      bounceRate: result.data.bounceRate,
      avgPagesPerSession: result.data.avgPagesPerSession,
      activeSessions: result.data.activeSessions,
    };
  }

  /**
   * Get performance health metrics
   */
  private async getPerformanceHealth(dateRange: { start: Date; end: Date }): Promise<PerformanceHealthSection> {
    const result = await this.analyticsAdapter.getPerformanceSummary(dateRange.start, dateRange.end);

    if (!result.success || !result.data) {
      healthLogger.warn('Failed to fetch performance data', { error: result.error });
      return {
        webVitals: [],
        overallRating: 'needs-improvement',
        slowestPages: [],
        slowestEndpoints: [],
      };
    }

    // Group performance data by metric type and aggregate
    const metricGroups = this.aggregatePerformanceByMetric(result.data);
    const webVitals = this.buildWebVitalsSummary(metricGroups);

    // Calculate overall rating based on Core Web Vitals
    const overallRating = this.calculateOverallRating(webVitals);

    // Get slowest pages and endpoints from raw performance data
    const [slowestPages, slowestEndpoints] = await Promise.all([
      this.getSlowestPages(dateRange),
      this.getSlowestEndpoints(dateRange),
    ]);

    return {
      webVitals,
      overallRating,
      slowestPages,
      slowestEndpoints,
    };
  }

  /**
   * Aggregate performance summaries by metric type
   */
  private aggregatePerformanceByMetric(data: PerformanceSummary[]): Map<string, PerformanceSummary[]> {
    const groups = new Map<string, PerformanceSummary[]>();

    for (const item of data) {
      const existing = groups.get(item.metric_type) || [];
      existing.push(item);
      groups.set(item.metric_type, existing);
    }

    return groups;
  }

  /**
   * Build Web Vitals summary from aggregated data
   */
  private buildWebVitalsSummary(metricGroups: Map<string, PerformanceSummary[]>): WebVitalSummary[] {
    const summaries: WebVitalSummary[] = [];

    for (const [metricType, items] of metricGroups) {
      const config = WEB_VITALS_CONFIG[metricType];
      if (!config) continue;

      // Aggregate across all days
      const totalSamples = items.reduce((sum, i) => sum + i.sample_count, 0);
      if (totalSamples === 0) continue;

      // Weighted averages for percentiles
      const weightedP50 = items.reduce((sum, i) => sum + i.p50_value * i.sample_count, 0) / totalSamples;
      const weightedP75 = items.reduce((sum, i) => sum + i.p75_value * i.sample_count, 0) / totalSamples;
      const weightedP95 = items.reduce((sum, i) => sum + i.p95_value * i.sample_count, 0) / totalSamples;

      // Sum up rating counts
      const goodCount = items.reduce((sum, i) => sum + i.good_count, 0);
      const needsImprovementCount = items.reduce((sum, i) => sum + i.needs_improvement_count, 0);
      const poorCount = items.reduce((sum, i) => sum + i.poor_count, 0);

      const goodPercent = (goodCount / totalSamples) * 100;
      const needsImprovementPercent = (needsImprovementCount / totalSamples) * 100;
      const poorPercent = (poorCount / totalSamples) * 100;

      // Determine rating based on P75
      let rating: MetricRating = 'good';
      if (weightedP75 > config.poorThreshold) {
        rating = 'poor';
      } else if (weightedP75 > config.goodThreshold) {
        rating = 'needs-improvement';
      }

      summaries.push({
        metric: metricType,
        displayName: config.displayName,
        unit: config.unit,
        p50: Math.round(weightedP50 * 100) / 100,
        p75: Math.round(weightedP75 * 100) / 100,
        p95: Math.round(weightedP95 * 100) / 100,
        goodPercent: Math.round(goodPercent * 10) / 10,
        needsImprovementPercent: Math.round(needsImprovementPercent * 10) / 10,
        poorPercent: Math.round(poorPercent * 10) / 10,
        rating,
        sampleCount: totalSamples,
      });
    }

    // Sort by importance (Core Web Vitals first)
    const order = ['largest_contentful_paint', 'first_input_delay', 'cumulative_layout_shift', 'interaction_to_next_paint'];
    summaries.sort((a, b) => {
      const aIndex = order.indexOf(a.metric);
      const bIndex = order.indexOf(b.metric);
      if (aIndex >= 0 && bIndex >= 0) return aIndex - bIndex;
      if (aIndex >= 0) return -1;
      if (bIndex >= 0) return 1;
      return 0;
    });

    return summaries;
  }

  /**
   * Calculate overall rating based on Core Web Vitals
   */
  private calculateOverallRating(webVitals: WebVitalSummary[]): MetricRating {
    const coreVitals = webVitals.filter(v =>
      ['largest_contentful_paint', 'first_input_delay', 'cumulative_layout_shift', 'interaction_to_next_paint'].includes(v.metric)
    );

    if (coreVitals.length === 0) return 'needs-improvement';

    const poorCount = coreVitals.filter(v => v.rating === 'poor').length;
    const goodCount = coreVitals.filter(v => v.rating === 'good').length;

    if (poorCount > 0) return 'poor';
    if (goodCount === coreVitals.length) return 'good';
    return 'needs-improvement';
  }

  /**
   * Get slowest pages by load time
   */
  private async getSlowestPages(dateRange: { start: Date; end: Date }): Promise<SlowPageEntry[]> {
    try {
      // Query raw performance metrics for page_load grouped by page_path
      // Limit to 100k rows to prevent memory exhaustion
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await this.withTimeout(
        (supabase as any)
          .from('analytics_performance')
          .select('page_path, metric_value')
          .eq('metric_type', 'page_load')
          .gte('recorded_at', dateRange.start.toISOString())
          .lte('recorded_at', dateRange.end.toISOString())
          .limit(100_000)
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = result as { data: any[] | null; error: { message: string } | null };

      if (error || !data) return [];

      // Group by page_path and calculate stats
      const pageStats = new Map<string, number[]>();
      for (const row of data) {
        const values = pageStats.get(row.page_path) || [];
        values.push(row.metric_value);
        pageStats.set(row.page_path, values);
      }

      // Calculate averages and p95
      const entries: SlowPageEntry[] = [];
      for (const [pagePath, values] of pageStats) {
        if (values.length < 3) continue; // Need minimum samples

        values.sort((a, b) => a - b);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const p95Index = Math.floor(values.length * 0.95);
        const p95 = values[p95Index] || values[values.length - 1];

        entries.push({
          pagePath,
          avgLoadTimeMs: Math.round(avg),
          p95LoadTimeMs: Math.round(p95),
          sampleCount: values.length,
        });
      }

      // Sort by p95 descending and take top 10
      return entries
        .sort((a, b) => b.p95LoadTimeMs - a.p95LoadTimeMs)
        .slice(0, 10);
    } catch (err) {
      healthLogger.warn('Failed to fetch slowest pages', { error: err });
      return [];
    }
  }

  /**
   * Get slowest API endpoints
   */
  private async getSlowestEndpoints(dateRange: { start: Date; end: Date }): Promise<SlowEndpointEntry[]> {
    try {
      // Query raw performance metrics for api_response grouped by endpoint
      // Limit to 100k rows to prevent memory exhaustion
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await this.withTimeout(
        (supabase as any)
          .from('analytics_performance')
          .select('endpoint, metric_value, metric_rating')
          .eq('metric_type', 'api_response')
          .not('endpoint', 'is', null)
          .gte('recorded_at', dateRange.start.toISOString())
          .lte('recorded_at', dateRange.end.toISOString())
          .limit(100_000)
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = result as { data: any[] | null; error: { message: string } | null };

      if (error || !data) return [];

      // Group by endpoint and calculate stats
      const endpointStats = new Map<string, { values: number[]; poorCount: number }>();
      for (const row of data) {
        if (!row.endpoint) continue;
        const existing = endpointStats.get(row.endpoint) || { values: [], poorCount: 0 };
        existing.values.push(row.metric_value);
        if (row.metric_rating === 'poor') existing.poorCount++;
        endpointStats.set(row.endpoint, existing);
      }

      // Calculate averages, p95, and error rates
      const entries: SlowEndpointEntry[] = [];
      for (const [endpoint, stats] of endpointStats) {
        if (stats.values.length < 3) continue;

        stats.values.sort((a, b) => a - b);
        const avg = stats.values.reduce((a, b) => a + b, 0) / stats.values.length;
        const p95Index = Math.floor(stats.values.length * 0.95);
        const p95 = stats.values[p95Index] || stats.values[stats.values.length - 1];
        const errorRate = (stats.poorCount / stats.values.length) * 100;

        entries.push({
          endpoint,
          avgResponseTimeMs: Math.round(avg),
          p95ResponseTimeMs: Math.round(p95),
          errorRate: Math.round(errorRate * 10) / 10,
          sampleCount: stats.values.length,
        });
      }

      // Sort by p95 descending and take top 10
      return entries
        .sort((a, b) => b.p95ResponseTimeMs - a.p95ResponseTimeMs)
        .slice(0, 10);
    } catch (err) {
      healthLogger.warn('Failed to fetch slowest endpoints', { error: err });
      return [];
    }
  }

  /**
   * Get error health metrics
   */
  private async getErrorHealth(dateRange: { start: Date; end: Date }): Promise<ErrorHealthSection> {
    const [summary, recentErrors, previousPeriodCount] = await Promise.all([
      this.errorLogAdapter.getSummary(dateRange.start.toISOString(), dateRange.end.toISOString()),
      this.errorLogAdapter.query(
        {
          levels: ['error', 'fatal'],
          dateFrom: dateRange.start.toISOString(),
          dateTo: dateRange.end.toISOString(),
        },
        1,
        20
      ),
      this.getPreviousPeriodErrorCount(dateRange),
    ]);

    // Build count by level
    const countByLevel: ErrorCountByLevel = {
      fatal: 0,
      error: 0,
      warn: 0,
      info: 0,
      debug: 0,
    };

    if (summary.success && summary.data) {
      for (const item of summary.data) {
        if (item.level in countByLevel) {
          countByLevel[item.level as keyof ErrorCountByLevel] = item.count;
        }
      }
    }

    const totalCount = Object.values(countByLevel).reduce((a, b) => a + b, 0);

    // Calculate trend
    let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
    let trendPercentChange = 0;

    if (previousPeriodCount > 0) {
      const criticalCount = countByLevel.error + countByLevel.fatal;
      const change = ((criticalCount - previousPeriodCount) / previousPeriodCount) * 100;
      trendPercentChange = Math.round(change);

      if (change > 10) trend = 'increasing';
      else if (change < -10) trend = 'decreasing';
    }

    // Build error patterns from recent errors
    const topErrorPatterns = this.buildErrorPatterns(recentErrors.success ? recentErrors.data?.data || [] : []);

    // Build recent critical errors list
    const recentCriticalErrors: RecentError[] = (recentErrors.success ? recentErrors.data?.data || [] : [])
      .slice(0, 5)
      .map((err: StoredErrorLog) => ({
        timestamp: err.createdAt,
        level: err.level,
        message: err.message.slice(0, 200),
        source: err.source,
        endpoint: err.endpoint,
        statusCode: err.statusCode,
      }));

    return {
      countByLevel,
      totalCount,
      topErrorPatterns,
      recentCriticalErrors,
      trend,
      trendPercentChange,
    };
  }

  /**
   * Get error count from previous period for trend calculation
   */
  private async getPreviousPeriodErrorCount(currentRange: { start: Date; end: Date }): Promise<number> {
    const duration = currentRange.end.getTime() - currentRange.start.getTime();
    const previousStart = new Date(currentRange.start.getTime() - duration);
    const previousEnd = currentRange.start;

    const result = await this.errorLogAdapter.getSummary(
      previousStart.toISOString(),
      previousEnd.toISOString()
    );

    if (!result.success || !result.data) return 0;

    return result.data
      .filter(item => item.level === 'error' || item.level === 'fatal')
      .reduce((sum, item) => sum + item.count, 0);
  }

  /**
   * Build error patterns from recent errors
   */
  private buildErrorPatterns(errors: StoredErrorLog[]): ErrorPattern[] {
    // Group by message (truncated)
    const patterns = new Map<string, { count: number; source: string; lastSeen: string; endpoints: Set<string> }>();

    for (const err of errors) {
      const key = err.message.slice(0, 100);
      const existing = patterns.get(key) || {
        count: 0,
        source: err.source,
        lastSeen: err.createdAt,
        endpoints: new Set<string>(),
      };

      existing.count++;
      if (err.createdAt > existing.lastSeen) {
        existing.lastSeen = err.createdAt;
      }
      if (err.endpoint) {
        existing.endpoints.add(err.endpoint);
      }

      patterns.set(key, existing);
    }

    // Convert to array and sort by count
    return Array.from(patterns.entries())
      .map(([message, data]) => ({
        message,
        count: data.count,
        source: data.source,
        lastSeen: data.lastSeen,
        affectedEndpoints: Array.from(data.endpoints).slice(0, 5),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Get conversion funnel health
   */
  private async getFunnelHealth(): Promise<FunnelHealthSection> {
    const result = await this.analyticsAdapter.getFunnelSummary();

    if (!result.success || !result.data || result.data.length === 0) {
      return {
        eventViews: 0,
        ticketTierViewRate: 0,
        addToCartRate: 0,
        checkoutStartRate: 0,
        conversionRate: 0,
        cartAbandonmentRate: 0,
        checkoutAbandonmentRate: 0,
        totalRevenueCents: 0,
        avgTimeToPurchaseMs: null,
      };
    }

    // Aggregate across all events
    let totalEventViews = 0;
    let totalTicketTierViews = 0;
    let totalAddToCarts = 0;
    let totalCheckoutStarts = 0;
    let totalCheckoutCompletes = 0;
    let totalCartAbandons = 0;
    let totalCheckoutAbandons = 0;
    let totalRevenue = 0;
    let totalTimeToPurchase = 0;
    let purchaseCount = 0;

    for (const funnel of result.data) {
      totalEventViews += funnel.event_views;
      totalTicketTierViews += funnel.ticket_tier_views;
      totalAddToCarts += funnel.add_to_carts;
      totalCheckoutStarts += funnel.checkout_starts;
      totalCheckoutCompletes += funnel.checkout_completes;
      totalCartAbandons += funnel.cart_abandons;
      totalCheckoutAbandons += funnel.checkout_abandons;
      totalRevenue += funnel.total_revenue_cents || 0;

      if (funnel.avg_time_to_purchase_ms && funnel.checkout_completes > 0) {
        totalTimeToPurchase += funnel.avg_time_to_purchase_ms * funnel.checkout_completes;
        purchaseCount += funnel.checkout_completes;
      }
    }

    const safePercent = (numerator: number, denominator: number) =>
      denominator > 0 ? Math.round((numerator / denominator) * 1000) / 10 : 0;

    return {
      eventViews: totalEventViews,
      ticketTierViewRate: safePercent(totalTicketTierViews, totalEventViews),
      addToCartRate: safePercent(totalAddToCarts, totalEventViews),
      checkoutStartRate: safePercent(totalCheckoutStarts, totalEventViews),
      conversionRate: safePercent(totalCheckoutCompletes, totalEventViews),
      cartAbandonmentRate: safePercent(totalCartAbandons, totalAddToCarts),
      checkoutAbandonmentRate: safePercent(totalCheckoutAbandons, totalCheckoutStarts),
      totalRevenueCents: totalRevenue,
      avgTimeToPurchaseMs: purchaseCount > 0 ? Math.round(totalTimeToPurchase / purchaseCount) : null,
    };
  }

  /**
   * Get configuration status
   */
  private async getConfiguration(): Promise<ConfigurationSection> {
    // Fetch feature flags from database
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: flagsData } = await (supabase as any)
      .from('feature_flags')
      .select('flag_name, is_enabled');

    const featureFlags = Object.entries(FEATURE_FLAGS).map(([, flagKey]) => {
      const dbFlag = flagsData?.find((f: { flag_name: string }) => f.flag_name === flagKey);
      const metadata = FEATURE_FLAG_METADATA[flagKey as keyof typeof FEATURE_FLAG_METADATA];

      return {
        key: flagKey,
        displayName: metadata?.displayName || flagKey,
        enabled: dbFlag?.is_enabled ?? false,
      };
    });

    return {
      featureFlags,
      analyticsConfig: {
        trackingEnabled: DEFAULT_ANALYTICS_CONFIG.enabled,
        webVitalsEnabled: DEFAULT_ANALYTICS_CONFIG.trackWebVitals,
        errorLoggingEnabled: true, // Error logging is always enabled
        sampleRate: DEFAULT_ANALYTICS_CONFIG.sampleRate,
      },
      environment: import.meta.env.MODE || 'production',
    };
  }
}
