import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/features/auth/services/AuthContext';
import { supabase } from '@/shared/api/supabase/client';
import { FmDataGrid, DataGridColumn, DataGridAction } from './FmDataGrid';

import { useTableSchema } from '../hooks/useTableSchema';
import { Button } from '@/components/common/shadcn/button';
import { GripVertical, Settings2 } from 'lucide-react';
import { logger } from '@/shared/services/logger';
import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { toast } from 'sonner';
import { FmColumnReorderDialog } from './config/FmColumnReorderDialog';
import { FmColumnConfigModal } from './config/FmColumnConfigModal';

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
    | 'created_date';
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
  pageSize = 10,
  className,
  onUpdate,
  onCreate,
  onCreateButtonClick,
  resourceName = 'Resource',
  createButtonLabel,
}: FmConfigurableDataGridProps<T>) {
  const { user } = useAuth();
  const [config, setConfig] = useState<GridConfig | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isReorderDialogOpen, setIsReorderDialogOpen] = useState(false);
  const [isColumnConfigOpen, setIsColumnConfigOpen] = useState(false);
  const [recentlyMovedKey, setRecentlyMovedKey] = useState<string | null>(null);

  // NEW: Dynamic mode - fetch schema if tableName is provided
  const {
    columns: schemaColumns,
    isLoading: isLoadingSchema,
    error: schemaError,
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
      toast.error(`Failed to load table schema: ${(schemaError as Error).message}`);
    }
  }, [tableName, schemaError]);

  useEffect(() => {
    loadConfig();
  }, [user?.id, gridId]);

  const loadConfig = async () => {
    if (!user?.id) {
      setIsLoadingConfig(false);
      return;
    }

    try {
      const { data: configData, error } = await (supabase as any)
        .from('datagrid_configs')
        .select('config')
        .eq('user_id', user.id)
        .eq('grid_id', gridId)
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.error('Error loading grid config:', error);
      }

      if (configData?.config) {
        setConfig(configData.config as GridConfig);
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
      const { error } = await (supabase as any)
        .from('datagrid_configs')
        .upsert(
          {
            user_id: user.id,
            grid_id: gridId,
            config: newConfig,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,grid_id',
          }
        );

      if (error) {
        logger.error('Error saving grid config:', error);
        toast.error('Failed to save column configuration');
      } else {
        toast.success('Column configuration saved');
      }
    } catch (error) {
      logger.error('Error saving grid config:', { error: error instanceof Error ? error.message : 'Unknown' });
      toast.error('Failed to save column configuration');
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

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = initializedConfig.columns.findIndex(c => c.key === active.id);
    const newIndex = initializedConfig.columns.findIndex(c => c.key === over.id);

    const reorderedColumns = arrayMove(initializedConfig.columns, oldIndex, newIndex);

    const newConfig: GridConfig = {
      ...initializedConfig,
      columns: reorderedColumns.map((col, index) => ({
        ...col,
        order: index,
      })),
    };

    setConfig(newConfig);
    saveConfig(newConfig);

    setRecentlyMovedKey(active.id as string);
    setTimeout(() => setRecentlyMovedKey(null), 600);
  };


  // Save column configuration from modal
  const handleSaveColumnConfig = (configs: GridConfig['columns']) => {
    const newConfig: GridConfig = {
      ...initializedConfig,
      columns: configs,
    };

    setConfig(newConfig);
    saveConfig(newConfig);
    toast.success('Column configuration saved');
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
    toast.success(
      `Column "${baseColumns.find(c => c.key === columnKey)?.label}" hidden`
    );
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

    // Visual feedback
    const movedColumn = reorderedColumns[toIndex];
    setRecentlyMovedKey(movedColumn.key);
    setTimeout(() => setRecentlyMovedKey(null), 600);

    toast.success('Column order updated');
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
      `Column "${column?.label}" ${isFrozen ? 'frozen' : 'unfrozen'}`
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
        const { error } = await (supabase as any)
          .from('datagrid_configs')
          .delete()
          .eq('user_id', user.id)
          .eq('grid_id', gridId);

        if (error) {
          logger.error('Error resetting grid config:', error);
          toast.error('Failed to reset configuration');
        } else {
          toast.success('Configuration reset to default');
        }
      } catch (error) {
        logger.error('Error resetting grid config:', { error: error instanceof Error ? error.message : 'Unknown' });
        toast.error('Failed to reset configuration');
      }
    }
  };

  // Show loading state if config or schema is loading
  if (isLoadingConfig || (tableName && isLoadingSchema)) {
    return (
      <div className='flex items-center justify-center p-8'>
        <div className='h-8 w-8 border-2 border-fm-gold border-t-transparent rounded-full animate-spin' />
        <span className='ml-3 text-muted-foreground'>
          {isLoadingSchema ? 'Loading schema...' : 'Loading configuration...'}
        </span>
      </div>
    );
  }

  // Show error state if dynamic mode failed and no manual columns
  if (tableName && schemaError && !manualColumns) {
    return (
      <div className='flex items-center justify-center p-8'>
        <div className='text-center'>
          <p className='text-destructive mb-2'>Failed to load table schema</p>
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
        toolbarActions={
          <>
            <Button
              variant='outline'
              size='sm'
              className='gap-2'
              onClick={() => setIsReorderDialogOpen(true)}
            >
              <GripVertical className='h-4 w-4' />
              Reorder
            </Button>

            <Button
              variant='outline'
              size='sm'
              className='gap-2'
              onClick={() => setIsColumnConfigOpen(true)}
            >
              <Settings2 className='h-4 w-4' />
              Columns
            </Button>

            <FmColumnConfigModal
              open={isColumnConfigOpen}
              onOpenChange={setIsColumnConfigOpen}
              baseColumns={baseColumns}
              columnConfigs={initializedConfig.columns}
              onSaveConfiguration={handleSaveColumnConfig}
              onResetConfiguration={resetConfiguration}
            />

            <FmColumnReorderDialog
              open={isReorderDialogOpen}
              onOpenChange={setIsReorderDialogOpen}
              columns={initializedConfig.columns}
              baseColumns={baseColumns}
              recentlyMovedKey={recentlyMovedKey}
              onDragEnd={handleDragEnd}
            />
          </>
        }
      />
    </div>
  );
}
