/**
 * Analytics Adapter Interface
 *
 * Defines the contract for analytics storage backends.
 * Follows the adapter pattern used by ErrorLoggingService.
 */

import { logger } from '@/shared/services/logger';

import type {
  AdapterResult,
  PageViewEntry,
  FunnelEventEntry,
  PerformanceEntry,
  SessionEntry,
  StoredPageView,
  StoredFunnelEvent,
  StoredPerformanceMetric,
  StoredSession,
  DailyPageViewSummary,
  FunnelSummary,
  PerformanceSummary,
  AnalyticsFilters,
  PaginatedResult,
  PaginationParams,
} from '../types';

/**
 * Analytics adapter interface for swappable backends
 */
export interface AnalyticsAdapter {
  // ============================================================
  // Write Methods
  // ============================================================

  /** Initialize or update a session */
  initSession(entry: SessionEntry): Promise<AdapterResult<string>>;

  /** Record a page view, returns the view ID */
  writePageView(entry: PageViewEntry): Promise<AdapterResult<string>>;

  /** Record multiple page views in batch */
  writePageViewBatch(entries: PageViewEntry[]): Promise<AdapterResult<string[]>>;

  /** Update page view with duration and scroll depth */
  updatePageViewDuration(
    viewId: string,
    timeOnPageMs: number,
    scrollDepthPercent?: number
  ): Promise<AdapterResult>;

  /** Record a funnel event */
  writeFunnelEvent(entry: FunnelEventEntry): Promise<AdapterResult<string>>;

  /** Record multiple funnel events in batch */
  writeFunnelEventBatch(entries: FunnelEventEntry[]): Promise<AdapterResult<string[]>>;

  /** Record a performance metric */
  writePerformanceMetric(entry: PerformanceEntry): Promise<AdapterResult<string>>;

  /** Record multiple performance metrics in batch */
  writePerformanceBatch(entries: PerformanceEntry[]): Promise<AdapterResult<string[]>>;

  /** End a session */
  endSession(sessionId: string): Promise<AdapterResult>;

  // ============================================================
  // Read Methods (for admin dashboard)
  // ============================================================

  /** Get paginated page views */
  getPageViews(
    filters?: AnalyticsFilters,
    pagination?: PaginationParams
  ): Promise<AdapterResult<PaginatedResult<StoredPageView>>>;

  /** Get paginated funnel events */
  getFunnelEvents(
    filters?: AnalyticsFilters,
    pagination?: PaginationParams
  ): Promise<AdapterResult<PaginatedResult<StoredFunnelEvent>>>;

  /** Get paginated sessions */
  getSessions(
    filters?: AnalyticsFilters,
    pagination?: PaginationParams
  ): Promise<AdapterResult<PaginatedResult<StoredSession>>>;

  /** Get performance metrics */
  getPerformanceMetrics(
    filters?: AnalyticsFilters,
    pagination?: PaginationParams
  ): Promise<AdapterResult<PaginatedResult<StoredPerformanceMetric>>>;

  // ============================================================
  // Summary/Aggregate Methods
  // ============================================================

  /** Get daily page view summary */
  getDailyPageViews(
    startDate: Date,
    endDate: Date
  ): Promise<AdapterResult<DailyPageViewSummary[]>>;

  /** Get funnel summary by event */
  getFunnelSummary(eventId?: string): Promise<AdapterResult<FunnelSummary[]>>;

  /** Get performance summary */
  getPerformanceSummary(
    startDate: Date,
    endDate: Date
  ): Promise<AdapterResult<PerformanceSummary[]>>;

  /** Get overview statistics */
  getOverviewStats(
    startDate: Date,
    endDate: Date
  ): Promise<
    AdapterResult<{
      totalPageViews: number;
      totalSessions: number;
      totalUsers: number;
      avgSessionDuration: number;
      avgPagesPerSession: number;
      bounceRate: number;
    }>
  >;
}

/**
 * Console adapter for development/testing
 * Uses the centralized logger to respect debug access controls
 * Logs will only appear for admin/developer users or in local dev mode
 */
