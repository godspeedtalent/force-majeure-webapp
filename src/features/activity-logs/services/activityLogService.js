/**
 * Activity Log Service
 *
 * Service layer for fetching and managing activity logs.
 * Provides methods for querying logs with filtering, pagination, and export.
 */
import { supabase } from '@/shared';
import { logger } from '@/shared';
const LOG_SOURCE = 'activityLogService';
// Helper for untyped tables (activity_logs not yet in generated types)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getActivityLogsTable = () => supabase.from('activity_logs');
/**
 * Fetch paginated activity logs with optional filters
 */
export async function getActivityLogs(filters = {}, page = 1, pageSize = 50) {
    try {
        let query = getActivityLogsTable()
            .select(`
        *,
        user:profiles!activity_logs_user_id_fkey(
          email,
          display_name,
          avatar_url
        )
      `, { count: 'exact' })
            .order('timestamp', { ascending: false });
        // Apply filters
        if (filters.categories && filters.categories.length > 0) {
            query = query.in('category', filters.categories);
        }
        if (filters.eventTypes && filters.eventTypes.length > 0) {
            query = query.in('event_type', filters.eventTypes);
        }
        if (filters.userId) {
            query = query.eq('user_id', filters.userId);
        }
        if (filters.targetResourceType) {
            query = query.eq('target_resource_type', filters.targetResourceType);
        }
        if (filters.targetResourceId) {
            query = query.eq('target_resource_id', filters.targetResourceId);
        }
        if (filters.dateFrom) {
            query = query.gte('timestamp', filters.dateFrom);
        }
        if (filters.dateTo) {
            query = query.lte('timestamp', filters.dateTo);
        }
        if (filters.search) {
            query = query.or(`description.ilike.%${filters.search}%,target_resource_name.ilike.%${filters.search}%`);
        }
        // Apply pagination
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);
        const { data, error, count } = await query;
        if (error) {
            logger.error('Failed to fetch activity logs', {
                source: LOG_SOURCE,
                error: error.message,
                filters,
            });
            throw error;
        }
        const totalCount = count || 0;
        const totalPages = Math.ceil(totalCount / pageSize);
        return {
            data: data || [],
            page,
            pageSize,
            totalCount,
            totalPages,
        };
    }
    catch (err) {
        logger.error('Error in getActivityLogs', {
            source: LOG_SOURCE,
            error: err instanceof Error ? err.message : 'Unknown error',
        });
        throw err;
    }
}
/**
 * Get activity log summary counts by category
 */
export async function getActivitySummary(dateFrom, dateTo) {
    try {
        // Use a raw query to get counts grouped by category
        let query = getActivityLogsTable().select('category');
        if (dateFrom) {
            query = query.gte('timestamp', dateFrom);
        }
        if (dateTo) {
            query = query.lte('timestamp', dateTo);
        }
        const { data, error } = await query;
        if (error) {
            logger.error('Failed to fetch activity summary', {
                source: LOG_SOURCE,
                error: error.message,
            });
            throw error;
        }
        // Count occurrences of each category
        const categoryCounts = (data || []).reduce((acc, item) => {
            const category = item.category;
            acc[category] = (acc[category] || 0) + 1;
            return acc;
        }, {});
        // Convert to array format
        return Object.entries(categoryCounts).map(([category, count]) => ({
            category: category,
            count: count,
        }));
    }
    catch (err) {
        logger.error('Error in getActivitySummary', {
            source: LOG_SOURCE,
            error: err instanceof Error ? err.message : 'Unknown error',
        });
        throw err;
    }
}
/**
 * Export activity logs to a specified format
 */
