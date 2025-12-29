/**
 * Supabase Error Log Adapter
 *
 * Implementation of ErrorLogAdapter that persists error logs
 * to the Supabase error_logs table.
 *
 * Uses the log_error() RPC function to insert logs (SECURITY DEFINER),
 * allowing even anonymous users to log errors without direct table access.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import type {
  ErrorLogEntry,
  StoredErrorLog,
  ErrorLogFilters,
  PaginatedErrorLogs,
  ErrorLogSummary,
  ErrorLogLevel,
} from '../types';
import type { AdapterResult, ErrorLogAdapter } from './ErrorLogAdapter';

/**
 * Map from our types to database column names
 */
function entryToDbParams(entry: ErrorLogEntry) {
  return {
    p_level: entry.level,
    p_source: entry.source,
    p_message: entry.message,
    p_error_code: entry.errorCode ?? null,
    p_endpoint: entry.endpoint ?? null,
    p_method: entry.method ?? null,
    p_status_code: entry.statusCode ?? null,
    p_request_id: entry.requestId ?? null,
    p_stack_trace: entry.stackTrace ?? null,
    p_details: entry.details ?? {},
    p_user_id: entry.userId ?? null,
    p_session_id: entry.sessionId ?? null,
    p_user_agent: entry.userAgent ?? null,
    p_ip_address: entry.ipAddress ?? null,
    p_page_url: entry.pageUrl ?? null,
    p_environment: entry.environment ?? 'production',
    p_app_version: entry.appVersion ?? null,
    p_metadata: entry.metadata ?? {},
  };
}

/**
 * Map from database row to our StoredErrorLog type
 */
function dbRowToStoredLog(row: Record<string, unknown>): StoredErrorLog {
  return {
    id: row.id as string,
    createdAt: row.created_at as string,
    level: row.level as ErrorLogLevel,
    source: row.source as ErrorLogEntry['source'],
    message: row.message as string,
    errorCode: row.error_code as string | undefined,
    stackTrace: row.stack_trace as string | undefined,
    details: row.details as Record<string, unknown> | undefined,
    endpoint: row.endpoint as string | undefined,
    method: row.method as string | undefined,
    statusCode: row.status_code as number | undefined,
    requestId: row.request_id as string | undefined,
    userId: row.user_id as string | undefined,
    sessionId: row.session_id as string | undefined,
    userAgent: row.user_agent as string | undefined,
    ipAddress: row.ip_address as string | undefined,
    pageUrl: row.page_url as string | undefined,
    environment: row.environment as 'development' | 'staging' | 'production' | undefined,
    appVersion: row.app_version as string | undefined,
    metadata: row.metadata as Record<string, unknown> | undefined,
  };
}

