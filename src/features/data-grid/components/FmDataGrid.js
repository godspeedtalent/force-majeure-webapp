import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useMemo, useRef, useCallback, } from 'react';
import { useTranslation } from 'react-i18next';
import { Table, TableBody, TableCell, TableRow } from '@/components/common/shadcn/table';
import { toast } from 'sonner';
import { cn } from '@/shared';
import { useDataGridKeyboardNav } from '../hooks/useDataGridKeyboardNav';
import { useDataGridVirtualization } from '../hooks/useDataGridVirtualization';
import { useDataGridState } from '../hooks/useDataGridState';
import { useDataGridSelection } from '../hooks/useDataGridSelection';
import { useDataGridFilters } from '../hooks/useDataGridFilters';
import { useDataGridUI } from '../hooks/useDataGridUI';
import { FmDataGridExportDialog } from './FmDataGridExportDialog';
import { FmDataGridGroupDialog } from './FmDataGridGroupDialog';
import { FmBulkEditDialog } from './FmBulkEditDialog';
import { exportData } from '../utils/dataExport';
import { groupData, flattenGroupedData, toggleGroupExpanded, } from '../utils/grouping';
import { FmDataGridToolbar } from './table/FmDataGridToolbar';
import { FmDataGridHeader } from './table/FmDataGridHeader';
import { FmDataGridRow, FmDataGridGroupRow } from './table/FmDataGridRow';
import { FmDataGridNewRow } from './table/FmDataGridNewRow';
import { FmDataGridPagination } from './table/FmDataGridPagination';
import { FmDataGridBatchDeleteDialog } from './table/FmDataGridDialogs';
export function FmDataGrid({ data, columns, actions = [], contextMenuActions = [], loading = false, pageSize = 10, className, onUpdate, onCreate, onCreateButtonClick, onBatchDelete, resourceName = 'Resource', createButtonLabel, onHideColumn, onColumnReorder, onToggleFreeze, toolbarActions, enableVirtualization = true, estimateRowSize = 48, enableExport = true, exportFilename, }) {
    const { t } = useTranslation('common');
    // Custom hooks for state management
    const gridState = useDataGridState({ dataLength: data.length });
    const selection = useDataGridSelection();
    const filters = useDataGridFilters({ data, columns });
    const ui = useDataGridUI();
    // Column Resize State
    const [columnWidths, setColumnWidths] = useState({});
    const [resizingColumn, setResizingColumn] = useState(null);
    const resizeStartX = useRef(0);
    const resizeStartWidth = useRef(0);
    // Export/Group/Bulk Edit State
    const [groupConfig, setGroupConfig] = useState(null);
    const [groupedRows, setGroupedRows] = useState([]);
    const [expandedGroups, setExpandedGroups] = useState(new Set());
    // Drag Select State (kept local as it's UI-specific and temporary)
    const dragTimerRef = useRef(null);
    const rowRefs = useRef(new Map());
    // Get filtered and sorted data from filters hook
    const { filteredData } = filters;
    // Paginate data
    const paginatedData = useMemo(() => {
        const startIndex = (gridState.currentPage - 1) * pageSize;
        return filteredData.slice(startIndex, startIndex + pageSize);
    }, [filteredData, gridState.currentPage, pageSize]);
    const totalPages = Math.ceil(filteredData.length / pageSize);
    // Get display data (grouped or regular)
    const displayData = useMemo(() => {
        if (groupConfig && groupedRows.length > 0) {
            return flattenGroupedData(groupedRows);
        }
        return paginatedData.map(row => ({ type: 'data', row, depth: 0 }));
    }, [groupConfig, groupedRows, paginatedData]);
    // Keyboard navigation
    const { handleTableKeyDown, getFocusableCellProps } = useDataGridKeyboardNav({
        rows: paginatedData,
        columns,
        isEditing: !!gridState.editingCell,
        editingCell: gridState.editingCell,
        onStartEditing: (rowIndex, columnKey) => {
            const row = paginatedData[rowIndex];
            if (row) {
                const currentValue = row[columnKey];
                handleCellEdit(rowIndex, columnKey, currentValue);
            }
        },
        onStopEditing: () => gridState.setEditingCell(null),
    });
    // Virtualization
    const { parentRef, virtualRows, totalSize, isEnabled: isVirtualized, } = useDataGridVirtualization({
        rowCount: paginatedData.length,
        estimateSize: estimateRowSize,
        enabled: enableVirtualization,
    });
    // Handlers
    const handleSort = (columnKey) => {
        gridState.handleSort(columnKey);
    };
    const handleSelectAll = (checked) => {
        selection.handleSelectAll(checked, paginatedData.length, gridState.currentPage, pageSize);
    };
    const handleColumnFilter = (columnKey, value) => {
        filters.handleColumnFilter(columnKey, value);
        gridState.setCurrentPage(1);
    };
    const clearFilters = () => {
        filters.clearFilters();
        gridState.setCurrentPage(1);
    };
    const handleCellEdit = (rowIndex, columnKey, currentValue) => {
        gridState.startEditing(rowIndex, columnKey, currentValue);
    };
    const handleCellSave = async (row, columnKey, overrideValue) => {
        if (!onUpdate || !gridState.editingCell)
            return;
        const column = columns.find(col => col.key === columnKey);
        let newValue = overrideValue !== undefined ? overrideValue : gridState.editValue;
        const oldValue = row[columnKey];
        // Type handling
        if (column?.type === 'boolean') {
            newValue = overrideValue !== undefined ? overrideValue : (typeof gridState.editValue === 'boolean' ? gridState.editValue : gridState.editValue === 'true');
        }
        else if (column?.type === 'number') {
            if (!newValue || newValue.toString().trim() === '')
                newValue = '0';
            if (parseFloat(newValue) === parseFloat(oldValue?.toString() || '0')) {
                gridState.setEditingCell(null);
                return;
            }
        }
        else {
            if (!newValue || newValue.toString().trim() === '' || newValue === oldValue?.toString()) {
                gridState.setEditingCell(null);
                return;
            }
        }
        const displayName = row['name'] || resourceName;
        const loadingToast = toast.loading(t('dataGrid.updating', { name: displayName }));
        try {
            await onUpdate(row, columnKey, newValue);
            toast.dismiss(loadingToast);
            toast.success(t('dataGrid.updated', { name: displayName }));
            gridState.setEditingCell(null);
        }
        catch (error) {
            toast.dismiss(loadingToast);
            toast.error(t('dataGrid.updateFailed', { name: displayName }));
        }
    };
    const handleSaveNewRow = async () => {
        if (!onCreate)
            return;
        const processedData = { ...gridState.newRowData };
        columns.forEach(col => {
            if (col.type === 'number') {
                const value = processedData[col.key];
                if (!value || (typeof value === 'string' && value.trim() === '')) {
                    processedData[col.key] = 0;
                }
            }
        });
        const requiredColumns = columns.filter(col => col.required);
        const missingFields = requiredColumns.filter(col => !processedData[col.key]);
        if (missingFields.length > 0) {
            toast.error(t('dataGrid.missingRequiredFields'));
            return;
        }
        const loadingToast = toast.loading(t('dataGrid.creating', { resourceName }));
        try {
            await onCreate(processedData);
            toast.dismiss(loadingToast);
            toast.success(t('dataGrid.createdSuccessfully', { resourceName }));
            gridState.stopCreating();
        }
        catch (error) {
            toast.dismiss(loadingToast);
            toast.error(t('dataGrid.createFailed', { resourceName }));
        }
    };
    const handleBatchDelete = async () => {
        if (!onBatchDelete)
            return;
        ui.startBatchDelete();
        const selectedRowsData = filteredData.filter((_, idx) => selection.selectedRows.has(idx));
        const loadingToast = toast.loading(t('dataGrid.deletingCount', {
            count: selectedRowsData.length,
            resourceName: selectedRowsData.length !== 1 ? `${resourceName}s` : resourceName
        }));
        try {
            await onBatchDelete(selectedRowsData);
            toast.dismiss(loadingToast);
            toast.success(t('dataGrid.success'));
            selection.clearSelection();
            ui.closeBatchDeleteDialog();
        }
        catch (error) {
            toast.dismiss(loadingToast);
            toast.error(t('dataGrid.deleteFailed'));
        }
        finally {
            ui.stopBatchDelete();
        }
    };
    const handleExport = (selectedColumns, format) => {
        const filename = exportFilename || resourceName.toLowerCase().replace(/\s+/g, '-');
        exportData(filteredData, columns, selectedColumns, format, filename);
        toast.success(t('dataGrid.exportSuccessful'));
    };
    const handleApplyGrouping = (config) => {
        setGroupConfig(config);
        const grouped = groupData(filteredData, config, columns);
        setGroupedRows(grouped);
        const allGroupKeys = grouped.map(g => g.groupValue);
        setExpandedGroups(new Set(allGroupKeys));
        gridState.setCurrentPage(1);
    };
    const handleClearGrouping = () => {
        setGroupConfig(null);
        setGroupedRows([]);
        setExpandedGroups(new Set());
    };
    const handleToggleGroup = (groupValue) => {
        const updated = toggleGroupExpanded(groupedRows, groupValue);
        setGroupedRows(updated);
        setExpandedGroups(prev => {
            const next = new Set(prev);
            if (next.has(groupValue))
                next.delete(groupValue);
            else
                next.add(groupValue);
            return next;
        });
    };
    const handleBulkEdit = async (updates) => {
        if (!onUpdate)
            return;
        const selectedRowsData = filteredData.filter((_, idx) => selection.selectedRows.has(idx));
        const loadingToast = toast.loading(t('dataGrid.updatingRows', { count: selectedRowsData.length }));
        try {
            await Promise.all(selectedRowsData.map(row => onUpdate({ ...row, ...updates })));
            toast.dismiss(loadingToast);
            toast.success(t('dataGrid.bulkEditSuccessful'));
            selection.clearSelection();
        }
        catch (error) {
            toast.dismiss(loadingToast);
            toast.error(t('dataGrid.bulkEditFailed'));
            throw error;
        }
    };
    // Column resizing
    const handleResizeStart = (columnKey, e) => {
        e.preventDefault();
        e.stopPropagation();
        setResizingColumn(columnKey);
        resizeStartX.current = e.clientX;
        resizeStartWidth.current = columnWidths[columnKey] || 150;
    };
    const handleResizeMove = useCallback((e) => {
        if (!resizingColumn)
            return;
        const diff = e.clientX - resizeStartX.current;
        const newWidth = Math.max(80, resizeStartWidth.current + diff);
        setColumnWidths(prev => ({ ...prev, [resizingColumn]: newWidth }));
    }, [resizingColumn]);
    const handleResizeEnd = useCallback(() => setResizingColumn(null), []);
    useEffect(() => {
        if (resizingColumn) {
            document.addEventListener('mousemove', handleResizeMove);
            document.addEventListener('mouseup', handleResizeEnd);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
            return () => {
                document.removeEventListener('mousemove', handleResizeMove);
                document.removeEventListener('mouseup', handleResizeEnd);
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            };
        }
        return undefined;
    }, [resizingColumn, handleResizeMove, handleResizeEnd]);
    // Drag select handlers
    const handleMouseDown = (index, event) => {
        // Don't start drag mode if we're resizing columns
        if (resizingColumn) {
            return;
        }
        // Don't start drag mode if clicking on interactive elements
        const target = event.target;
        const isInteractiveElement = target.closest('button') ||
            target.closest('[role="combobox"]') ||
            target.closest('[data-radix-select-trigger]') ||
            target.closest('[data-radix-dropdown-menu-trigger]') ||
            target.closest('input') ||
            target.closest('textarea') ||
            target.closest('select') ||
            target.closest('[role="checkbox"]') ||
            target.closest('[role="switch"]') ||
            target.closest('a');
        if (isInteractiveElement) {
            // Don't start drag selection on interactive elements
            return;
        }
        const globalIndex = (gridState.currentPage - 1) * pageSize + index;
        dragTimerRef.current = setTimeout(() => {
            // Double-check we're not resizing before activating drag mode
            if (!resizingColumn) {
                selection.startDragSelect(globalIndex);
                gridState.setHoveredColumn(null);
                document.body.style.userSelect = 'none';
            }
        }, 300);
    };
    const handleMouseUp = () => {
        if (dragTimerRef.current) {
            clearTimeout(dragTimerRef.current);
            dragTimerRef.current = null;
        }
        selection.endDragSelect();
        document.body.style.userSelect = '';
    };
    const handleMouseEnterRow = (index) => {
        if (selection.isDragMode) {
            const globalIndex = (gridState.currentPage - 1) * pageSize + index;
            selection.updateDragSelect(globalIndex);
        }
    };
    useEffect(() => {
        return () => {
            if (dragTimerRef.current)
                clearTimeout(dragTimerRef.current);
        };
    }, []);
    const getDragBoxStyle = () => {
        if (!selection.isDragMode || selection.dragStartRow === null || selection.dragCurrentRow === null)
            return null;
        const startRowEl = rowRefs.current.get(selection.dragStartRow);
        const endRowEl = rowRefs.current.get(selection.dragCurrentRow);
        if (!startRowEl || !endRowEl)
            return null;
        const startRect = startRowEl.getBoundingClientRect();
        const endRect = endRowEl.getBoundingClientRect();
        const tableContainer = startRowEl.closest('.overflow-x-auto');
        const containerRect = tableContainer?.getBoundingClientRect();
        if (!containerRect)
            return null;
        const top = Math.min(startRect.top, endRect.top) - containerRect.top;
        const bottom = Math.max(startRect.bottom, endRect.bottom) - containerRect.top;
        const height = bottom - top;
        return {
            position: 'absolute',
            top: `${top}px`,
            left: 0,
            right: 0,
            height: `${height}px`,
            border: '2px solid rgb(var(--fm-gold))',
            borderRadius: '4px',
            pointerEvents: 'none',
            zIndex: 10,
            backgroundColor: 'rgba(var(--fm-gold), 0.05)',
        };
    };
    const isAllSelected = paginatedData.length > 0 &&
        paginatedData.every((_, idx) => selection.selectedRows.has((gridState.currentPage - 1) * pageSize + idx));
    const selectedRowsData = useMemo(() => filteredData.filter((_, idx) => selection.selectedRows.has(idx)), [filteredData, selection.selectedRows]);
    return (_jsxs("div", { className: cn('space-y-4', className), children: [_jsx(FmDataGridToolbar, { searchQuery: filters.searchQuery, onSearchChange: value => {
                    filters.setSearchQuery(value);
                    gridState.setCurrentPage(1);
                }, hasActiveFilters: filters.activeFilterCount > 0, onClearFilters: clearFilters, selectedCount: selection.selectedRows.size, onBatchDelete: onBatchDelete ? () => ui.openBatchDeleteDialog() : undefined, onBulkEdit: onUpdate && selection.selectedRows.size > 0 ? () => ui.openBulkEditDialog() : undefined, onExport: enableExport && filteredData.length > 0 ? () => ui.openExportDialog() : undefined, onGroupBy: filteredData.length > 0 ? () => ui.openGroupDialog() : undefined, onCreate: onCreate ? () => gridState.startCreating() : undefined, onCreateButtonClick: onCreateButtonClick, resourceName: resourceName, createButtonLabel: createButtonLabel, enableExport: enableExport, hasGrouping: !!groupConfig, totalDataCount: filteredData.length, toolbarActions: toolbarActions, isBatchDeleting: ui.isBatchDeleting }), _jsxs("div", { ref: parentRef, className: cn('rounded-none border border-border/50 bg-background/30 backdrop-blur-sm relative', isVirtualized ? 'overflow-auto' : 'overflow-x-auto overflow-y-visible'), style: isVirtualized ? { maxHeight: '600px' } : undefined, onKeyDown: handleTableKeyDown, role: 'grid', "aria-label": `${resourceName} data grid`, children: [_jsxs(Table, { className: 'relative', children: [_jsx(FmDataGridHeader, { columns: columns, hasActions: actions.length > 0, isAllSelected: isAllSelected, onSelectAll: handleSelectAll, sortColumn: gridState.sortColumn, sortDirection: gridState.sortDirection, onSort: handleSort, columnFilters: filters.columnFilters, onColumnFilter: handleColumnFilter, onHideColumn: onHideColumn, onColumnReorder: onColumnReorder, columnWidths: columnWidths, onResizeStart: handleResizeStart, onToggleFreeze: onToggleFreeze }), _jsxs(TableBody, { children: [isVirtualized && virtualRows.length > 0 && virtualRows[0].index > 0 && (_jsx(TableRow, { style: { height: `${virtualRows[0].start}px` }, children: _jsx(TableCell, { colSpan: columns.length + 1 + (actions.length > 0 ? 1 : 0) }) })), loading ? (_jsx(TableRow, { children: _jsx(TableCell, { colSpan: columns.length + 1 + (actions.length > 0 ? 1 : 0), className: 'h-32 text-center', children: _jsxs("div", { className: 'flex items-center justify-center gap-2', children: [_jsx("div", { className: 'h-4 w-4 border-2 border-fm-gold border-t-transparent rounded-full animate-spin' }), _jsx("span", { className: 'text-muted-foreground', children: t('dataGrid.loading') })] }) }) })) : displayData.length === 0 ? (_jsx(TableRow, { children: _jsx(TableCell, { colSpan: columns.length + 1 + (actions.length > 0 ? 1 : 0), className: 'h-32 text-center', children: _jsx("span", { className: 'text-muted-foreground', children: t('dataGrid.noDataFound') }) }) })) : (virtualRows.map(virtualRow => {
                                        const index = virtualRow.index;
                                        const displayRow = displayData[index];
                                        if (!displayRow)
                                            return null;
                                        // Group row
                                        if (displayRow.type === 'group') {
                                            const groupRow = displayRow;
                                            return (_jsx(FmDataGridGroupRow, { groupData: groupRow.groupData, columns: columns, hasActions: actions.length > 0, isExpanded: expandedGroups.has(groupRow.groupData.groupValue), onToggle: () => handleToggleGroup(groupRow.groupData.groupValue) }, `group-${groupRow.groupData.groupValue}`));
                                        }
                                        // Data row
                                        const row = displayRow.row;
                                        const globalIndex = (gridState.currentPage - 1) * pageSize + index;
                                        const isSelected = selection.selectedRows.has(globalIndex);
                                        const isEvenRow = index % 2 === 0;
                                        const hasContextMenuOpen = gridState.contextMenuOpenRow === globalIndex;
                                        const isDragSelected = selection.isDragMode &&
                                            selection.dragStartRow !== null &&
                                            selection.dragCurrentRow !== null &&
                                            globalIndex >= Math.min(selection.dragStartRow, selection.dragCurrentRow) &&
                                            globalIndex <= Math.max(selection.dragStartRow, selection.dragCurrentRow);
                                        return (_jsx(FmDataGridRow, { row: row, rowIndex: index, globalIndex: globalIndex, columns: columns, actions: actions, contextMenuActions: contextMenuActions, isSelected: isSelected, isEvenRow: isEvenRow, hasContextMenuOpen: hasContextMenuOpen, onSelectRow: (checked, shiftKey) => selection.handleRowSelect(globalIndex, checked, shiftKey), onMouseDown: e => handleMouseDown(index, e), onMouseUp: handleMouseUp, onMouseEnter: () => handleMouseEnterRow(index), setRowRef: el => {
                                                if (el)
                                                    rowRefs.current.set(globalIndex, el);
                                                else
                                                    rowRefs.current.delete(globalIndex);
                                            }, editingCell: gridState.editingCell, editValue: gridState.editValue, onEditValueChange: gridState.setEditValue, onStartEdit: handleCellEdit, onSaveEdit: handleCellSave, onCancelEdit: () => gridState.setEditingCell(null), onUpdate: onUpdate, isDragMode: selection.isDragMode, isDragSelected: isDragSelected, hoveredColumn: gridState.hoveredColumn, onSetHoveredColumn: gridState.setHoveredColumn, onContextMenuOpenChange: open => gridState.setContextMenuOpenRow(open ? globalIndex : null), isMultipleSelected: selection.selectedRows.size > 1, onUnselectAll: () => selection.clearSelection(), getFocusableCellProps: getFocusableCellProps, columnWidths: columnWidths }, globalIndex));
                                    })), isVirtualized && virtualRows.length > 0 && (_jsx(TableRow, { style: {
                                            height: `${totalSize - (virtualRows[virtualRows.length - 1]?.end || 0)}px`,
                                        }, children: _jsx(TableCell, { colSpan: columns.length + 1 + (actions.length > 0 ? 1 : 0) }) })), (onCreate || onCreateButtonClick) && (_jsx(FmDataGridNewRow, { columns: columns, hasActions: actions.length > 0, isCreating: gridState.isCreatingRow, newRowData: gridState.newRowData, onFieldChange: (columnKey, value) => gridState.setNewRowData((prev) => ({ ...prev, [columnKey]: value })), onSave: handleSaveNewRow, onCancel: () => gridState.stopCreating(), onStartCreating: onCreateButtonClick
                                            ? onCreateButtonClick
                                            : () => gridState.startCreating(), resourceName: resourceName }))] })] }), selection.isDragMode && getDragBoxStyle() && (_jsx("div", { style: getDragBoxStyle(), className: 'animate-in fade-in duration-100' }))] }), _jsx(FmDataGridPagination, { currentPage: gridState.currentPage, totalPages: totalPages, pageSize: pageSize, totalCount: filteredData.length, onPageChange: gridState.setCurrentPage }), _jsx(FmDataGridBatchDeleteDialog, { open: ui.showBatchDeleteDialog, onOpenChange: ui.closeBatchDeleteDialog, selectedRows: selectedRowsData, resourceName: resourceName, onConfirm: handleBatchDelete, isDeleting: ui.isBatchDeleting }), _jsx(FmDataGridExportDialog, { open: ui.showExportDialog, onOpenChange: ui.closeExportDialog, columns: columns, data: filteredData, filename: exportFilename || resourceName.toLowerCase().replace(/\s+/g, '-'), onExport: handleExport }), _jsx(FmDataGridGroupDialog, { open: ui.showGroupDialog, onOpenChange: ui.closeGroupDialog, columns: columns, currentGroupConfig: groupConfig, onApply: handleApplyGrouping, onClear: handleClearGrouping }), _jsx(FmBulkEditDialog, { open: ui.showBulkEditDialog, onOpenChange: ui.closeBulkEditDialog, columns: columns, selectedRows: selectedRowsData, onApply: handleBulkEdit })] }));
}
