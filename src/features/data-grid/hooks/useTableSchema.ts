/**
 * useTableSchema Hook
 *
 * React Query hook for fetching table schema metadata and generating
 * dynamic column definitions.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase/client';
import { logger } from '@/shared/services/logger';
import { toast } from 'sonner';
import {
  generateColumnsFromSchema,
  ColumnFactoryOptions,
  stripMetadata,
  ColumnCustomization,
} from '../services/columnFactory';
import { ColumnMetadata } from '../services/schemaTypeMapper';

// Local interface for foreign key metadata
interface ForeignKeyMetadata {
  column_name: string;
  foreign_table: string;
  foreign_column: string;
}
import { DataGridColumn } from '../types';

/**
 * Table metadata from database
 */
export interface TableMetadata {
  table_name: string;
  display_name: string;
  description?: string;
  columns: ColumnMetadata[];
  relations: ForeignKeyMetadata[];
  updated_at: string;
}

/**
 * useTableSchema options
 */
export interface UseTableSchemaOptions {
  /** Table name to fetch schema for */
  tableName: string;

  /** Exclude specific columns */
  excludeColumns?: string[];

  /** Include only specific columns */
  includeColumns?: string[];

  /** Enable/disable fetching customizations */
  fetchCustomizations?: boolean;

  /** Enable/disable the query */
  enabled?: boolean;

  /** Manual column overrides */
  manualOverrides?: Partial<DataGridColumn>[];
}

/**
 * Fetch table metadata from cache
 */
async function fetchTableMetadata(tableName: string): Promise<TableMetadata> {
  const { data, error } = await (supabase as any)
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
    table_name: data.table_name as string,
    display_name: data.display_name as string,
    description: data.description as string | undefined,
    columns: data.columns as ColumnMetadata[],
    relations: data.relations as ForeignKeyMetadata[],
    updated_at: data.updated_at as string,
  };
}

/**
 * Fetch column customizations for a table
 */
async function fetchColumnCustomizations(
  tableName: string
): Promise<ColumnCustomization[]> {
  const { data, error } = await (supabase as any)
    .from('column_customizations')
    .select('*')
    .eq('table_name', tableName)
    .order('display_order', { ascending: true, nullsLast: true });

  if (error) {
    logger.warn(
      `Failed to fetch column customizations for ${tableName}:`,
      error
    );
    return [];
  }

  return (data || []).map((row: any) => ({
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
 * Note: This function is disabled as the database function doesn't exist
 */
async function refreshTableMetadata(_tableName: string): Promise<TableMetadata> {
  // Disabled: Database function doesn't exist
  throw new Error('Table metadata refresh is not available - database function not implemented');
}

/**
 * Main hook: useTableSchema
 */
export function useTableSchema(options: UseTableSchemaOptions) {
  const {
    tableName,
    excludeColumns = [],
    includeColumns,
    fetchCustomizations = true,
    enabled = true,
    manualOverrides = [],
  } = options;

  const queryClient = useQueryClient();

  // Fetch table metadata
  const {
    data: metadata,
    isLoading: isLoadingMetadata,
    error: metadataError,
  } = useQuery({
    queryKey: ['table-metadata', tableName],
    queryFn: () => fetchTableMetadata(tableName),
    enabled: enabled && Boolean(tableName),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  // Fetch column customizations
  const {
    data: customizations,
    isLoading: isLoadingCustomizations,
  } = useQuery({
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
      toast.success('Schema refreshed successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to refresh schema: ${error.message}`);
    },
  });

  // Generate columns when metadata is available
  const columns: DataGridColumn[] = React.useMemo(() => {
    if (!metadata) {
      return [];
    }

    try {
      const factoryOptions: ColumnFactoryOptions = {
        tableName,
        columns: metadata.columns,
        foreignKeys: metadata.relations as any, // Type mismatch - local vs imported interface
        customizations: customizations || [],
        excludeColumns,
        includeColumns,
      };

      const generated = generateColumnsFromSchema(factoryOptions);

      // Strip metadata for production use
      let finalColumns = stripMetadata(generated);

      // Apply manual overrides
      if (manualOverrides.length > 0) {
        const overrideMap = new Map(
          manualOverrides.map(col => [col.key!, col])
        );

        finalColumns = finalColumns.map(col => {
          const override = overrideMap.get(col.key);
          if (override) {
            return { ...col, ...override };
          }
          return col;
        });
      }

      return finalColumns;
    } catch (error) {
      logger.error('Failed to generate columns', {
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'useTableSchema',
        details: { tableName, error }
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
 * Note: This hook is disabled as the database function doesn't exist
 */
export function useRefreshAllTables() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Disabled: Database function doesn't exist
      throw new Error('Table metadata refresh is not available - database function not implemented');
      
      /* Original implementation - requires database function:
      const { data, error } = await (supabase as any).rpc('refresh_all_table_metadata');

      if (error) {
        throw new Error(`Failed to refresh all tables: ${error.message}`);
      }

      return data as { tables_refreshed: number; timestamp: string };
      */
    },
    onSuccess: (_data) => {
      queryClient.invalidateQueries({ queryKey: ['table-metadata'] });
      queryClient.invalidateQueries({ queryKey: ['column-customizations'] });
      toast.success(`Refreshed tables successfully`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to refresh tables: ${error.message}`);
    },
  });
}

/**
 * Hook for getting list of all tables
 * Note: This hook is disabled as the database function doesn't exist
 */
export function useTableList() {
  return useQuery({
    queryKey: ['table-list'],
    queryFn: async () => {
      // Disabled: Database function doesn't exist
      throw new Error('Table list is not available - database function not implemented');
      
      /* Original implementation - requires database function:
      const { data, error } = await (supabase as any).rpc('get_table_list');

      if (error) {
        throw new Error(`Failed to fetch table list: ${error.message}`);
      }

      return data as Array<{
        table_name: string;
        row_count: number;
        table_size: string;
      }>;
      */
    },
    enabled: false, // Disabled since function doesn't exist
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for saving column customization
 */
export function useSaveColumnCustomization(tableName: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customization: Partial<ColumnCustomization> & { column_key: string }) => {
      const { error } = await (supabase as any)
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
      toast.success('Column customization saved');
    },
    onError: (error: Error) => {
      toast.error(`Failed to save customization: ${error.message}`);
    },
  });
}

// Add missing React import
import React from 'react';
