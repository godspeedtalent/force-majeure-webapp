import React, {
  useMemo,
  useRef,
  useEffect,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Table, TableBody, TableCell, TableRow } from '@/components/common/shadcn/table';
import { toast } from 'sonner';
import { cn, useIsMobile, handleError, logger } from '@/shared';
import { useDataGridKeyboardNav } from '../hooks/useDataGridKeyboardNav';
import { useDataGridVirtualization } from '../hooks/useDataGridVirtualization';
import { useDataGridState } from '../hooks/useDataGridState';
import { useDataGridSelection } from '../hooks/useDataGridSelection';
import { useDataGridFilters } from '../hooks/useDataGridFilters';
import { useDataGridUI } from '../hooks/useDataGridUI';
import { useDataGridColumnResize } from '../hooks/useDataGridColumnResize';
import { useDataGridScrollSync } from '../hooks/useDataGridScrollSync';
import { useDataGridGrouping } from '../hooks/useDataGridGrouping';
import { useDataGridUndo } from '../hooks/useDataGridUndo';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { FmDataGridExportDialog, ExportFormat } from './FmDataGridExportDialog';
import { FmDataGridGroupDialog } from './FmDataGridGroupDialog';
import { FmBulkEditDialog } from './FmBulkEditDialog';
import { exportData } from '../utils/dataExport';
import { isRelationField } from '../utils/dataGridRelations';
import { FmDataGridToolbar } from './table/FmDataGridToolbar';
import { FmDataGridHeader } from './table/FmDataGridHeader';
import { FmDataGridRow, FmDataGridGroupRow } from './table/FmDataGridRow';
import { FmDataGridNewRow } from './table/FmDataGridNewRow';
import { FmDataGridPagination } from './table/FmDataGridPagination';
import { FmDataGridBatchDeleteDialog } from './table/FmDataGridDialogs';
import { FmDataGridKeyboardShortcuts } from './FmDataGridKeyboardShortcuts';
import { ContextMenuAction } from '@/components/common/modals/FmCommonContextMenu';
import { FmMobileDataGrid } from './mobile';
import { FmDataGridRowSkeleton } from '@/components/common/feedback/FmDataGridRowSkeleton';

/**
 * Option for select-type columns
 */
