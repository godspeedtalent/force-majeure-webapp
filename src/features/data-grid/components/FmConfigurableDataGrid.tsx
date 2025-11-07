import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/features/auth/services/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { FmDataGrid, DataGridColumn, DataGridAction } from './FmDataGrid';
import { useDataGridPersistence } from '../hooks/useDataGridPersistence';
import { Button } from '@/components/common/shadcn/button';
import { GripVertical } from 'lucide-react';
import { logger } from '@/shared/services/logger';
import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { toast } from 'sonner';
import { FmColumnReorderDialog } from './config/FmColumnReorderDialog';
import { FmColumnVisibilityDropdown } from './config/FmColumnVisibilityDropdown';

interface GridConfig {
  columns: {
    key: string;
    visible: boolean;
    order: number;
    width?: number;
  }[];
  pageSize?: number;
}

interface FmConfigurableDataGridProps<T> {
  gridId: string;
  data: T[];
  columns: DataGridColumn[];
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
  columns: baseColumns,
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
  const [recentlyMovedKey, setRecentlyMovedKey] = useState<string | null>(null);

  const { clearState } = useDataGridPersistence({ storageKey: gridId });

  // Load configuration from database
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
      logger.error('Error loading grid config:', error);
    } finally {
      setIsLoadingConfig(false);
    }
  };

  const saveConfig = async (newConfig: GridConfig) => {
    if (!user?.id) return;

    try {
      const { error } = await (supabase as any)
        .from('datagrid_configs')
        .upsert({
          user_id: user.id,
          grid_id: gridId,
          config: newConfig,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        logger.error('Error saving grid config:', error);
        toast.error('Failed to save column configuration');
      } else {
        toast.success('Column configuration saved');
      }
    } catch (error) {
      console.error('Error saving grid config:', error);
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
    const configMap = new Map(initializedConfig.columns.map(c => [c.key, c]));

    return baseColumns
      .map(col => {
        const colConfig = configMap.get(col.key);
        return {
          ...col,
          visible: colConfig?.visible ?? true,
          order: colConfig?.order ?? 0,
        };
      })
      .filter((col: any) => col.visible)
      .sort((a: any, b: any) => a.order - b.order);
  }, [baseColumns, initializedConfig]);

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

  const toggleColumnVisibility = (columnKey: string) => {
    const newConfig: GridConfig = {
      ...initializedConfig,
      columns: initializedConfig.columns.map(col =>
        col.key === columnKey ? { ...col, visible: !col.visible } : col
      ),
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
    toast.success(
      `Column "${baseColumns.find(c => c.key === columnKey)?.label}" hidden`
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
        console.error('Error resetting grid config:', error);
        toast.error('Failed to reset configuration');
      }
    }
  };

  if (isLoadingConfig) {
    return (
      <div className='flex items-center justify-center p-8'>
        <div className='h-8 w-8 border-2 border-fm-gold border-t-transparent rounded-full animate-spin' />
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
        onUpdate={onUpdate}
        onCreate={onCreate}
        onCreateButtonClick={onCreateButtonClick}
        resourceName={resourceName}
        createButtonLabel={createButtonLabel}
        onHideColumn={hideColumn}
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

            <FmColumnVisibilityDropdown
              baseColumns={baseColumns}
              columnConfigs={initializedConfig.columns}
              onToggleVisibility={toggleColumnVisibility}
              onResetConfiguration={resetConfiguration}
              onClearFiltersAndSort={() => {
                clearState();
                toast.success('Filters and sorting cleared');
              }}
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