const analyticsLogger = logger.createNamespace('Analytics');

export class ConsoleAnalyticsAdapter implements AnalyticsAdapter {
  async initSession(entry: SessionEntry): Promise<AdapterResult<string>> {
    analyticsLogger.debug('Init session', { sessionId: entry.sessionId });
    return { success: true, data: entry.sessionId };
  }

  async writePageView(entry: PageViewEntry): Promise<AdapterResult<string>> {
    analyticsLogger.debug('Page view', { pagePath: entry.pagePath, pageTitle: entry.pageTitle });
    return { success: true, data: crypto.randomUUID() };
  }

  async writePageViewBatch(entries: PageViewEntry[]): Promise<AdapterResult<string[]>> {
    analyticsLogger.debug('Page view batch', { count: entries.length });
    return { success: true, data: entries.map(() => crypto.randomUUID()) };
  }

  async updatePageViewDuration(
    viewId: string,
    timeOnPageMs: number,
    scrollDepthPercent?: number
  ): Promise<AdapterResult> {
    analyticsLogger.debug('Update duration', { viewId, timeOnPageMs, scrollDepthPercent });
    return { success: true };
  }

  async writeFunnelEvent(entry: FunnelEventEntry): Promise<AdapterResult<string>> {
    analyticsLogger.debug('Funnel event', { eventType: entry.eventType, eventId: entry.eventId });
    return { success: true, data: crypto.randomUUID() };
  }

  async writeFunnelEventBatch(entries: FunnelEventEntry[]): Promise<AdapterResult<string[]>> {
    analyticsLogger.debug('Funnel batch', { count: entries.length });
    return { success: true, data: entries.map(() => crypto.randomUUID()) };
  }

  async writePerformanceMetric(entry: PerformanceEntry): Promise<AdapterResult<string>> {
    analyticsLogger.debug('Performance', { metricType: entry.metricType, metricValue: entry.metricValue });
    return { success: true, data: crypto.randomUUID() };
  }

  async writePerformanceBatch(entries: PerformanceEntry[]): Promise<AdapterResult<string[]>> {
    analyticsLogger.debug('Performance batch', { count: entries.length });
    return { success: true, data: entries.map(() => crypto.randomUUID()) };
  }

  async endSession(sessionId: string): Promise<AdapterResult> {
    analyticsLogger.debug('End session', { sessionId });
    return { success: true };
  }

  async getPageViews(): Promise<AdapterResult<PaginatedResult<StoredPageView>>> {
    return { success: true, data: { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 } };
  }

  async getFunnelEvents(): Promise<AdapterResult<PaginatedResult<StoredFunnelEvent>>> {
    return { success: true, data: { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 } };
  }

  async getSessions(): Promise<AdapterResult<PaginatedResult<StoredSession>>> {
    return { success: true, data: { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 } };
  }

  async getPerformanceMetrics(): Promise<AdapterResult<PaginatedResult<StoredPerformanceMetric>>> {
    return { success: true, data: { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 } };
  }

  async getDailyPageViews(): Promise<AdapterResult<DailyPageViewSummary[]>> {
    return { success: true, data: [] };
  }

  async getFunnelSummary(): Promise<AdapterResult<FunnelSummary[]>> {
    return { success: true, data: [] };
  }

  async getPerformanceSummary(): Promise<AdapterResult<PerformanceSummary[]>> {
    return { success: true, data: [] };
  }

  async getOverviewStats(): Promise<
    AdapterResult<{
      totalPageViews: number;
      totalSessions: number;
      totalUsers: number;
      avgSessionDuration: number;
      avgPagesPerSession: number;
      bounceRate: number;
    }>
  > {
    return {
      success: true,
      data: {
        totalPageViews: 0,
        totalSessions: 0,
        totalUsers: 0,
        avgSessionDuration: 0,
        avgPagesPerSession: 0,
        bounceRate: 0,
      },
    };
  }
}
