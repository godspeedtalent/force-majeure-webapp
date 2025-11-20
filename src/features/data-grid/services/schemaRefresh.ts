/**
 * Schema Refresh Service
 *
 * Utilities for refreshing cached schema metadata from the database.
 * Admin-only functionality for keeping the metadata cache up-to-date.
 */

import { supabase } from '@/shared/api/supabase/client';
import { logger } from '@/shared/services/logger';

/**
 * Result of a schema refresh operation
 */
export interface RefreshResult {
  success: boolean;
  tableName?: string;
  tablesRefreshed?: number;
  timestamp: string;
  error?: string;
}

/**
 * Refresh metadata for a single table
 */
export async function refreshTableSchema(
  tableName: string
): Promise<RefreshResult> {
  try {
    logger.info(`Refreshing schema for table: ${tableName}`);

    const { data, error } = await supabase.rpc('refresh_table_metadata', {
      p_table_name: tableName,
    });

    if (error) {
      logger.error(`Failed to refresh table ${tableName}:`, error);
      return {
        success: false,
        tableName,
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }

    logger.info(`Successfully refreshed schema for table: ${tableName}`, data);

    return {
      success: true,
      tableName,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Exception refreshing table ${tableName}:`, error);

    return {
      success: false,
      tableName,
      timestamp: new Date().toISOString(),
      error: message,
    };
  }
}

/**
 * Refresh metadata for all tables
 */
export async function refreshAllTableSchemas(): Promise<RefreshResult> {
  try {
    logger.info('Refreshing schema for all tables');

    const { data, error } = await supabase.rpc('refresh_all_table_metadata');

    if (error) {
      logger.error('Failed to refresh all tables:', error);
      return {
        success: false,
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }

    const result = data as {
      tables_refreshed: number;
      timestamp: string;
    };

    logger.info(`Successfully refreshed ${result.tables_refreshed} tables`);

    return {
      success: true,
      tablesRefreshed: result.tables_refreshed,
      timestamp: result.timestamp,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error';
    logger.error('Exception refreshing all tables:', error);

    return {
      success: false,
      timestamp: new Date().toISOString(),
      error: message,
    };
  }
}

/**
 * Get list of all available tables
 */
export async function getAvailableTables(): Promise<{
  success: boolean;
  tables?: Array<{
    table_name: string;
    row_count: number;
    table_size: string;
  }>;
  error?: string;
}> {
  try {
    const { data, error } = await supabase.rpc('get_table_list');

    if (error) {
      logger.error('Failed to get table list:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      tables: data as Array<{
        table_name: string;
        row_count: number;
        table_size: string;
      }>,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error';
    logger.error('Exception getting table list:', error);

    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Check if schema metadata exists for a table
 */
export async function hasTableMetadata(tableName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('table_metadata')
      .select('table_name')
      .eq('table_name', tableName)
      .single();

    if (error) {
      // PGRST116 means no rows returned
      if (error.code === 'PGRST116') {
        return false;
      }
      logger.error(`Error checking metadata for ${tableName}:`, error);
      return false;
    }

    return Boolean(data);
  } catch (error) {
    logger.error(`Exception checking metadata for ${tableName}:`, error);
    return false;
  }
}

/**
 * Get tables that don't have metadata cached
 */
export async function getMissingMetadataTables(): Promise<string[]> {
  try {
    // Get all available tables
    const availableTablesResult = await getAvailableTables();
    if (!availableTablesResult.success || !availableTablesResult.tables) {
      return [];
    }

    // Get tables with metadata
    const { data: cachedTables, error } = await supabase
      .from('table_metadata')
      .select('table_name');

    if (error) {
      logger.error('Failed to get cached table metadata:', error);
      return [];
    }

    const cachedSet = new Set(cachedTables.map(t => t.table_name));

    // Find tables without metadata
    const missing = availableTablesResult.tables
      .filter(t => !cachedSet.has(t.table_name))
      .map(t => t.table_name);

    return missing;
  } catch (error) {
    logger.error('Exception getting missing metadata tables:', error);
    return [];
  }
}

/**
 * Refresh only tables that are missing metadata
 */
export async function refreshMissingMetadata(): Promise<RefreshResult> {
  try {
    const missing = await getMissingMetadataTables();

    if (missing.length === 0) {
      return {
        success: true,
        tablesRefreshed: 0,
        timestamp: new Date().toISOString(),
      };
    }

    logger.info(`Refreshing ${missing.length} missing tables:`, missing);

    // Refresh each missing table
    const results = await Promise.all(
      missing.map(tableName => refreshTableSchema(tableName))
    );

    const successCount = results.filter(r => r.success).length;
    const failedTables = results
      .filter(r => !r.success)
      .map(r => r.tableName);

    if (failedTables.length > 0) {
      logger.warn('Some tables failed to refresh:', failedTables);
    }

    return {
      success: successCount > 0,
      tablesRefreshed: successCount,
      timestamp: new Date().toISOString(),
      error:
        failedTables.length > 0
          ? `Failed to refresh ${failedTables.length} tables`
          : undefined,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error';
    logger.error('Exception refreshing missing metadata:', error);

    return {
      success: false,
      timestamp: new Date().toISOString(),
      error: message,
    };
  }
}

/**
 * Get metadata cache status
 */
export async function getMetadataCacheStatus(): Promise<{
  totalTables: number;
  cachedTables: number;
  missingTables: number;
  lastUpdated?: string;
}> {
  try {
    const [availableResult, cachedResult, missingTables] = await Promise.all([
      getAvailableTables(),
      supabase.from('table_metadata').select('table_name, updated_at'),
      getMissingMetadataTables(),
    ]);

    const totalTables = availableResult.tables?.length || 0;
    const cachedTables = cachedResult.data?.length || 0;

    // Get most recent update timestamp
    let lastUpdated: string | undefined;
    if (cachedResult.data && cachedResult.data.length > 0) {
      const timestamps = cachedResult.data
        .map(t => new Date(t.updated_at).getTime())
        .sort((a, b) => b - a);
      lastUpdated = new Date(timestamps[0]).toISOString();
    }

    return {
      totalTables,
      cachedTables,
      missingTables: missingTables.length,
      lastUpdated,
    };
  } catch (error) {
    logger.error('Exception getting cache status:', error);
    return {
      totalTables: 0,
      cachedTables: 0,
      missingTables: 0,
    };
  }
}
