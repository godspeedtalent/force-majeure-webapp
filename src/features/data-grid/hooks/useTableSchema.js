/**
 * useTableSchema Hook
 *
 * React Query hook for fetching table schema metadata and generating
 * dynamic column definitions.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/shared';
import { logger } from '@/shared';
import { toast } from 'sonner';
import { generateColumnsFromSchema, stripMetadata, } from '../services/columnFactory';
/**
 * Fetch table metadata from cache
 */
async function fetchTableMetadata(tableName) {
    const { data, error } = await supabase
        .from('table_metadata')
        .select('*')
        .eq('table_name', tableName)
        .single();
    if (error) {
        logger.error('Failed to fetch table metadata', {
            error: error instanceof Error ? error.message : 'Unknown error',
            source: 'fetchTableMetadata',
            details: { tableName, error }
        });
        throw new Error(`Failed to fetch table metadata: ${error.message}`);
    }
    if (!data) {
        throw new Error(`No metadata found for table: ${tableName}`);
    }
    return {
        table_name: data.table_name,
        display_name: data.display_name,
        description: data.description,
        columns: data.columns,
        relations: data.relations,
        updated_at: data.updated_at,
    };
}
/**
 * Fetch column customizations for a table
 */
async function fetchColumnCustomizations(tableName) {
    const { data, error } = await supabase
        .from('column_customizations')
        .select('*')
        .eq('table_name', tableName)
        .order('display_order', { ascending: true, nullsLast: true });
    if (error) {
        logger.warn(`Failed to fetch column customizations for ${tableName}:`, error);
        return [];
    }
    return (data || []).map((row) => ({
        column_key: row.column_key,
        custom_label: row.custom_label,
        custom_type: row.custom_type,
        is_editable: row.is_editable,
        is_visible_by_default: row.is_visible_by_default,
        is_sortable: row.is_sortable,
        is_filterable: row.is_filterable,
        custom_width: row.custom_width,
        display_order: row.display_order,
        render_config: row.render_config,
    }));
}
/**
 * Refresh table metadata cache from database schema
 */
async function refreshTableMetadata(tableName) {
    const { error } = await supabase.rpc('refresh_table_metadata', {
        p_table_name: tableName,
    });
    if (error) {
        logger.error('Failed to refresh table metadata', {
            error: error.message,
            source: 'refreshTableMetadata',
            details: { tableName }
        });
        throw new Error(`Failed to refresh table metadata: ${error.message}`);
    }
    // Fetch the updated metadata from cache
    return await fetchTableMetadata(tableName);
}
/**
 * Main hook: useTableSchema
 */
export function useTableSchema(options) {
    const { tableName, excludeColumns = [], includeColumns, fetchCustomizations = true, enabled = true, manualOverrides = [], } = options;
    const { t } = useTranslation('toasts');
    const queryClient = useQueryClient();
    // Fetch table metadata
    const { data: metadata, isLoading: isLoadingMetadata, error: metadataError, } = useQuery({
        queryKey: ['table-metadata', tableName],
        queryFn: () => fetchTableMetadata(tableName),
        enabled: enabled && Boolean(tableName),
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
    });
    // Fetch column customizations
    const { data: customizations, isLoading: isLoadingCustomizations, } = useQuery({
        queryKey: ['column-customizations', tableName],
        queryFn: () => fetchColumnCustomizations(tableName),
        enabled: enabled && fetchCustomizations && Boolean(tableName),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
    // Mutation: Refresh metadata
    const refreshMutation = useMutation({
        mutationFn: () => refreshTableMetadata(tableName),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['table-metadata', tableName] });
            toast.success(t('admin.schemaRefreshed'));
        },
        onError: (error) => {
            toast.error(`${t('admin.schemaRefreshFailed')}: ${error.message}`);
        },
    });
    // Generate columns when metadata is available
    const columns = React.useMemo(() => {
        if (!metadata) {
            return [];
        }
        try {
            const factoryOptions = {
                tableName,
                columns: metadata.columns,
                foreignKeys: metadata.relations,
                customizations: customizations || [],
                excludeColumns,
                includeColumns,
            };
            const generated = generateColumnsFromSchema(factoryOptions);
            // Strip metadata for production use
            let finalColumns = stripMetadata(generated);
            // Apply manual overrides
            if (manualOverrides.length > 0) {
                const overrideMap = new Map(manualOverrides.map(col => [col.key, col]));
                finalColumns = finalColumns.map(col => {
                    const override = overrideMap.get(col.key);
                    if (override) {
                        return { ...col, ...override };
                    }
                    return col;
                });
            }
            return finalColumns;
        }
        catch (error) {
            logger.error('Failed to generate columns', {
                error: error instanceof Error ? error.message : 'Unknown error',
                source: 'useTableSchema',
                details: { tableName }
            });
            return [];
        }
    }, [metadata, customizations, tableName, excludeColumns, includeColumns, manualOverrides]);
    return {
        // Metadata
        metadata,
        customizations,
        // Generated columns
        columns,
        // Loading states
        isLoading: isLoadingMetadata || isLoadingCustomizations,
        isLoadingMetadata,
        isLoadingCustomizations,
        // Error states
        error: metadataError,
        // Actions
        refresh: refreshMutation.mutate,
        isRefreshing: refreshMutation.isPending,
        // Utility
        displayName: metadata?.display_name || tableName,
        columnCount: columns.length,
        relationCount: metadata?.relations.length || 0,
    };
}
/**
 * Hook for refreshing all table metadata
 */
export function useRefreshAllTables() {
    const { t } = useTranslation('toasts');
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            const { data, error } = await supabase.rpc('refresh_all_table_metadata');
            if (error) {
                throw new Error(`Failed to refresh all tables: ${error.message}`);
            }
            return data;
        },
        onSuccess: (_data) => {
            // Invalidate all table metadata queries
            queryClient.invalidateQueries({ queryKey: ['table-metadata'] });
            queryClient.invalidateQueries({ queryKey: ['column-customizations'] });
            toast.success(t('admin.tablesRefreshed'));
        },
        onError: (error) => {
            toast.error(`${t('admin.tablesRefreshFailed')}: ${error.message}`);
        },
    });
}
/**
 * Hook for getting list of all tables
 */
export function useTableList() {
    return useQuery({
        queryKey: ['table-list'],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('get_table_list');
            if (error) {
                throw new Error(`Failed to fetch table list: ${error.message}`);
            }
            return data;
        },
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
}
/**
 * Hook for saving column customization
 */
export function useSaveColumnCustomization(tableName) {
    const { t } = useTranslation('toasts');
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (customization) => {
            const { error } = await supabase
                .from('column_customizations')
                .upsert({
                table_name: tableName,
                ...customization,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'table_name,column_key',
            });
            if (error) {
                throw new Error(`Failed to save customization: ${error.message}`);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['column-customizations', tableName],
            });
            toast.success(t('admin.columnsSaved'));
        },
        onError: (error) => {
            toast.error(`${t('admin.columnSaveFailed')}: ${error.message}`);
        },
    });
}
// Add missing React import
import React from 'react';