export class SupabaseErrorLogAdapter implements ErrorLogAdapter {
  readonly name = 'supabase';

  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Helper to get the error_logs table with type casting
   * (Table may not be in generated types yet)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private get table() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.supabase as any).from('error_logs');
  }

  async write(entry: ErrorLogEntry): Promise<AdapterResult<string>> {
    try {
      const params = entryToDbParams(entry);

      // Use the log_error RPC function (SECURITY DEFINER)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (this.supabase as any).rpc('log_error', params);

      if (error) {
        return {
          success: false,
          error: `Failed to log error: ${error.message}`,
        };
      }

      return { success: true, data: data as string };
    } catch (err) {
      return {
        success: false,
        error: `Exception logging error: ${err instanceof Error ? err.message : 'Unknown'}`,
      };
    }
  }

  async writeBatch(entries: ErrorLogEntry[]): Promise<AdapterResult<string[]>> {
    // Supabase doesn't have a batch RPC call, so we'll use Promise.allSettled
    const results = await Promise.allSettled(
      entries.map(entry => this.write(entry))
    );

    const ids: string[] = [];
    const errors: string[] = [];

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.success && result.value.data) {
        ids.push(result.value.data);
      } else if (result.status === 'rejected') {
        errors.push(result.reason?.message ?? 'Unknown error');
      } else if (result.status === 'fulfilled' && !result.value.success) {
        errors.push(result.value.error ?? 'Unknown error');
      }
    }

    if (errors.length > 0 && ids.length === 0) {
      return {
        success: false,
        error: `All batch writes failed: ${errors.join(', ')}`,
      };
    }

    return {
      success: true,
      data: ids,
      error: errors.length > 0 ? `Some writes failed: ${errors.length}` : undefined,
    };
  }

  async query(
    filters: ErrorLogFilters,
    page = 1,
    pageSize = 50
  ): Promise<AdapterResult<PaginatedErrorLogs>> {
    try {
      let query = this.table.select('*', { count: 'exact' });

      // Apply filters
      if (filters.levels && filters.levels.length > 0) {
        query = query.in('level', filters.levels);
      }

      if (filters.sources && filters.sources.length > 0) {
        query = query.in('source', filters.sources);
      }

      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters.errorCode) {
        query = query.eq('error_code', filters.errorCode);
      }

      if (filters.endpoint) {
        query = query.ilike('endpoint', `%${filters.endpoint}%`);
      }

      if (filters.environment) {
        query = query.eq('environment', filters.environment);
      }

      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      if (filters.search) {
        query = query.or(
          `message.ilike.%${filters.search}%,error_code.ilike.%${filters.search}%`
        );
      }

      // Order by newest first
      query = query.order('created_at', { ascending: false });

      // Pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        return {
          success: false,
          error: `Query failed: ${error.message}`,
        };
      }

      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / pageSize);

      return {
        success: true,
        data: {
          data: (data || []).map(dbRowToStoredLog),
          page,
          pageSize,
          totalCount,
          totalPages,
        },
      };
    } catch (err) {
      return {
        success: false,
        error: `Exception querying logs: ${err instanceof Error ? err.message : 'Unknown'}`,
      };
    }
  }

  async getById(id: string): Promise<AdapterResult<StoredErrorLog | null>> {
    try {
      const { data, error } = await this.table
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { success: true, data: null };
        }
        return {
          success: false,
          error: `Failed to fetch log: ${error.message}`,
        };
      }

      return { success: true, data: dbRowToStoredLog(data) };
    } catch (err) {
      return {
        success: false,
        error: `Exception fetching log: ${err instanceof Error ? err.message : 'Unknown'}`,
      };
    }
  }

  async getSummary(
    dateFrom?: string,
    dateTo?: string
  ): Promise<AdapterResult<ErrorLogSummary[]>> {
    try {
      let query = this.table.select('level');

      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }

      if (dateTo) {
        query = query.lte('created_at', dateTo);
      }

      const { data, error } = await query;

      if (error) {
        return {
          success: false,
          error: `Failed to fetch summary: ${error.message}`,
        };
      }

      // Count by level
      const levelCounts = (data || []).reduce(
        (acc: Record<string, number>, item: { level: string }) => {
          acc[item.level] = (acc[item.level] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const summary: ErrorLogSummary[] = Object.entries(levelCounts).map(
        ([level, count]) => ({
          level: level as ErrorLogLevel,
          count: count as number,
        })
      );

      return { success: true, data: summary };
    } catch (err) {
      return {
        success: false,
        error: `Exception fetching summary: ${err instanceof Error ? err.message : 'Unknown'}`,
      };
    }
  }

  async deleteOlderThan(date: Date): Promise<AdapterResult<number>> {
    try {
      const isoDate = date.toISOString();

      const { data, error } = await this.table
        .delete()
        .lt('created_at', isoDate)
        .select('id');

      if (error) {
        return {
          success: false,
          error: `Failed to delete logs: ${error.message}`,
        };
      }

      return { success: true, data: data?.length || 0 };
    } catch (err) {
      return {
        success: false,
        error: `Exception deleting logs: ${err instanceof Error ? err.message : 'Unknown'}`,
      };
    }
  }

  async healthCheck(): Promise<AdapterResult<boolean>> {
    try {
      // Try to select a single row to verify connection
      const { error } = await this.table.select('id').limit(1);

      if (error) {
        // If it's a permissions error, the table exists but user can't read
        // This is expected for non-admin users
        if (error.code === 'PGRST301' || error.message.includes('permission')) {
          // Try using the RPC function instead
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: rpcError } = await (this.supabase as any).rpc('log_error', {
            p_level: 'debug',
            p_source: 'client',
            p_message: 'Health check',
            p_metadata: { healthCheck: true },
          });

          return {
            success: !rpcError,
            data: !rpcError,
            error: rpcError?.message,
          };
        }

        return {
          success: false,
          data: false,
          error: error.message,
        };
      }

      return { success: true, data: true };
    } catch (err) {
      return {
        success: false,
        data: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }
}
