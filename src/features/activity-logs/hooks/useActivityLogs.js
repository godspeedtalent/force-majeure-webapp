/**
 * Activity Logs React Query Hooks
 *
 * Provides hooks for fetching and managing activity log data.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { getActivityLogs, getActivitySummary, exportActivityLogs, getActivityLogById, getResourceActivity, getUserActivity, triggerArchive, } from '../services/activityLogService';
// ============================================================================
// Query Keys
// ============================================================================
export const activityLogKeys = {
    all: ['activity-logs'],
    lists: () => [...activityLogKeys.all, 'list'],
    list: (filters, page, pageSize) => [...activityLogKeys.lists(), { filters, page, pageSize }],
    details: () => [...activityLogKeys.all, 'detail'],
    detail: (id) => [...activityLogKeys.details(), id],
    summary: (dateFrom, dateTo) => [...activityLogKeys.all, 'summary', { dateFrom, dateTo }],
    resource: (resourceType, resourceId) => [...activityLogKeys.all, 'resource', resourceType, resourceId],
    user: (userId) => [...activityLogKeys.all, 'user', userId],
};
// ============================================================================
// Query Hooks
// ============================================================================
/**
 * Fetch paginated activity logs with filters
 */
export function useActivityLogs(filters = {}, page = 1, pageSize = 50, options) {
    return useQuery({
        queryKey: activityLogKeys.list(filters, page, pageSize),
        queryFn: () => getActivityLogs(filters, page, pageSize),
        enabled: options?.enabled ?? true,
        staleTime: 30000, // 30 seconds
    });
}
/**
 * Fetch activity log summary by category
 */
export function useActivitySummary(dateFrom, dateTo) {
    return useQuery({
        queryKey: activityLogKeys.summary(dateFrom, dateTo),
        queryFn: () => getActivitySummary(dateFrom, dateTo),
        staleTime: 60000, // 1 minute
    });
}
/**
 * Fetch a single activity log by ID
 */
export function useActivityLogById(id, options) {
    return useQuery({
        queryKey: activityLogKeys.detail(id || ''),
        queryFn: () => {
            if (!id)
                throw new Error('Activity log ID is required');
            return getActivityLogById(id);
        },
        enabled: Boolean(id) && (options?.enabled ?? true),
    });
}
/**
 * Fetch activity for a specific resource
 */
export function useResourceActivity(resourceType, resourceId, limit = 10, options) {
    return useQuery({
        queryKey: activityLogKeys.resource(resourceType || '', resourceId || ''),
        queryFn: () => {
            if (!resourceType || !resourceId) {
                throw new Error('Resource type and ID are required');
            }
            return getResourceActivity(resourceType, resourceId, limit);
        },
        enabled: Boolean(resourceType) &&
            Boolean(resourceId) &&
            (options?.enabled ?? true),
    });
}
/**
 * Fetch activity for a specific user
 */
export function useUserActivity(userId, limit = 50, options) {
    return useQuery({
        queryKey: activityLogKeys.user(userId || ''),
        queryFn: () => {
            if (!userId)
                throw new Error('User ID is required');
            return getUserActivity(userId, limit);
        },
        enabled: Boolean(userId) && (options?.enabled ?? true),
    });
}
// ============================================================================
// Mutation Hooks
// ============================================================================
/**
 * Export activity logs to file
 */
export function useExportActivityLogs() {
    const { t } = useTranslation('common');
    return useMutation({
        mutationFn: ({ filters, format }) => exportActivityLogs(filters, format),
        onSuccess: (blob, { format }) => {
            // Create download link
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success(t('activityLogs.exportSuccess', { format: format.toUpperCase() }));
        },
        onError: error => {
            toast.error(t('activityLogs.exportFailed', { error: error.message }));
        },
    });
}
/**
 * Trigger manual archive of old logs
 */
export function useArchiveActivityLogs() {
    const { t } = useTranslation('common');
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: retentionDays => triggerArchive(retentionDays),
        onSuccess: count => {
            toast.success(t('activityLogs.archiveSuccess', { count }));
            // Invalidate all activity log queries
            queryClient.invalidateQueries({ queryKey: activityLogKeys.all });
        },
        onError: error => {
            toast.error(t('activityLogs.archiveFailed', { error: error.message }));
        },
    });
}
// ============================================================================
// Utility Hook for Refreshing
// ============================================================================
/**
 * Hook to refresh activity logs data
 */
export function useRefreshActivityLogs() {
    const queryClient = useQueryClient();
    return {
        refreshAll: () => queryClient.invalidateQueries({ queryKey: activityLogKeys.all }),
        refreshList: () => queryClient.invalidateQueries({ queryKey: activityLogKeys.lists() }),
        refreshSummary: () => queryClient.invalidateQueries({
            queryKey: [...activityLogKeys.all, 'summary'],
        }),
    };
}
