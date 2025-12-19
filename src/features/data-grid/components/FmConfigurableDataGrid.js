import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/services/AuthContext';
import { supabase } from '@/shared';
import { FmDataGrid } from './FmDataGrid';
import { useTableSchema } from '../hooks/useTableSchema';
import { Button } from '@/components/common/shadcn/button';
import { GripVertical, Settings2 } from 'lucide-react';
import { logger } from '@/shared';
import { arrayMove } from '@dnd-kit/sortable';
import { toast } from 'sonner';
import { FmColumnReorderDialog } from './config/FmColumnReorderDialog';
import { FmColumnConfigModal } from './config/FmColumnConfigModal';
export function FmConfigurableDataGrid({ gridId, data, columns: manualColumns, tableName, excludeColumns, includeColumns, actions = [], contextMenuActions = [], loading = false, pageSize = 10, className, onUpdate, onCreate, onCreateButtonClick, resourceName = 'Resource', createButtonLabel, }) {
    const { t } = useTranslation('common');
    const { t: tToast } = useTranslation('toasts');
    const { user } = useAuth();
    const [config, setConfig] = useState(null);
    const [isLoadingConfig, setIsLoadingConfig] = useState(true);
    const [isReorderDialogOpen, setIsReorderDialogOpen] = useState(false);
    const [isColumnConfigOpen, setIsColumnConfigOpen] = useState(false);
    const [recentlyMovedKey, setRecentlyMovedKey] = useState(null);
    // NEW: Dynamic mode - fetch schema if tableName is provided
    const { columns: schemaColumns, isLoading: isLoadingSchema, error: schemaError, } = useTableSchema({
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
                description: schemaError.message,
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
                setConfig(configData.config);
            }
        }
        catch (error) {
            logger.error('Error loading grid config:', { error: error instanceof Error ? error.message : 'Unknown' });
        }
        finally {
            setIsLoadingConfig(false);
        }
    };
    const saveConfig = async (newConfig) => {
        if (!user?.id)
            return;
        try {
            const { error } = await supabase
                .from('datagrid_configs')
                .upsert({
                user_id: user.id,
                grid_id: gridId,
                config: newConfig,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'user_id,grid_id',
            });
            if (error) {
                logger.error('Error saving grid config:', error);
                toast.error(tToast('admin.columnSaveFailed'));
            }
            else {
                toast.success(tToast('admin.columnConfigSaved'));
            }
        }
        catch (error) {
            logger.error('Error saving grid config:', { error: error instanceof Error ? error.message : 'Unknown' });
            toast.error(tToast('admin.columnSaveFailed'));
        }
    };
    // Initialize config from base columns if not loaded
    const initializedConfig = useMemo(() => {
        if (config)
            return config;
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
            .filter((col) => col.visible)
            .sort((a, b) => a.order - b.order);
    }, [baseColumns, initializedConfig, data]);
    // Handle drag end
    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (!over || active.id === over.id)
            return;
        const oldIndex = initializedConfig.columns.findIndex(c => c.key === active.id);
        const newIndex = initializedConfig.columns.findIndex(c => c.key === over.id);
        const reorderedColumns = arrayMove(initializedConfig.columns, oldIndex, newIndex);
        const newConfig = {
            ...initializedConfig,
            columns: reorderedColumns.map((col, index) => ({
                ...col,
                order: index,
            })),
        };
        setConfig(newConfig);
        saveConfig(newConfig);
        setRecentlyMovedKey(active.id);
        setTimeout(() => setRecentlyMovedKey(null), 600);
    };
    // Save column configuration from modal
    const handleSaveColumnConfig = (configs) => {
        const newConfig = {
            ...initializedConfig,
            columns: configs,
        };
        setConfig(newConfig);
        saveConfig(newConfig);
    };
    const hideColumn = (columnKey) => {
        const newConfig = {
            ...initializedConfig,
            columns: initializedConfig.columns.map(col => col.key === columnKey ? { ...col, visible: false } : col),
        };
        setConfig(newConfig);
        saveConfig(newConfig);
        const columnLabel = baseColumns.find(c => c.key === columnKey)?.label;
        toast.success(t('dataGrid.columnHidden', { column: columnLabel }));
    };
    const handleColumnReorder = (fromIndex, toIndex) => {
        if (fromIndex === toIndex)
            return;
        // Get visible columns sorted by their current order
        const visibleColumns = initializedConfig.columns
            .filter(c => c.visible)
            .sort((a, b) => a.order - b.order);
        // Reorder using visual indices
        const reorderedColumns = arrayMove(visibleColumns, fromIndex, toIndex);
        // Create a map of key -> new order for visible columns
        const orderMap = new Map(reorderedColumns.map((col, index) => [col.key, index]));
        // Update all columns with new order
        const updatedColumns = initializedConfig.columns.map(col => {
            if (col.visible && orderMap.has(col.key)) {
                return { ...col, order: orderMap.get(col.key) };
            }
            // Keep hidden columns at the end with their relative order preserved
            if (!col.visible) {
                return { ...col, order: reorderedColumns.length + col.order };
            }
            return col;
        });
        const newConfig = {
            ...initializedConfig,
            columns: updatedColumns,
        };
        setConfig(newConfig);
        saveConfig(newConfig);
        // Visual feedback
        const movedColumn = reorderedColumns[toIndex];
        setRecentlyMovedKey(movedColumn.key);
        setTimeout(() => setRecentlyMovedKey(null), 600);
        toast.success(tToast('admin.columnOrderUpdated'));
    };
    const handleToggleFreeze = (columnKey) => {
        const currentCol = initializedConfig.columns.find(c => c.key === columnKey);
        const newConfig = {
            ...initializedConfig,
            columns: initializedConfig.columns.map(col => {
                const colConfig = col;
                return col.key === columnKey ? { ...colConfig, frozen: !colConfig.frozen } : colConfig;
            }),
        };
        setConfig(newConfig);
        saveConfig(newConfig);
        const column = baseColumns.find(c => c.key === columnKey);
        const isFrozen = !currentCol?.frozen;
        toast.success(isFrozen
            ? t('dataGrid.columnFrozen', { column: column?.label })
            : t('dataGrid.columnUnfrozen', { column: column?.label }));
    };
    const resetConfiguration = async () => {
        const defaultConfig = {
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
                }
                else {
                    toast.success(t('dataGrid.resetSuccess'));
                }
            }
            catch (error) {
                logger.error('Error resetting grid config:', { error: error instanceof Error ? error.message : 'Unknown' });
                toast.error(t('dataGrid.resetFailed'));
            }
        }
    };
    // Show loading state if config or schema is loading
    if (isLoadingConfig || (tableName && isLoadingSchema)) {
        return (_jsxs("div", { className: 'flex items-center justify-center p-8', children: [_jsx("div", { className: 'h-8 w-8 border-2 border-fm-gold border-t-transparent rounded-full animate-spin' }), _jsx("span", { className: 'ml-3 text-muted-foreground', children: isLoadingSchema ? t('dataGrid.loadingSchema') : t('dataGrid.loadingConfig') })] }));
    }
    // Show error state if dynamic mode failed and no manual columns
    if (tableName && schemaError && !manualColumns) {
        return (_jsx("div", { className: 'flex items-center justify-center p-8', children: _jsxs("div", { className: 'text-center', children: [_jsx("p", { className: 'text-destructive mb-2', children: t('dataGrid.schemaLoadFailed') }), _jsx("p", { className: 'text-sm text-muted-foreground', children: schemaError.message })] }) }));
    }
    return (_jsx("div", { className: 'space-y-2', children: _jsx(FmDataGrid, { data: data, columns: configuredColumns, actions: actions, contextMenuActions: contextMenuActions, loading: loading, pageSize: initializedConfig.pageSize ?? pageSize, className: className, onUpdate: onUpdate ? (item, columnKey, newValue) => onUpdate(item, columnKey || '', newValue) : undefined, onCreate: onCreate, onCreateButtonClick: onCreateButtonClick, resourceName: resourceName, createButtonLabel: createButtonLabel, onHideColumn: hideColumn, onColumnReorder: handleColumnReorder, onToggleFreeze: handleToggleFreeze, toolbarActions: _jsxs(_Fragment, { children: [_jsxs(Button, { variant: 'outline', size: 'sm', className: 'gap-2', onClick: () => setIsReorderDialogOpen(true), children: [_jsx(GripVertical, { className: 'h-4 w-4' }), t('dataGrid.reorder')] }), _jsxs(Button, { variant: 'outline', size: 'sm', className: 'gap-2', onClick: () => setIsColumnConfigOpen(true), children: [_jsx(Settings2, { className: 'h-4 w-4' }), t('dataGrid.columns')] }), _jsx(FmColumnConfigModal, { open: isColumnConfigOpen, onOpenChange: setIsColumnConfigOpen, baseColumns: baseColumns, columnConfigs: initializedConfig.columns, onSaveConfiguration: handleSaveColumnConfig, onResetConfiguration: resetConfiguration }), _jsx(FmColumnReorderDialog, { open: isReorderDialogOpen, onOpenChange: setIsReorderDialogOpen, columns: initializedConfig.columns, baseColumns: baseColumns, recentlyMovedKey: recentlyMovedKey, onDragEnd: handleDragEnd })] }) }) }));
}
