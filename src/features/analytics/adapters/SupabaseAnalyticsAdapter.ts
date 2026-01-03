/**
 * Supabase Analytics Adapter
 *
 * Implements the AnalyticsAdapter interface using Supabase
 * as the storage backend.
 *
 * NOTE: This adapter uses type assertions (as any) for database operations
 * because the analytics tables are created by a migration that hasn't been
 * run yet. Once the migration runs and `supabase gen types` is executed,
 * these can be updated to use proper typing.
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/shared/services/logger';
import type { AnalyticsAdapter } from './AnalyticsAdapter';
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

const analyticsLogger = logger.ns('SupabaseAnalyticsAdapter');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

export class SupabaseAnalyticsAdapter implements AnalyticsAdapter {
  // ============================================================
  // Write Methods
  // ============================================================

  async initSession(entry: SessionEntry): Promise<AdapterResult<string>> {
    try {
      const { data, error } = await (supabase as AnySupabase).rpc('init_analytics_session', {
        p_session_id: entry.sessionId,
        p_entry_page: entry.entryPage || null,
        p_referrer: entry.referrer || null,
        p_utm_source: entry.utmSource || null,
        p_utm_medium: entry.utmMedium || null,
        p_utm_campaign: entry.utmCampaign || null,
        p_utm_term: entry.utmTerm || null,
        p_utm_content: entry.utmContent || null,
        p_user_agent: entry.userAgent || null,
        p_device_type: entry.deviceType || null,
        p_browser: entry.browser || null,
        p_os: entry.os || null,
        p_screen_width: entry.screenWidth || null,
        p_screen_height: entry.screenHeight || null,
      });

      if (error) {
        analyticsLogger.error('Failed to init session', { error: error.message });
        return { success: false, error: error.message };
      }

      return { success: true, data: data as string };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      analyticsLogger.error('Exception in initSession', { error: message });
      return { success: false, error: message };
    }
  }

  async writePageView(entry: PageViewEntry & { timeOnPageMs?: number; scrollDepthPercent?: number }): Promise<AdapterResult<string>> {
    try {
      const { data, error } = await (supabase as AnySupabase).rpc('record_page_view', {
        p_session_id: entry.sessionId,
        p_page_path: entry.pagePath,
        p_page_title: entry.pageTitle || null,
        p_page_type: entry.pageType || null,
        p_resource_id: entry.resourceId || null,
        p_source: entry.source || 'internal',
        p_referrer_page: entry.referrerPage || null,
        p_user_agent: entry.userAgent || null,
        p_viewport_width: entry.viewportWidth || null,
        p_viewport_height: entry.viewportHeight || null,
      });

      if (error) {
        analyticsLogger.error('Failed to record page view', { error: error.message });
        return { success: false, error: error.message };
      }

      const viewId = data as string;

      // If time/scroll data was provided (from batched entry), update immediately after insert
      if (viewId && (entry.timeOnPageMs !== undefined || entry.scrollDepthPercent !== undefined)) {
        await this.updatePageViewDuration(
          viewId,
          entry.timeOnPageMs || 0,
          entry.scrollDepthPercent
        );
      }

      return { success: true, data: viewId };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      analyticsLogger.error('Exception in writePageView', { error: message });
      return { success: false, error: message };
    }
  }

  async writePageViewBatch(entries: PageViewEntry[]): Promise<AdapterResult<string[]>> {
    const results = await Promise.allSettled(entries.map(entry => this.writePageView(entry)));

    const ids: string[] = [];
    const errors: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.success && result.value.data) {
        ids.push(result.value.data);
      } else {
        const errorMsg =
          result.status === 'rejected'
            ? result.reason
            : result.value.error || 'Unknown error';
        errors.push(`Entry ${index}: ${errorMsg}`);
      }
    });

    if (errors.length > 0) {
      analyticsLogger.warn('Some page views failed to write', { errors });
    }

    return { success: true, data: ids };
  }

  async updatePageViewDuration(
    viewId: string,
    timeOnPageMs: number,
    scrollDepthPercent?: number
  ): Promise<AdapterResult> {
    try {
      const { error } = await (supabase as AnySupabase).rpc('update_page_view_duration', {
        p_view_id: viewId,
        p_time_on_page_ms: timeOnPageMs,
        p_scroll_depth_percent: scrollDepthPercent ?? null,
      });

      if (error) {
        analyticsLogger.error('Failed to update page view duration', { error: error.message });
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      analyticsLogger.error('Exception in updatePageViewDuration', { error: message });
      return { success: false, error: message };
    }
  }

  async writeFunnelEvent(entry: FunnelEventEntry): Promise<AdapterResult<string>> {
    try {
      const { data, error } = await (supabase as AnySupabase).rpc('record_funnel_event', {
        p_session_id: entry.sessionId,
        p_event_type: entry.eventType,
        p_event_id: entry.eventId,
        p_ticket_tier_id: entry.ticketTierId || null,
        p_order_id: entry.orderId || null,
        p_cart_id: entry.cartId || null,
        p_quantity: entry.quantity || null,
        p_value_cents: entry.valueCents || null,
        p_metadata: entry.metadata || {},
      });

      if (error) {
        analyticsLogger.error('Failed to record funnel event', { error: error.message });
        return { success: false, error: error.message };
      }

      return { success: true, data: data as string };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      analyticsLogger.error('Exception in writeFunnelEvent', { error: message });
      return { success: false, error: message };
    }
  }

  async writeFunnelEventBatch(entries: FunnelEventEntry[]): Promise<AdapterResult<string[]>> {
    const results = await Promise.allSettled(entries.map(entry => this.writeFunnelEvent(entry)));

    const ids: string[] = [];
    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value.success && result.value.data) {
        ids.push(result.value.data);
      }
    });

    return { success: true, data: ids };
  }

  async writePerformanceMetric(entry: PerformanceEntry): Promise<AdapterResult<string>> {
    try {
      const { data, error } = await (supabase as AnySupabase).rpc('record_performance_metric', {
        p_session_id: entry.sessionId,
        p_metric_type: entry.metricType,
        p_metric_value: entry.metricValue,
        p_page_path: entry.pagePath,
        p_metric_rating: entry.metricRating || null,
        p_endpoint: entry.endpoint || null,
        p_metadata: entry.metadata || {},
      });

      if (error) {
        analyticsLogger.error('Failed to record performance metric', { error: error.message });
        return { success: false, error: error.message };
      }

      return { success: true, data: data as string };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      analyticsLogger.error('Exception in writePerformanceMetric', { error: message });
      return { success: false, error: message };
    }
  }

  async writePerformanceBatch(entries: PerformanceEntry[]): Promise<AdapterResult<string[]>> {
    const results = await Promise.allSettled(
      entries.map(entry => this.writePerformanceMetric(entry))
    );

    const ids: string[] = [];
    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value.success && result.value.data) {
        ids.push(result.value.data);
      }
    });

    return { success: true, data: ids };
  }

  async endSession(sessionId: string): Promise<AdapterResult> {
    try {
      const { error } = await (supabase as AnySupabase).rpc('end_analytics_session', {
        p_session_id: sessionId,
      });

      if (error) {
        analyticsLogger.error('Failed to end session', { error: error.message });
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      analyticsLogger.error('Exception in endSession', { error: message });
      return { success: false, error: message };
    }
  }

  // ============================================================
  // Read Methods
  // ============================================================

  async getPageViews(
    filters?: AnalyticsFilters,
    pagination: PaginationParams = { page: 1, pageSize: 50 }
  ): Promise<AdapterResult<PaginatedResult<StoredPageView>>> {
    try {
      let query = (supabase as AnySupabase)
        .from('analytics_page_views')
        .select('*', { count: 'exact' })
        .order('viewed_at', { ascending: false });

      if (filters?.startDate) {
        query = query.gte('viewed_at', filters.startDate.toISOString());
      }
      if (filters?.endDate) {
        query = query.lte('viewed_at', filters.endDate.toISOString());
      }
      if (filters?.pageType) {
        query = query.eq('page_type', filters.pageType);
      }
      if (filters?.pagePath) {
        query = query.ilike('page_path', `%${filters.pagePath}%`);
      }
      if (filters?.sessionId) {
        query = query.eq('session_id', filters.sessionId);
      }
      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }

      const offset = (pagination.page - 1) * pagination.pageSize;
      query = query.range(offset, offset + pagination.pageSize - 1);

      const { data, error, count } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: {
          data: (data || []) as StoredPageView[],
          total: count || 0,
          page: pagination.page,
          pageSize: pagination.pageSize,
          totalPages: Math.ceil((count || 0) / pagination.pageSize),
        },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: message };
    }
  }

  async getFunnelEvents(
    filters?: AnalyticsFilters,
    pagination: PaginationParams = { page: 1, pageSize: 50 }
  ): Promise<AdapterResult<PaginatedResult<StoredFunnelEvent>>> {
    try {
      let query = (supabase as AnySupabase)
        .from('analytics_funnel_events')
        .select('*', { count: 'exact' })
        .order('occurred_at', { ascending: false });

      if (filters?.startDate) {
        query = query.gte('occurred_at', filters.startDate.toISOString());
      }
      if (filters?.endDate) {
        query = query.lte('occurred_at', filters.endDate.toISOString());
      }
      if (filters?.eventId) {
        query = query.eq('event_id', filters.eventId);
      }
      if (filters?.sessionId) {
        query = query.eq('session_id', filters.sessionId);
      }

      const offset = (pagination.page - 1) * pagination.pageSize;
      query = query.range(offset, offset + pagination.pageSize - 1);

      const { data, error, count } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: {
          data: (data || []) as StoredFunnelEvent[],
          total: count || 0,
          page: pagination.page,
          pageSize: pagination.pageSize,
          totalPages: Math.ceil((count || 0) / pagination.pageSize),
        },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: message };
    }
  }

  async getSessions(
    filters?: AnalyticsFilters,
    pagination: PaginationParams = { page: 1, pageSize: 50 }
  ): Promise<AdapterResult<PaginatedResult<StoredSession>>> {
    try {
      let query = (supabase as AnySupabase)
        .from('analytics_sessions')
        .select('*', { count: 'exact' })
        .order('started_at', { ascending: false });

      if (filters?.startDate) {
        query = query.gte('started_at', filters.startDate.toISOString());
      }
      if (filters?.endDate) {
        query = query.lte('started_at', filters.endDate.toISOString());
      }
      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }

      const offset = (pagination.page - 1) * pagination.pageSize;
      query = query.range(offset, offset + pagination.pageSize - 1);

      const { data, error, count } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: {
          data: (data || []) as StoredSession[],
          total: count || 0,
          page: pagination.page,
          pageSize: pagination.pageSize,
          totalPages: Math.ceil((count || 0) / pagination.pageSize),
        },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: message };
    }
  }

  async getPerformanceMetrics(
    filters?: AnalyticsFilters,
    pagination: PaginationParams = { page: 1, pageSize: 50 }
  ): Promise<AdapterResult<PaginatedResult<StoredPerformanceMetric>>> {
    try {
      let query = (supabase as AnySupabase)
        .from('analytics_performance')
        .select('*', { count: 'exact' })
        .order('recorded_at', { ascending: false });

      if (filters?.startDate) {
        query = query.gte('recorded_at', filters.startDate.toISOString());
      }
      if (filters?.endDate) {
        query = query.lte('recorded_at', filters.endDate.toISOString());
      }
      if (filters?.pagePath) {
        query = query.ilike('page_path', `%${filters.pagePath}%`);
      }

      const offset = (pagination.page - 1) * pagination.pageSize;
      query = query.range(offset, offset + pagination.pageSize - 1);

      const { data, error, count } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: {
          data: (data || []) as StoredPerformanceMetric[],
          total: count || 0,
          page: pagination.page,
          pageSize: pagination.pageSize,
          totalPages: Math.ceil((count || 0) / pagination.pageSize),
        },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: message };
    }
  }

  // ============================================================
  // Summary Methods
  // ============================================================

  async getDailyPageViews(
    startDate: Date,
    endDate: Date
  ): Promise<AdapterResult<DailyPageViewSummary[]>> {
    try {
      const { data, error } = await (supabase as AnySupabase)
        .from('analytics_daily_page_views')
        .select('*')
        .gte('day', startDate.toISOString())
        .lte('day', endDate.toISOString())
        .order('day', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: (data || []) as DailyPageViewSummary[] };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: message };
    }
  }

  async getFunnelSummary(eventId?: string): Promise<AdapterResult<FunnelSummary[]>> {
    try {
      let query = (supabase as AnySupabase).from('analytics_funnel_summary').select('*');

      if (eventId) {
        query = query.eq('event_id', eventId);
      }

      const { data, error } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: (data || []) as FunnelSummary[] };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: message };
    }
  }

  async getPerformanceSummary(
    startDate: Date,
    endDate: Date
  ): Promise<AdapterResult<PerformanceSummary[]>> {
    try {
      const { data, error } = await (supabase as AnySupabase)
        .from('analytics_performance_summary')
        .select('*')
        .gte('day', startDate.toISOString())
        .lte('day', endDate.toISOString())
        .order('day', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: (data || []) as PerformanceSummary[] };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: message };
    }
  }

  async getActiveSessionsCount(): Promise<AdapterResult<number>> {
    try {
      // Consider a session "active" if it started within the last 30 minutes
      // and hasn't ended yet (ended_at is null)
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

      const { count, error } = await (supabase as AnySupabase)
        .from('analytics_sessions')
        .select('*', { count: 'exact', head: true })
        .gte('started_at', thirtyMinutesAgo.toISOString())
        .is('ended_at', null);

      if (error) {
        analyticsLogger.error('Failed to get active sessions count', { error: error.message });
        return { success: false, error: error.message };
      }

      return { success: true, data: count || 0 };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      analyticsLogger.error('Exception in getActiveSessionsCount', { error: message });
      return { success: false, error: message };
    }
  }

  async getOverviewStats(
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
      activeSessions: number;
    }>
  > {
    try {
      // Get page view count
      const { count: pageViewCount } = await (supabase as AnySupabase)
        .from('analytics_page_views')
        .select('*', { count: 'exact', head: true })
        .gte('viewed_at', startDate.toISOString())
        .lte('viewed_at', endDate.toISOString());

      // Get session stats
      const { data: sessionData } = await (supabase as AnySupabase)
        .from('analytics_sessions')
        .select('id, user_id, total_duration_ms, page_count, started_at')
        .gte('started_at', startDate.toISOString())
        .lte('started_at', endDate.toISOString());

      interface SessionRow {
        id: string;
        user_id: string | null;
        total_duration_ms: number | null;
        page_count: number;
        started_at: string;
      }

      const sessions: SessionRow[] = sessionData || [];
      const totalSessions = sessions.length;
      const uniqueUsers = new Set(sessions.map(s => s.user_id).filter(Boolean)).size;

      // Calculate averages
      const sessionsWithDuration = sessions.filter(s => s.total_duration_ms != null);
      const avgDuration =
        sessionsWithDuration.length > 0
          ? sessionsWithDuration.reduce((sum, s) => sum + (s.total_duration_ms || 0), 0) /
            sessionsWithDuration.length
          : 0;

      const avgPages =
        totalSessions > 0
          ? sessions.reduce((sum, s) => sum + (s.page_count || 0), 0) / totalSessions
          : 0;

      // Bounce rate = sessions with only 1 page view
      const bounceSessions = sessions.filter(s => s.page_count === 1).length;
      const bounceRate = totalSessions > 0 ? (bounceSessions / totalSessions) * 100 : 0;

      // Active sessions = sessions that started in the last 30 minutes
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      const activeSessions = sessions.filter(
        s => new Date(s.started_at) >= thirtyMinutesAgo
      ).length;

      return {
        success: true,
        data: {
          totalPageViews: pageViewCount || 0,
          totalSessions,
          totalUsers: uniqueUsers,
          avgSessionDuration: Math.round(avgDuration),
          avgPagesPerSession: Math.round(avgPages * 100) / 100,
          bounceRate: Math.round(bounceRate * 100) / 100,
          activeSessions,
        },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: message };
    }
  }
}
