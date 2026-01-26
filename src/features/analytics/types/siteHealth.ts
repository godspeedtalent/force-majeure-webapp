/**
 * Site Health Report Types
 *
 * Type definitions for the AI-optimized site health export feature.
 * These reports are designed to be pasted into Claude for analysis
 * and recommendations on site efficiency, performance, and reliability.
 */

import type { MetricRating } from './index';

// ============================================================
// Main Report Interface
// ============================================================

export interface SiteHealthReport {
  /** ISO timestamp when the report was generated */
  generatedAt: string;
  /** Date range covered by the report */
  dateRange: {
    start: string;
    end: string;
    days: number;
  };
  /** High-level site metrics */
  overview: SiteHealthOverview;
  /** Performance metrics (Web Vitals) */
  performance: PerformanceHealthSection;
  /** Error logging summary */
  errors: ErrorHealthSection;
  /** Conversion funnel health */
  funnel: FunnelHealthSection;
  /** System configuration status */
  configuration: ConfigurationSection;
}

// ============================================================
// Overview Section
// ============================================================

export interface SiteHealthOverview {
  /** Total number of sessions in the period */
  totalSessions: number;
  /** Unique users (by user_id) */
  uniqueUsers: number;
  /** Total page views */
  totalPageViews: number;
  /** Average session duration in milliseconds */
  avgSessionDurationMs: number;
  /** Bounce rate percentage (0-100) */
  bounceRate: number;
  /** Average pages viewed per session */
  avgPagesPerSession: number;
  /** Currently active sessions (last 30 min) */
  activeSessions: number;
}

// ============================================================
// Performance Section
// ============================================================

export interface PerformanceHealthSection {
  /** Web Vitals metrics summary */
  webVitals: WebVitalSummary[];
  /** Overall health rating */
  overallRating: MetricRating;
  /** Pages with slowest load times */
  slowestPages: SlowPageEntry[];
  /** API endpoints with slowest response times */
  slowestEndpoints: SlowEndpointEntry[];
}

export interface WebVitalSummary {
  /** Metric identifier */
  metric: string;
  /** Human-readable name */
  displayName: string;
  /** Unit of measurement */
  unit: string;
  /** 50th percentile value */
  p50: number;
  /** 75th percentile value */
  p75: number;
  /** 95th percentile value */
  p95: number;
  /** Percentage of samples rated "good" */
  goodPercent: number;
  /** Percentage of samples rated "needs improvement" */
  needsImprovementPercent: number;
  /** Percentage of samples rated "poor" */
  poorPercent: number;
  /** Overall rating for this metric */
  rating: MetricRating;
  /** Number of samples */
  sampleCount: number;
}

export interface SlowPageEntry {
  /** Page path */
  pagePath: string;
  /** Average load time in milliseconds */
  avgLoadTimeMs: number;
  /** 95th percentile load time */
  p95LoadTimeMs: number;
  /** Number of samples */
  sampleCount: number;
}

export interface SlowEndpointEntry {
  /** API endpoint path */
  endpoint: string;
  /** Average response time in milliseconds */
  avgResponseTimeMs: number;
  /** 95th percentile response time */
  p95ResponseTimeMs: number;
  /** Error rate percentage (0-100) */
  errorRate: number;
  /** Number of samples */
  sampleCount: number;
}

// ============================================================
// Errors Section
// ============================================================

export interface ErrorHealthSection {
  /** Count of errors by level */
  countByLevel: ErrorCountByLevel;
  /** Total error count */
  totalCount: number;
  /** Top error patterns grouped by message */
  topErrorPatterns: ErrorPattern[];
  /** Most recent critical errors */
  recentCriticalErrors: RecentError[];
  /** Trend compared to previous period */
  trend: 'increasing' | 'stable' | 'decreasing';
  /** Percentage change from previous period */
  trendPercentChange: number;
}

export interface ErrorCountByLevel {
  fatal: number;
  error: number;
  warn: number;
  info: number;
  debug: number;
}

export interface ErrorPattern {
  /** Truncated error message (first 100 chars) */
  message: string;
  /** Number of occurrences */
  count: number;
  /** Error source */
  source: string;
  /** ISO timestamp of last occurrence */
  lastSeen: string;
  /** Affected endpoints (if any) */
  affectedEndpoints: string[];
}

export interface RecentError {
  /** ISO timestamp */
  timestamp: string;
  /** Error level */
  level: string;
  /** Error message */
  message: string;
  /** Error source */
  source: string;
  /** API endpoint (if applicable) */
  endpoint?: string;
  /** HTTP status code (if applicable) */
  statusCode?: number;
}

// ============================================================
// Funnel Section
// ============================================================

export interface FunnelHealthSection {
  /** Total event page views */
  eventViews: number;
  /** Ticket tier view rate (% of event views) */
  ticketTierViewRate: number;
  /** Add to cart rate (% of event views) */
  addToCartRate: number;
  /** Checkout start rate (% of event views) */
  checkoutStartRate: number;
  /** Final conversion rate (% of event views) */
  conversionRate: number;
  /** Cart abandonment rate */
  cartAbandonmentRate: number;
  /** Checkout abandonment rate */
  checkoutAbandonmentRate: number;
  /** Total revenue in cents */
  totalRevenueCents: number;
  /** Average time from event view to purchase (ms) */
  avgTimeToPurchaseMs: number | null;
}

// ============================================================
// Configuration Section
// ============================================================

export interface ConfigurationSection {
  /** Feature flag statuses */
  featureFlags: FeatureFlagStatus[];
  /** Analytics configuration */
  analyticsConfig: AnalyticsConfigStatus;
  /** Current environment */
  environment: string;
}

export interface FeatureFlagStatus {
  /** Flag key */
  key: string;
  /** Human-readable name */
  displayName: string;
  /** Whether the flag is enabled */
  enabled: boolean;
}

export interface AnalyticsConfigStatus {
  /** Whether analytics tracking is enabled */
  trackingEnabled: boolean;
  /** Whether Web Vitals tracking is enabled */
  webVitalsEnabled: boolean;
  /** Whether error logging is enabled */
  errorLoggingEnabled: boolean;
  /** Sample rate (0-1) */
  sampleRate: number;
}
