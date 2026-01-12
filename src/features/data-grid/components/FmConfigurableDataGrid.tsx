import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/services/AuthContext';
import { supabase } from '@/shared';
import type { Json } from '@/integrations/supabase/types';
import { FmDataGrid, DataGridColumn, DataGridAction, PaginationMode } from './FmDataGrid';

import { useTableSchema } from '../hooks/useTableSchema';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { Settings2 } from 'lucide-react';
import { logger } from '@/shared';
import { arrayMove } from '@dnd-kit/sortable';
import { toast } from 'sonner';
import { FmColumnConfigModal } from './config/FmColumnConfigModal';
import { FmDataGridSkeleton } from '@/components/common/feedback/FmDataGridRowSkeleton';

interface GridConfig {
  columns: ColumnConfig[];
  pageSize?: number;
}

interface ColumnConfig {
  key: string;
  visible: boolean;
  order: number;
  width?: number;
  frozen?: boolean;
  customLabel?: string;
  type?:
    | 'text'
    | 'number'
    | 'email'
    | 'url'
    | 'date'
    | 'boolean'
    | 'created_date'
    | 'select';
}

interface FmConfigurableDataGridProps<T> {
  gridId: string;
  data: T[];
  columns?: DataGridColumn[]; // Now optional if tableName is provided
  tableName?: string; // NEW: Enable dynamic mode
  excludeColumns?: string[]; // NEW: Exclude columns in dynamic mode
  includeColumns?: string[]; // NEW: Include only specific columns
  actions?: DataGridAction[];
  contextMenuActions?: DataGridAction[];
  loading?: boolean;
  pageSize?: number;
  className?: string;
  onUpdate?: (row: T, columnKey: string, newValue: any) => Promise<void>;
  onCreate?: (newRow: Partial<T>) => Promise<void>;
  onCreateButtonClick?: () => void;
  resourceName?: string;
  createButtonLabel?: string;
  /** Pagination mode: 'infinite' (default) loads more as you scroll, 'paged' shows traditional pagination */
  paginationMode?: PaginationMode;
}

