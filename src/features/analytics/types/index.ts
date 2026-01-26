/**
 * Analytics Types
 *
 * Type definitions for the page analytics suite including
 * page views, sessions, funnel events, and performance metrics.
 */

// ============================================================
// Enums (matching database enums)
// ============================================================

export type PageSource =
  | 'direct'
  | 'internal'
  | 'external'
  | 'search_engine'
  | 'social'
  | 'email'
  | 'advertisement';

export type FunnelEventType =
  | 'event_view'
  | 'ticket_tier_view'
  | 'add_to_cart'
  | 'checkout_start'
  | 'checkout_complete'
  | 'checkout_abandon'
  | 'cart_abandon';

export type PerformanceMetricType =
  | 'page_load'
  | 'first_contentful_paint'
  | 'largest_contentful_paint'
  | 'first_input_delay'
  | 'interaction_to_next_paint'
  | 'cumulative_layout_shift'
  | 'time_to_first_byte'
  | 'api_response';

export type MetricRating = 'good' | 'needs-improvement' | 'poor';

// ============================================================
// Entry Types (for inserting data)
// ============================================================

export interface SessionEntry {
  sessionId: string;
  userId?: string;
  entryPage?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  userAgent?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  screenWidth?: number;
  screenHeight?: number;
}

export interface PageViewEntry {
  sessionId: string;
  pagePath: string;
  pageTitle?: string;
  pageType?: string;
  resourceId?: string;
  source?: PageSource;
  referrerPage?: string;
  userAgent?: string;
  viewportWidth?: number;
  viewportHeight?: number;
}

export interface FunnelEventEntry {
  sessionId: string;
  eventType: FunnelEventType;
  eventId: string;
  ticketTierId?: string;
  orderId?: string;
  cartId?: string;
  quantity?: number;
  valueCents?: number;
  metadata?: Record<string, unknown>;
}

export interface PerformanceEntry {
  sessionId: string;
  metricType: PerformanceMetricType;
  metricValue: number;
  metricRating?: MetricRating;
  pagePath: string;
  endpoint?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================
// Stored Types (from database)
// ============================================================

export interface StoredSession {
  id: string;
  session_id: string;
  user_id: string | null;
  started_at: string;
  ended_at: string | null;
  total_duration_ms: number | null;
  page_count: number;
  entry_page: string | null;
  exit_page: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  user_agent: string | null;
  ip_address: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  screen_width: number | null;
  screen_height: number | null;
  created_at: string;
  /** Username from profiles table (if user is authenticated) */
  username: string | null;
}

export interface StoredPageView {
  id: string;
  session_ref: string | null;
  session_id: string;
  user_id: string | null;
  page_path: string;
  page_title: string | null;
  page_type: string | null;
  resource_id: string | null;
  viewed_at: string;
  time_on_page_ms: number | null;
  scroll_depth_percent: number | null;
  source: PageSource;
  referrer_page: string | null;
  user_agent: string | null;
  viewport_width: number | null;
  viewport_height: number | null;
  created_at: string;
}

export interface StoredFunnelEvent {
  id: string;
  session_id: string;
  user_id: string | null;
  event_type: FunnelEventType;
  event_id: string;
  ticket_tier_id: string | null;
  order_id: string | null;
  cart_id: string | null;
  occurred_at: string;
  time_since_session_start_ms: number | null;
  time_since_event_view_ms: number | null;
  quantity: number | null;
  value_cents: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface StoredPerformanceMetric {
  id: string;
  session_id: string;
  metric_type: PerformanceMetricType;
  metric_value: number;
  metric_rating: MetricRating | null;
  page_path: string;
  endpoint: string | null;
  recorded_at: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ============================================================
// Configuration
// ============================================================

export interface AnalyticsConfig {
  /** Enable/disable analytics tracking */
  enabled: boolean;
  /** Enable batching for writes */
  batchEnabled: boolean;
  /** Number of items to batch before flushing */
  batchSize: number;
  /** Time in ms to wait before flushing batch */
  batchFlushInterval: number;
  /** Track scroll depth on pages */
  trackScrollDepth: boolean;
  /** Track Web Vitals metrics */
  trackWebVitals: boolean;
  /** Track API response times */
  trackApiTiming: boolean;
  /** Sample rate (0-1) - percentage of sessions to track */
  sampleRate: number;
  /** Paths to exclude from tracking */
  excludedPaths: string[];
  /** User IDs to exclude from tracking (e.g., admin users, developers) */
  excludedUserIds: string[];
  /** Enable console logging in development */
  consoleLogging: boolean;
}

export const DEFAULT_ANALYTICS_CONFIG: AnalyticsConfig = {
  enabled: true,
  batchEnabled: true,
  batchSize: 10,
  batchFlushInterval: 5000,
  trackScrollDepth: true,
  trackWebVitals: true,
  trackApiTiming: true,
  sampleRate: 1.0,
  excludedPaths: [],
  excludedUserIds: [],
  consoleLogging: import.meta.env.DEV,
};

// ============================================================
// Adapter Types
// ============================================================

export interface AdapterResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================
// Dashboard/Summary Types
// ============================================================

export interface DailyPageViewSummary {
  day: string;
  page_type: string | null;
  page_path: string;
  view_count: number;
  unique_sessions: number;
  unique_users: number;
  avg_time_on_page_ms: number | null;
  avg_scroll_depth: number | null;
}

export interface FunnelSummary {
  event_id: string;
  event_views: number;
  ticket_tier_views: number;
  add_to_carts: number;
  checkout_starts: number;
  checkout_completes: number;
  checkout_abandons: number;
  cart_abandons: number;
  total_revenue_cents: number | null;
  avg_time_to_purchase_ms: number | null;
}

export interface PerformanceSummary {
  day: string;
  metric_type: PerformanceMetricType;
  sample_count: number;
  avg_value: number;
  p50_value: number;
  p75_value: number;
  p95_value: number;
  good_count: number;
  needs_improvement_count: number;
  poor_count: number;
}

export interface AnalyticsOverviewData {
  totalPageViews: number;
  totalSessions: number;
  totalUsers: number;
  avgSessionDuration: number;
  avgPagesPerSession: number;
  bounceRate: number;
  topPages: DailyPageViewSummary[];
  recentFunnelData: FunnelSummary[];
  performanceData: PerformanceSummary[];
}

// ============================================================
// Filter Types
// ============================================================

export interface AnalyticsFilters {
  startDate?: Date;
  endDate?: Date;
  pageType?: string;
  pagePath?: string;
  eventId?: string;
  sessionId?: string;
  userId?: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================
// Chart Labels Types
// ============================================================

/**
 * Stored chart label from database
 */
export interface ChartLabel {
  id: string;
  chart_id: string;
  point_id: string;
  label: string;
  marker_color: string | null;
  metadata: Record<string, unknown>;
  created_by: string;
  created_at: string;
  updated_at: string;
}

/**
 * Input for creating/updating a chart label
 */
export interface ChartLabelInput {
  chart_id: string;
  point_id: string;
  label: string;
  marker_color?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Chart label as a key-value map (for FmLineChart compatibility)
 */
export type ChartLabelsMap = Record<string, string>;

// Site Health Report Types
export * from './siteHealth';