export interface SelectOption {
  value: string;
  label: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface DataGridColumn<T = any> {
  key: string;
  label: string;
  description?: string; // Tooltip description shown on hover over the column header
  icon?: React.ReactNode; // Icon to display when column is too narrow
  sortable?: boolean;
  filterable?: boolean;
  editable?: boolean;
  readonly?: boolean;
  required?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
  isRelation?: boolean;
  cellClassName?: string; // Custom className for TableCell (e.g., p-0 for images)
  frozen?: boolean; // Pin column to left side (sticky)
  multiline?: boolean; // Use textarea for multiline text editing
  rows?: number; // Number of rows for multiline textarea (default: 3)
  type?:
    | 'text'
    | 'number'
    | 'email'
    | 'url'
    | 'date'
    | 'boolean'
    | 'created_date'
    | 'select';
  options?: SelectOption[]; // Options for select type columns
  /** Custom cell styling based on cell value - return additional class names */
  cellStyle?: (value: any, row: T) => string | undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DataGridAction<T = any> = ContextMenuAction<T>;

/** Pagination mode for the data grid */
export type PaginationMode = 'infinite' | 'paged';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface FmDataGridProps<T = any> {
  data: T[];
  columns: DataGridColumn<T>[];
  actions?: DataGridAction<T>[];
  contextMenuActions?: DataGridAction<T>[];
  loading?: boolean;
  pageSize?: number;
  className?: string;
  onUpdate?: (item: T, columnKey?: string, newValue?: any) => Promise<void>;
  onCreate?: (item: Partial<T>) => Promise<void>;
  onCreateButtonClick?: () => void;
  onBatchDelete?: (items: T[]) => Promise<void>;
  resourceName?: string;
  createButtonLabel?: string;
  onHideColumn?: (columnKey: string) => void;
  onColumnReorder?: (fromIndex: number, toIndex: number) => void;
  onToggleFreeze?: (columnKey: string) => void;
  toolbarActions?: React.ReactNode;
  enableVirtualization?: boolean;
  estimateRowSize?: number;
  enableExport?: boolean;
  exportFilename?: string;
  /** Show row numbers in the first column */
  showRowNumbers?: boolean;
  /** Pagination mode: 'infinite' (default) loads more as you scroll, 'paged' shows traditional pagination */
  paginationMode?: PaginationMode;
}

export function FmDataGrid<T extends Record<string, any>>({
  data,
  columns,
  actions = [],
  contextMenuActions = [],
  loading = false,
  pageSize = 25,
  className,
  onUpdate,
  onCreate,
  onCreateButtonClick,
  onBatchDelete,
  resourceName = 'Resource',
  createButtonLabel,
  onHideColumn,
  onColumnReorder,
  onToggleFreeze,
  toolbarActions,
  enableVirtualization = true,
  estimateRowSize = 48,
  enableExport = true,
  exportFilename,
  showRowNumbers = false,
  paginationMode = 'infinite',
}: FmDataGridProps<T>) {
  const { t } = useTranslation('common');
  const isMobile = useIsMobile();
  const isInfiniteScroll = paginationMode === 'infinite';

  // Custom hooks for state management - must be called before any conditional returns
  const gridState = useDataGridState({ dataLength: data.length });
  const selection = useDataGridSelection();
  const filters = useDataGridFilters({
    data,
    columns,
    sortColumn: gridState.sortColumn,
    sortDirection: gridState.sortDirection,
    sortSpecs: gridState.sortSpecs,
  });
  const ui = useDataGridUI();

  // Column resize hook
  const { columnWidths, resizingColumn, handleResizeStart, autoFitColumn } = useDataGridColumnResize();

  // Grouping hook
  const grouping = useDataGridGrouping({
    data: filters.filteredData,
    columns,
    onPageReset: () => gridState.setCurrentPage(1),
  });

  // Undo hook for cell edits
  const undo = useDataGridUndo<T>({
    onUpdate,
  });

  // Scroll sync hook for sticky scrollbar
  const scrollSync = useDataGridScrollSync({
    deps: [data, columns, columnWidths],
  });

  // Get filtered and sorted data from filters hook (needed before infinite scroll)
  const { filteredData } = filters;

  // Infinite scroll hook
  const infiniteScroll = useInfiniteScroll({
    totalItems: filteredData.length,
    batchSize: pageSize,
    enabled: isInfiniteScroll,
  });

  // Drag Select State (kept local as it's UI-specific and temporary)
  // IMPORTANT: All hooks must be called before any conditional returns (React rules of hooks)
  const dragTimerRef = useRef<NodeJS.Timeout | null>(null);
  const rowRefs = useRef<Map<number, HTMLTableRowElement>>(new Map());

  // Combine actions and contextMenuActions for mobile view
  const mobileActions = useMemo(() => {
    // If no explicit actions, use contextMenuActions as actions for mobile
    if (actions.length === 0 && contextMenuActions.length > 0) {
      return contextMenuActions;
    }
    // If both exist, combine them (actions first, then context menu actions)
    if (actions.length > 0 && contextMenuActions.length > 0) {
      return [...actions, ...contextMenuActions];
    }
    return actions;
  }, [actions, contextMenuActions]);

  // Paginate/slice data based on pagination mode
  const paginatedData = useMemo(() => {
    if (isInfiniteScroll) {
      // Infinite scroll: show items up to visibleCount
      return filteredData.slice(0, infiniteScroll.visibleCount);
    } else {
      // Paged: traditional pagination
      const startIndex = (gridState.currentPage - 1) * pageSize;
      return filteredData.slice(startIndex, startIndex + pageSize);
    }
  }, [filteredData, isInfiniteScroll, infiniteScroll.visibleCount, gridState.currentPage, pageSize]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  // Get display data (grouped or regular)
  const displayData = useMemo(() => {
    return grouping.getDisplayData(paginatedData);
  }, [grouping, paginatedData]);

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
        gridState.startEditing(rowIndex, columnKey, currentValue);
      }
    },
    onStopEditing: () => gridState.setEditingCell(null),
    copySuccessMessage: t('dataGrid.cellCopied'),
  });

  // Virtualization
  const {
    parentRef,
    virtualRows,
    totalSize,
    isEnabled: isVirtualized,
  } = useDataGridVirtualization({
    rowCount: paginatedData.length,
    estimateSize: estimateRowSize,
    enabled: enableVirtualization,
  });

  // Render mobile view on small screens (after all hooks)
  if (isMobile) {
    return (
      <FmMobileDataGrid
        data={data}
        columns={columns}
        actions={mobileActions}
        loading={loading}
        className={className}
        onUpdate={onUpdate}
        resourceName={resourceName}
        pageSize={pageSize}
        paginationMode={paginationMode}
      />
    );
  }


  // Handlers
  const handleSort = (columnKey: string, addToMultiSort = false) => {
    gridState.handleSort(columnKey, addToMultiSort);
  };

  const handleSelectAll = (checked: boolean) => {
    selection.handleSelectAll(checked, paginatedData.length, gridState.currentPage, pageSize);
  };

  const handleColumnFilter = (columnKey: string, value: string, operator?: import('../hooks/useDataGridFilters').FilterOperator) => {
    filters.handleColumnFilter(columnKey, value, operator);
    gridState.setCurrentPage(1);
  };

  const clearFilters = () => {
    filters.clearFilters();
    gridState.setCurrentPage(1);
  };

  const handleCellEdit = (rowIndex: number, columnKey: string, currentValue: any) => {
    gridState.startEditing(rowIndex, columnKey, currentValue);
  };

  const handleCellSave = async (
    row: T,
    columnKey: string,
    overrideValue?: any
  ) => {
    // Debug logging
    if (columnKey === 'organization_id') {
      logger.info('handleCellSave called', {
        columnKey,
        overrideValue,
        editValue: gridState.editValue,
        hasOnUpdate: !!onUpdate,
        editingCell: gridState.editingCell,
        source: 'FmDataGrid',
      });
    }

    // For relation fields with override value, don't require editingCell to still be set
    // (the dropdown may have closed before onComplete fires)
    const isRelationWithValue = isRelationField(columnKey) && overrideValue === undefined && gridState.editValue;

    if (!onUpdate) {
      if (columnKey === 'organization_id') {
        logger.info('handleCellSave returning early - no onUpdate', { source: 'FmDataGrid' });
      }
      return;
    }

    // Only check editingCell for non-relation fields or if no value is being saved
    if (!gridState.editingCell && !isRelationWithValue) {
      if (columnKey === 'organization_id') {
        logger.info('handleCellSave returning early - no editingCell', { source: 'FmDataGrid' });
      }
      return;
    }

    const column = columns.find(col => col.key === columnKey);
    let newValue = overrideValue !== undefined ? overrideValue : gridState.editValue;
    const oldValue = row[columnKey];

    // Type handling
    if (column?.type === 'boolean') {
      newValue = overrideValue !== undefined ? overrideValue : (typeof gridState.editValue === 'boolean' ? gridState.editValue : gridState.editValue === 'true');
    } else if (column?.type === 'number') {
      if (!newValue || newValue.toString().trim() === '') newValue = '0';
      if (parseFloat(newValue) === parseFloat(oldValue?.toString() || '0')) {
        gridState.setEditingCell(null);
        return;
      }
    } else {
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

      // Show success toast with undo action
      undo.showSuccessWithUndo(
        t('dataGrid.updated', { name: displayName }),
        {
          type: 'cell_update',
          row,
          columnKey,
          oldValue,
          newValue,
          displayName: String(displayName),
        }
      );

      gridState.setEditingCell(null);
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(t('dataGrid.updateFailed', { name: displayName }));
    }
  };

  const handleSaveNewRow = async () => {
    if (!onCreate) return;

    const processedData: Record<string, unknown> = { ...gridState.newRowData };
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
      await onCreate(processedData as Partial<T>);
      toast.dismiss(loadingToast);
      toast.success(t('dataGrid.createdSuccessfully', { resourceName }));
      gridState.stopCreating();
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(t('dataGrid.createFailed', { resourceName }));
    }
  };

  const handleBatchDelete = async () => {
    if (!onBatchDelete) return;

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
    } catch (error: unknown) {
      toast.dismiss(loadingToast);
      handleError(error, {
        title: t('dataGrid.deleteFailed'),
        context: 'FmDataGrid.handleBatchDelete',
      });
    } finally {
      ui.stopBatchDelete();
    }
  };

  const handleExport = (selectedColumns: string[], format: ExportFormat) => {
    const filename = exportFilename || resourceName.toLowerCase().replace(/\s+/g, '-');
    exportData(filteredData, columns, selectedColumns, format, filename);
    toast.success(t('dataGrid.exportSuccessful'));
  };


  const handleBulkEdit = async (updates: Partial<T>) => {
    if (!onUpdate) return;

    const selectedRowsData = filteredData.filter((_, idx) => selection.selectedRows.has(idx));
    const loadingToast = toast.loading(t('dataGrid.updatingRows', { count: selectedRowsData.length }));

    try {
      await Promise.all(selectedRowsData.map(row => onUpdate({ ...row, ...updates })));
      toast.dismiss(loadingToast);
      toast.success(t('dataGrid.bulkEditSuccessful'));
      selection.clearSelection();
    } catch (error: unknown) {
      toast.dismiss(loadingToast);
      handleError(error, {
        title: t('dataGrid.bulkEditFailed'),
        context: 'FmDataGrid.handleBulkEdit',
      });
      throw error;
    }
  };


  // Drag select handlers
  const handleMouseDown = (index: number, event: React.MouseEvent) => {
    // Don't start drag mode on right-click (context menu)
    if (event.button === 2) {
      return;
    }

    // Don't start drag mode if we're resizing columns
    if (resizingColumn) {
      return;
    }

    // Don't start drag mode if clicking on interactive elements
    const target = event.target as HTMLElement;
    const isInteractiveElement =
      target.closest('button') ||
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

  const handleMouseEnterRow = (index: number) => {
    if (selection.isDragMode) {
      const globalIndex = (gridState.currentPage - 1) * pageSize + index;
      selection.updateDragSelect(globalIndex);
    }
  };

  useEffect(() => {
    return () => {
      if (dragTimerRef.current) clearTimeout(dragTimerRef.current);
    };
  }, []);

  const getDragBoxStyle = (): React.CSSProperties | null => {
    if (!selection.isDragMode || selection.dragStartRow === null || selection.dragCurrentRow === null) return null;

    const startRowEl = rowRefs.current.get(selection.dragStartRow);
    const endRowEl = rowRefs.current.get(selection.dragCurrentRow);
    if (!startRowEl || !endRowEl) return null;

    const startRect = startRowEl.getBoundingClientRect();
    const endRect = endRowEl.getBoundingClientRect();
    const tableContainer = startRowEl.closest('.overflow-x-auto');
    const containerRect = tableContainer?.getBoundingClientRect();
    if (!containerRect) return null;

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

  const isAllSelected =
    paginatedData.length > 0 &&
    paginatedData.every((_, idx) => selection.selectedRows.has((gridState.currentPage - 1) * pageSize + idx));

  const selectedRowsData = useMemo(
    () => filteredData.filter((_, idx) => selection.selectedRows.has(idx)),
    [filteredData, selection.selectedRows]
  );

  return (
    <div className={cn('space-y-4', className)}>
      {/* Toolbar */}
      <FmDataGridToolbar
        searchQuery={filters.searchQuery}
        onSearchChange={value => {
          filters.setSearchQuery(value);
          gridState.setCurrentPage(1);
        }}
        hasActiveFilters={filters.activeFilterCount > 0}
        onClearFilters={clearFilters}
        selectedCount={selection.selectedRows.size}
        onBatchDelete={onBatchDelete ? () => ui.openBatchDeleteDialog() : undefined}
        onBulkEdit={onUpdate && selection.selectedRows.size > 0 ? () => ui.openBulkEditDialog() : undefined}
        onExport={enableExport && filteredData.length > 0 ? () => ui.openExportDialog() : undefined}
        onGroupBy={filteredData.length > 0 ? () => ui.openGroupDialog() : undefined}
        onCreate={onCreate ? () => gridState.startCreating() : undefined}
        onCreateButtonClick={onCreateButtonClick}
        resourceName={resourceName}
        createButtonLabel={createButtonLabel}
        enableExport={enableExport}
        hasGrouping={!!grouping.groupConfig}
        totalDataCount={filteredData.length}
        toolbarActions={toolbarActions}
        isBatchDeleting={ui.isBatchDeleting}
      />

      {/* Table */}
      <div
        ref={el => {
          scrollSync.setTableContainerRef(el);
          if (parentRef) parentRef.current = el;
        }}
        className={cn(
          'rounded-none border border-border/50 bg-background/30 backdrop-blur-sm relative',
          isVirtualized || isInfiniteScroll ? 'overflow-auto' : 'overflow-x-auto overflow-y-visible',
          // Hide native scrollbar when using sticky scrollbar
          scrollSync.showStickyScrollbar && !isVirtualized && !isInfiniteScroll && 'scrollbar-hide'
        )}
        style={isVirtualized || isInfiniteScroll ? { maxHeight: '600px' } : undefined}
        onKeyDown={handleTableKeyDown}
        onScroll={(e) => {
          scrollSync.handleTableScroll(e);
          infiniteScroll.handleScroll(e);
        }}
        role='grid'
        aria-label={`${resourceName} data grid`}
      >
        <Table className='relative'>
          <FmDataGridHeader
            columns={columns}
            hasActions={actions.length > 0}
            isAllSelected={isAllSelected}
            onSelectAll={handleSelectAll}
            sortColumn={gridState.sortColumn}
            sortDirection={gridState.sortDirection}
            onSort={handleSort}
            columnFilters={filters.columnFilters}
            onColumnFilter={handleColumnFilter}
            onHideColumn={onHideColumn}
            onColumnReorder={onColumnReorder}
            columnWidths={columnWidths}
            onResizeStart={handleResizeStart}
            onAutoFitColumn={autoFitColumn}
            onToggleFreeze={onToggleFreeze}
            getSortIndex={gridState.getSortIndex}
            getSortDirection={gridState.getSortDirection}
            getColumnFilter={filters.getColumnFilter}
            showRowNumbers={showRowNumbers}
          />
          <TableBody>
            {/* Virtual scrolling top spacer */}
            {isVirtualized && virtualRows.length > 0 && virtualRows[0].index > 0 && (
              <TableRow style={{ height: `${virtualRows[0].start}px` }}>
                <TableCell colSpan={columns.length + 1 + (actions.length > 0 ? 1 : 0)} />
              </TableRow>
            )}

            {loading ? (
              // Skeleton loading rows
              <>
                {Array.from({ length: Math.min(pageSize, 10) }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    <TableCell colSpan={columns.length + 1 + (actions.length > 0 ? 1 : 0)} className='p-0'>
                      <FmDataGridRowSkeleton columns={columns.length} />
                    </TableCell>
                  </TableRow>
                ))}
              </>
            ) : displayData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 1 + (actions.length > 0 ? 1 : 0)}
                  className='h-32 text-center'
                >
                  <span className='text-muted-foreground'>{t('dataGrid.noDataFound')}</span>
                </TableCell>
              </TableRow>
            ) : (
              virtualRows.map(virtualRow => {
                const index = virtualRow.index;
                const displayRow = displayData[index];
                if (!displayRow) return null;

                // Group row
                if (displayRow.type === 'group') {
                  const groupRow = displayRow as any;
                  return (
                    <FmDataGridGroupRow
                      key={`group-${groupRow.groupData.groupValue}`}
                      groupData={groupRow.groupData}
                      columns={columns}
                      hasActions={actions.length > 0}
                      isExpanded={grouping.expandedGroups.has(groupRow.groupData.groupValue)}
                      onToggle={() => grouping.handleToggleGroup(groupRow.groupData.groupValue)}
                    />
                  );
                }

                // Data row
                const row = displayRow.row as T;
                const globalIndex = (gridState.currentPage - 1) * pageSize + index;
                const isSelected = selection.selectedRows.has(globalIndex);
                const isEvenRow = index % 2 === 0;
                const hasContextMenuOpen = gridState.contextMenuOpenRow === globalIndex;

                const isDragSelected =
                  selection.isDragMode &&
                  selection.dragStartRow !== null &&
                  selection.dragCurrentRow !== null &&
                  globalIndex >= Math.min(selection.dragStartRow, selection.dragCurrentRow) &&
                  globalIndex <= Math.max(selection.dragStartRow, selection.dragCurrentRow);

                return (
                  <FmDataGridRow
                    key={globalIndex}
                    row={row}
                    rowIndex={index}
                    globalIndex={globalIndex}
                    columns={columns}
                    actions={actions}
                    contextMenuActions={contextMenuActions}
                    isSelected={isSelected}
                    isEvenRow={isEvenRow}
                    hasContextMenuOpen={hasContextMenuOpen}
                    onSelectRow={(checked: boolean, shiftKey: boolean) => selection.handleRowSelect(globalIndex, checked, shiftKey)}
                    onMouseDown={e => handleMouseDown(index, e)}
                    onMouseUp={handleMouseUp}
                    onMouseEnter={() => handleMouseEnterRow(index)}
                    setRowRef={el => {
                      if (el) rowRefs.current.set(globalIndex, el);
                      else rowRefs.current.delete(globalIndex);
                    }}
                    editingCell={gridState.editingCell}
                    editValue={gridState.editValue}
                    onEditValueChange={gridState.setEditValue}
                    onStartEdit={handleCellEdit}
                    onSaveEdit={handleCellSave}
                    onCancelEdit={() => gridState.setEditingCell(null)}
                    onUpdate={onUpdate}
                    isDragMode={selection.isDragMode}
                    isDragSelected={isDragSelected}
                    hoveredColumn={gridState.hoveredColumn}
                    onSetHoveredColumn={gridState.setHoveredColumn}
                    onContextMenuOpenChange={open => gridState.setContextMenuOpenRow(open ? globalIndex : null)}
                    isMultipleSelected={selection.selectedRows.size > 1}
                    onUnselectAll={() => selection.clearSelection()}
                    getFocusableCellProps={getFocusableCellProps}
                    columnWidths={columnWidths}
                    showRowNumbers={showRowNumbers}
                    onColumnFilter={handleColumnFilter}
                    getColumnFilter={filters.getColumnFilter}
                    clearColumnFilter={filters.clearColumnFilter}
                  />
                );
              })
            )}

            {/* Virtual scrolling bottom spacer */}
            {isVirtualized && virtualRows.length > 0 && (
              <TableRow
                style={{
                  height: `${totalSize - (virtualRows[virtualRows.length - 1]?.end || 0)}px`,
                }}
              >
                <TableCell colSpan={columns.length + 1 + (actions.length > 0 ? 1 : 0)} />
              </TableRow>
            )}

            {/* New row creation / Add button */}
            {(onCreate || onCreateButtonClick) && (
              <FmDataGridNewRow
                columns={columns}
                hasActions={actions.length > 0}
                isCreating={gridState.isCreatingRow}
                newRowData={gridState.newRowData as Partial<T>}
                onFieldChange={(columnKey, value) =>
                  gridState.setNewRowData((prev: Record<string, unknown>) => ({ ...prev, [columnKey]: value }))
                }
                onSave={handleSaveNewRow}
                onCancel={() => gridState.stopCreating()}
                onStartCreating={
                  onCreateButtonClick
                    ? onCreateButtonClick
                    : () => gridState.startCreating()
                }
                resourceName={resourceName}
              />
            )}
          </TableBody>
        </Table>

        {/* Drag selection overlay */}
        {selection.isDragMode && getDragBoxStyle() && (
          <div style={getDragBoxStyle()!} className='animate-in fade-in duration-100' />
        )}
      </div>

      {/* Sticky horizontal scrollbar - always visible at bottom of viewport */}
      {scrollSync.showStickyScrollbar && !isVirtualized && (
        <div
          ref={scrollSync.stickyScrollRef}
          onScroll={scrollSync.handleStickyScroll}
          className='sticky bottom-0 z-20 overflow-x-auto overflow-y-hidden bg-background/80 backdrop-blur-sm border-t border-border/30'
          style={{ height: '12px' }}
        >
          <div style={{ width: scrollSync.scrollWidth, height: '1px' }} />
        </div>
      )}

      {/* Pagination or Infinite Scroll Indicator */}
      <div className='flex items-center justify-between'>
        <div className='flex-1'>
          {isInfiniteScroll ? (
            <div className='flex items-center justify-between text-sm text-muted-foreground py-2'>
              <span>
                {t('dataGrid.showingCount', {
                  count: paginatedData.length,
                  total: filteredData.length,
                })}
              </span>
              {infiniteScroll.hasMore && (
                <button
                  onClick={infiniteScroll.loadMore}
                  disabled={infiniteScroll.isLoadingMore}
                  className='text-fm-gold hover:text-fm-gold/80 transition-colors disabled:opacity-50'
                >
                  {infiniteScroll.isLoadingMore ? t('dataGrid.loading') : t('dataGrid.loadMore')}
                </button>
              )}
            </div>
          ) : (
            <FmDataGridPagination
              currentPage={gridState.currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalCount={filteredData.length}
              onPageChange={gridState.setCurrentPage}
            />
          )}
        </div>
        {/* Keyboard Shortcuts - bottom right */}
        <FmDataGridKeyboardShortcuts />
      </div>

      {/* Dialogs */}
      <FmDataGridBatchDeleteDialog
        open={ui.showBatchDeleteDialog}
        onOpenChange={ui.closeBatchDeleteDialog}
        selectedRows={selectedRowsData}
        resourceName={resourceName}
        onConfirm={handleBatchDelete}
        isDeleting={ui.isBatchDeleting}
      />

      <FmDataGridExportDialog
        open={ui.showExportDialog}
        onOpenChange={ui.closeExportDialog}
        columns={columns}
        data={filteredData}
        filename={exportFilename || resourceName.toLowerCase().replace(/\s+/g, '-')}
        onExport={handleExport}
      />

      <FmDataGridGroupDialog
        open={ui.showGroupDialog}
        onOpenChange={ui.closeGroupDialog}
        columns={columns}
        currentGroupConfig={grouping.groupConfig}
        onApply={grouping.handleApplyGrouping}
        onClear={grouping.handleClearGrouping}
      />

      <FmBulkEditDialog
        open={ui.showBulkEditDialog}
        onOpenChange={ui.closeBulkEditDialog}
        columns={columns}
        selectedRows={selectedRowsData}
        onApply={handleBulkEdit}
      />
    </div>
  );
}
