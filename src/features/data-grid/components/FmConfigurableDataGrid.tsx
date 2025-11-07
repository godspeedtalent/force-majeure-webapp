import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/services/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { FmDataGrid, DataGridColumn, DataGridAction } from './FmDataGrid';
import { Button } from '@/components/common/shadcn/button';
import { Settings2, Eye, EyeOff, GripVertical, RotateCcw, ArrowUp, ArrowDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/common/shadcn/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/common/shadcn/dialog';
import { toast } from 'sonner';
import { cn } from '@/shared/utils/utils';

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
  gridId: string; // Unique identifier for this grid instance
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

/**
 * Configurable Data Grid with persistent column management
 * 
 * Features:
 * - Drag and drop column reordering
 * - Show/hide columns
 * - Saves configuration to database per user
 * - Auto-loads saved configuration on mount
 */
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
        // PGRST116 is "not found" which is ok
        console.error('Error loading grid config:', error);
      }

      if (configData?.config) {
        setConfig(configData.config as GridConfig);
      }
    } catch (error) {
      console.error('Error loading grid config:', error);
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
        console.error('Error saving grid config:', error);
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
    const configMap = new Map(
      initializedConfig.columns.map((c) => [c.key, c])
    );

    return baseColumns
      .map((col) => {
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

  const moveColumn = (columnKey: string, direction: 'up' | 'down') => {
    const currentIndex = initializedConfig.columns.findIndex((c) => c.key === columnKey);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= initializedConfig.columns.length) return;

    const reorderedColumns = [...initializedConfig.columns];
    const [movedColumn] = reorderedColumns.splice(currentIndex, 1);
    reorderedColumns.splice(newIndex, 0, movedColumn);

    const newConfig: GridConfig = {
      ...initializedConfig,
      columns: reorderedColumns.map((col, index) => ({
        ...col,
        order: index,
      })),
    };

    setConfig(newConfig);
    saveConfig(newConfig);
  };

  const toggleColumnVisibility = (columnKey: string) => {
    const newConfig: GridConfig = {
      ...initializedConfig,
      columns: initializedConfig.columns.map((col) =>
        col.key === columnKey
          ? { ...col, visible: !col.visible }
          : col
      ),
    };

    setConfig(newConfig);
    saveConfig(newConfig);
  };

  const hideColumn = (columnKey: string) => {
    const newConfig: GridConfig = {
      ...initializedConfig,
      columns: initializedConfig.columns.map((col) =>
        col.key === columnKey
          ? { ...col, visible: false }
          : col
      ),
    };

    setConfig(newConfig);
    saveConfig(newConfig);
    toast.success(`Column "${baseColumns.find(c => c.key === columnKey)?.label}" hidden`);
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
          console.error('Error resetting grid config:', error);
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
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 border-2 border-fm-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Column Configuration Toolbar */}
      <div className="flex items-center justify-end gap-2">
        <Dialog open={isReorderDialogOpen} onOpenChange={setIsReorderDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <GripVertical className="h-4 w-4" />
              Reorder
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Reorder Columns</DialogTitle>
              <DialogDescription>
                Change the order of columns using the up and down buttons
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {initializedConfig.columns.map((colConfig, index) => {
                const column = baseColumns.find((c) => c.key === colConfig.key);
                if (!column) return null;

                return (
                  <div
                    key={colConfig.key}
                    className={cn(
                      "flex items-center justify-between p-2 rounded border",
                      colConfig.visible ? "bg-background" : "bg-muted/50 opacity-60"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{column.label}</span>
                      {!colConfig.visible && (
                        <span className="text-xs text-muted-foreground">(Hidden)</span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveColumn(colConfig.key, 'up')}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveColumn(colConfig.key, 'down')}
                        disabled={index === initializedConfig.columns.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Settings2 className="h-4 w-4" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {baseColumns.map((col) => {
              const isVisible = initializedConfig.columns.find(
                (c) => c.key === col.key
              )?.visible ?? true;

              return (
                <DropdownMenuCheckboxItem
                  key={col.key}
                  checked={isVisible}
                  onCheckedChange={() => toggleColumnVisibility(col.key)}
                >
                  <div className="flex items-center gap-2">
                    {isVisible ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4 opacity-50" />
                    )}
                    {col.label}
                  </div>
                </DropdownMenuCheckboxItem>
              );
            })}
            <DropdownMenuSeparator />
            <Button
              variant="ghost"
              size="sm"
              onClick={resetConfiguration}
              className="w-full justify-start text-xs"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Default
            </Button>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Data Grid */}
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
      />
    </div>
  );
}