export async function exportActivityLogs(filters = {}, format = 'json') {
    try {
        // Fetch all logs matching filters (no pagination for export)
        let query = getActivityLogsTable()
            .select('*')
            .order('timestamp', { ascending: false });
        // Apply filters (same as getActivityLogs)
        if (filters.categories && filters.categories.length > 0) {
            query = query.in('category', filters.categories);
        }
        if (filters.eventTypes && filters.eventTypes.length > 0) {
            query = query.in('event_type', filters.eventTypes);
        }
        if (filters.userId) {
            query = query.eq('user_id', filters.userId);
        }
        if (filters.dateFrom) {
            query = query.gte('timestamp', filters.dateFrom);
        }
        if (filters.dateTo) {
            query = query.lte('timestamp', filters.dateTo);
        }
        if (filters.search) {
            query = query.or(`description.ilike.%${filters.search}%,target_resource_name.ilike.%${filters.search}%`);
        }
        // Limit to 10000 records for export
        query = query.limit(10000);
        const { data, error } = await query;
        if (error) {
            logger.error('Failed to export activity logs', {
                source: LOG_SOURCE,
                error: error.message,
            });
            throw error;
        }
        if (format === 'json') {
            return new Blob([JSON.stringify(data, null, 2)], {
                type: 'application/json',
            });
        }
        // CSV format
        const headers = [
            'timestamp',
            'event_type',
            'category',
            'description',
            'user_id',
            'target_resource_type',
            'target_resource_id',
            'target_resource_name',
            'ip_address',
        ];
        const csvRows = [
            headers.join(','),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...(data || []).map((log) => headers
                .map(header => {
                const value = log[header];
                // Escape commas and quotes in values
                if (typeof value === 'string') {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value ?? '';
            })
                .join(',')),
        ];
        return new Blob([csvRows.join('\n')], { type: 'text/csv' });
    }
    catch (err) {
        logger.error('Error in exportActivityLogs', {
            source: LOG_SOURCE,
            error: err instanceof Error ? err.message : 'Unknown error',
        });
        throw err;
    }
}
/**
 * Get a single activity log by ID
 */
export async function getActivityLogById(id) {
    try {
        const { data, error } = await getActivityLogsTable()
            .select(`
        *,
        user:profiles!activity_logs_user_id_fkey(
          email,
          display_name,
          avatar_url
        )
      `)
            .eq('id', id)
            .single();
        if (error) {
            if (error.code === 'PGRST116') {
                return null; // Not found
            }
            logger.error('Failed to fetch activity log', {
                source: LOG_SOURCE,
                error: error.message,
                id,
            });
            throw error;
        }
        return data;
    }
    catch (err) {
        logger.error('Error in getActivityLogById', {
            source: LOG_SOURCE,
            error: err instanceof Error ? err.message : 'Unknown error',
        });
        throw err;
    }
}
/**
 * Get recent activity for a specific resource
 */
export async function getResourceActivity(resourceType, resourceId, limit = 10) {
    try {
        const { data, error } = await getActivityLogsTable()
            .select(`
        *,
        user:profiles!activity_logs_user_id_fkey(
          email,
          display_name,
          avatar_url
        )
      `)
            .eq('target_resource_type', resourceType)
            .eq('target_resource_id', resourceId)
            .order('timestamp', { ascending: false })
            .limit(limit);
        if (error) {
            logger.error('Failed to fetch resource activity', {
                source: LOG_SOURCE,
                error: error.message,
                resourceType,
                resourceId,
            });
            throw error;
        }
        return data || [];
    }
    catch (err) {
        logger.error('Error in getResourceActivity', {
            source: LOG_SOURCE,
            error: err instanceof Error ? err.message : 'Unknown error',
        });
        throw err;
    }
}
/**
 * Get activity for a specific user
 */
export async function getUserActivity(userId, limit = 50) {
    try {
        const { data, error } = await getActivityLogsTable()
            .select('*')
            .eq('user_id', userId)
            .order('timestamp', { ascending: false })
            .limit(limit);
        if (error) {
            logger.error('Failed to fetch user activity', {
                source: LOG_SOURCE,
                error: error.message,
                userId,
            });
            throw error;
        }
        return data || [];
    }
    catch (err) {
        logger.error('Error in getUserActivity', {
            source: LOG_SOURCE,
            error: err instanceof Error ? err.message : 'Unknown error',
        });
        throw err;
    }
}
/**
 * Trigger manual archive of old logs (admin only)
 */
export async function triggerArchive(retentionDays = 90) {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await supabase.rpc('archive_old_activity_logs', {
            p_retention_days: retentionDays,
        });
        if (error) {
            logger.error('Failed to archive activity logs', {
                source: LOG_SOURCE,
                error: error.message,
            });
            throw error;
        }
        return data;
    }
    catch (err) {
        logger.error('Error in triggerArchive', {
            source: LOG_SOURCE,
            error: err instanceof Error ? err.message : 'Unknown error',
        });
        throw err;
    }
}