export function FmConfigurableDataGrid<T extends Record<string, any>>({
  gridId,
  data,
  columns: manualColumns,
  tableName,
  excludeColumns,
  includeColumns,
  actions = [],
  contextMenuActions = [],
  loading = false,
  pageSize = 25,
  className,
  onUpdate,
  onCreate,
  onCreateButtonClick,
  resourceName = 'Resource',
  createButtonLabel,
  paginationMode = 'infinite',
}: FmConfigurableDataGridProps<T>) {
  const { t } = useTranslation('common');
  const { t: tToast } = useTranslation('toasts');
  const { user } = useAuth();
  const [config, setConfig] = useState<GridConfig | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isColumnConfigOpen, setIsColumnConfigOpen] = useState(false);

  // NEW: Dynamic mode - fetch schema if tableName is provided
  const {
    columns: schemaColumns,
    isLoading: isLoadingSchema,
    error: schemaError,
    refresh: refreshSchema,
    isRefreshing,
  } = useTableSchema({
    tableName: tableName || '',
    excludeColumns,
    includeColumns,
    enabled: Boolean(tableName),
  });

  // Determine which columns to use: manual or schema-generated
  const baseColumns = useMemo(() => {
    // If manual columns provided, use those (static mode)
    if (manualColumns && manualColumns.length > 0) {
      return manualColumns;
    }

    // If tableName provided, use schema-generated columns (dynamic mode)
    if (tableName && schemaColumns.length > 0) {
      return schemaColumns;
    }

    // Fallback: empty array (will show loading or error)
    return [];
  }, [manualColumns, tableName, schemaColumns]);

  // Show error if schema fetch failed in dynamic mode
  useEffect(() => {
    if (tableName && schemaError) {
      logger.error(`Failed to load schema for table ${tableName}:`, schemaError);
      toast.error(tToast('admin.schemaRefreshFailed'), {
        description: (schemaError as Error).message,
      });
    }
  }, [tableName, schemaError, tToast]);

  useEffect(() => {
    loadConfig();
  }, [user?.id, gridId]);

  const loadConfig = async () => {
    if (!user?.id) {
      setIsLoadingConfig(false);
      return;
    }

    try {
      const { data: configData, error } = await supabase
        .from('datagrid_configs')
        .select('config')
        .eq('user_id', user.id)
        .eq('grid_id', gridId)
        .maybeSingle();

      if (error) {
        logger.error('Error loading grid config:', error);
      }

      if (configData?.config) {
        setConfig(configData.config as unknown as GridConfig);
      }
    } catch (error) {
      logger.error('Error loading grid config:', { error: error instanceof Error ? error.message : 'Unknown' });
    } finally {
      setIsLoadingConfig(false);
    }
  };

  const saveConfig = async (newConfig: GridConfig) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('datagrid_configs')
        .upsert(
          {
            user_id: user.id,
            grid_id: gridId,
            config: newConfig as unknown as Json,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,grid_id',
          }
        );

      if (error) {
        logger.error('Error saving grid config:', error);
        toast.error(tToast('admin.columnSaveFailed'));
      } else {
        toast.success(tToast('admin.columnConfigSaved'));
      }
    } catch (error) {
      logger.error('Error saving grid config:', { error: error instanceof Error ? error.message : 'Unknown' });
      toast.error(tToast('admin.columnSaveFailed'));
    }
  };

  // Initialize config from base columns if not loaded
  const initializedConfig = useMemo(() => {
    if (config) return config;

    return {
      columns: baseColumns.map((col, index) => ({
        key: col.key,
        visible: true,
        order: index,
      })),
      pageSize,
    };
  }, [config, baseColumns, pageSize]);

  // Apply configuration to columns
  const configuredColumns = useMemo(() => {
    const configMap = new Map<string, ColumnConfig>(
      initializedConfig.columns.map(c => [c.key, c as ColumnConfig])
    );

    // Validate column keys against data
    if (process.env.NODE_ENV === 'development' && data.length > 0) {
      const sampleRow = data[0];
      const missingKeys = baseColumns
        .filter(col => !(col.key in sampleRow) && !col.render)
        .map(col => col.key);

      if (missingKeys.length > 0) {
        logger.warn('Column keys missing in data', {
          missingKeys,
          availableKeys: Object.keys(sampleRow),
          source: 'FmConfigurableDataGrid',
        });
      }
    }

    return baseColumns
      .map(col => {
        const colConfig = configMap.get(col.key);
        return {
          ...col,
          label: colConfig?.customLabel || col.label,
          type: colConfig?.type || col.type || 'text',
          visible: colConfig?.visible ?? true,
          order: colConfig?.order ?? 0,
          frozen: colConfig?.frozen ?? false,
        };
      })
      .filter((col: any) => col.visible)
      .sort((a: any, b: any) => a.order - b.order);
  }, [baseColumns, initializedConfig, data]);

  // Save column configuration from modal
  const handleSaveColumnConfig = (configs: GridConfig['columns']) => {
    const newConfig: GridConfig = {
      ...initializedConfig,
      columns: configs,
    };

    setConfig(newConfig);
    saveConfig(newConfig);
  };

  const hideColumn = (columnKey: string) => {
    const newConfig: GridConfig = {
      ...initializedConfig,
      columns: initializedConfig.columns.map(col =>
        col.key === columnKey ? { ...col, visible: false } : col
      ),
    };

    setConfig(newConfig);
    saveConfig(newConfig);
    const columnLabel = baseColumns.find(c => c.key === columnKey)?.label;
    toast.success(t('dataGrid.columnHidden', { column: columnLabel }));
  };

  const handleColumnReorder = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    // Get visible columns sorted by their current order
    const visibleColumns = initializedConfig.columns
      .filter(c => c.visible)
      .sort((a, b) => a.order - b.order);

    // Reorder using visual indices
    const reorderedColumns = arrayMove(visibleColumns, fromIndex, toIndex);

    // Create a map of key -> new order for visible columns
    const orderMap = new Map(
      reorderedColumns.map((col, index) => [col.key, index])
    );

    // Update all columns with new order
    const updatedColumns = initializedConfig.columns.map(col => {
      if (col.visible && orderMap.has(col.key)) {
        return { ...col, order: orderMap.get(col.key)! };
      }
      // Keep hidden columns at the end with their relative order preserved
      if (!col.visible) {
        return { ...col, order: reorderedColumns.length + col.order };
      }
      return col;
    });

    const newConfig: GridConfig = {
      ...initializedConfig,
      columns: updatedColumns,
    };

    setConfig(newConfig);
    saveConfig(newConfig);
    toast.success(tToast('admin.columnOrderUpdated'));
  };

  const handleToggleFreeze = (columnKey: string) => {
    const currentCol = initializedConfig.columns.find(c => c.key === columnKey) as ColumnConfig | undefined;
    const newConfig: GridConfig = {
      ...initializedConfig,
      columns: initializedConfig.columns.map(col => {
        const colConfig = col as ColumnConfig;
        return col.key === columnKey ? { ...colConfig, frozen: !colConfig.frozen } : colConfig;
      }),
    };

    setConfig(newConfig);
    saveConfig(newConfig);

    const column = baseColumns.find(c => c.key === columnKey);
    const isFrozen = !currentCol?.frozen;
    toast.success(
      isFrozen
        ? t('dataGrid.columnFrozen', { column: column?.label })
        : t('dataGrid.columnUnfrozen', { column: column?.label })
    );
  };

  const resetConfiguration = async () => {
    const defaultConfig: GridConfig = {
      columns: baseColumns.map((col, index) => ({
        key: col.key,
        visible: true,
        order: index,
      })),
      pageSize,
    };

    setConfig(defaultConfig);

    if (user?.id) {
      try {
        const { error } = await supabase
          .from('datagrid_configs')
          .delete()
          .eq('user_id', user.id)
          .eq('grid_id', gridId);

        if (error) {
          logger.error('Error resetting grid config:', error);
          toast.error(t('dataGrid.resetFailed'));
        } else {
          toast.success(t('dataGrid.resetSuccess'));
        }
      } catch (error) {
        logger.error('Error resetting grid config:', { error: error instanceof Error ? error.message : 'Unknown' });
        toast.error(t('dataGrid.resetFailed'));
      }
    }
  };

  // Show loading state if config or schema is loading
  if (isLoadingConfig || (tableName && isLoadingSchema)) {
    return (
      <div className='space-y-2'>
        <FmDataGridSkeleton rows={Math.min(pageSize, 10)} columns={manualColumns?.length || 6} showHeader />
      </div>
    );
  }

  // Show error state if dynamic mode failed and no manual columns
  if (tableName && schemaError && !manualColumns) {
    return (
      <div className='flex items-center justify-center p-8'>
        <div className='text-center'>
          <p className='text-destructive mb-2'>{t('dataGrid.schemaLoadFailed')}</p>
          <p className='text-sm text-muted-foreground'>{(schemaError as Error).message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-2'>
      <FmDataGrid
        data={data}
        columns={configuredColumns}
        actions={actions}
        contextMenuActions={contextMenuActions}
        loading={loading}
        pageSize={initializedConfig.pageSize ?? pageSize}
        className={className}
        onUpdate={onUpdate ? (item: T, columnKey?: string, newValue?: any) => onUpdate(item, columnKey || '', newValue) : undefined}
        onCreate={onCreate}
        onCreateButtonClick={onCreateButtonClick}
        resourceName={resourceName}
        createButtonLabel={createButtonLabel}
        onHideColumn={hideColumn}
        onColumnReorder={handleColumnReorder}
        onToggleFreeze={handleToggleFreeze}
        paginationMode={paginationMode}
        toolbarActions={
          <>
            <FmCommonButton
              variant='default'
              size='sm'
              icon={Settings2}
              onClick={() => setIsColumnConfigOpen(true)}
            >
              {t('dataGrid.columnsLabel')}
            </FmCommonButton>

            <FmColumnConfigModal
              open={isColumnConfigOpen}
              onOpenChange={setIsColumnConfigOpen}
              baseColumns={baseColumns}
              columnConfigs={initializedConfig.columns}
              onSaveConfiguration={handleSaveColumnConfig}
              onResetConfiguration={resetConfiguration}
              onRefreshSchema={tableName ? refreshSchema : undefined}
              isRefreshing={isRefreshing}
            />
          </>
        }
      />
    </div>
  );
}
