import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from 'react';
import { Table, TableBody, TableCell, TableRow } from '@/components/common/shadcn/table';
import { useToast } from '@/shared/hooks/use-toast';
import { cn } from '@/shared/utils/utils';
import { useDataGridKeyboardNav } from '../hooks/useDataGridKeyboardNav';
import { useDataGridVirtualization } from '../hooks/useDataGridVirtualization';
import { FmDataGridExportDialog, ExportFormat } from './FmDataGridExportDialog';
import { FmDataGridGroupDialog } from './FmDataGridGroupDialog';
import { FmBulkEditDialog } from './FmBulkEditDialog';
import { exportData } from '../utils/dataExport';
import {
  groupData,
  flattenGroupedData,
  toggleGroupExpanded,
  type GroupConfig,
  type GroupedRow,
  type FlattenedRow,
} from '../utils/grouping';
import { FmDataGridToolbar } from './table/FmDataGridToolbar';
import { FmDataGridHeader } from './table/FmDataGridHeader';
import { FmDataGridRow, FmDataGridGroupRow } from './table/FmDataGridRow';
import { FmDataGridNewRow } from './table/FmDataGridNewRow';
import { FmDataGridPagination } from './table/FmDataGridPagination';
import { FmDataGridBatchDeleteDialog } from './table/FmDataGridDialogs';
import { ContextMenuAction } from '@/components/common/modals/FmCommonContextMenu';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface DataGridColumn<T = any> {
  key: string;
  label: string;
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
  type?:
    | 'text'
    | 'number'
    | 'email'
    | 'url'
    | 'date'
    | 'boolean'
    | 'created_date';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DataGridAction<T = any> = ContextMenuAction<T>;

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
}

export function FmDataGrid<T extends Record<string, any>>({
  data,
  columns,
  actions = [],
  contextMenuActions = [],
  loading = false,
  pageSize = 10,
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
}: FmDataGridProps<T>) {
  const { toast } = useToast();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});

  // Selection State
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  // Editing State
  const [editingCell, setEditingCell] = useState<{
    rowIndex: number;
    columnKey: string;
  } | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  // New Row State
  const [isCreatingRow, setIsCreatingRow] = useState(false);
  const [newRowData, setNewRowData] = useState<Partial<T>>({});

  // UI State
  const [contextMenuOpenRow, setContextMenuOpenRow] = useState<number | null>(null);
  const [showBatchDeleteDialog, setShowBatchDeleteDialog] = useState(false);
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);
  const [hoveredColumn, setHoveredColumn] = useState<string | null>(null);

  // Column Resize State
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const resizeStartX = useRef<number>(0);
  const resizeStartWidth = useRef<number>(0);

  // Export/Group/Bulk Edit State
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [groupConfig, setGroupConfig] = useState<GroupConfig | null>(null);
  const [groupedRows, setGroupedRows] = useState<GroupedRow<T>[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [showBulkEditDialog, setShowBulkEditDialog] = useState(false);

  // Drag Select State
  const [isDragMode, setIsDragMode] = useState(false);
  const [dragStartRow, setDragStartRow] = useState<number | null>(null);
  const [dragCurrentRow, setDragCurrentRow] = useState<number | null>(null);
  const dragTimerRef = useRef<NodeJS.Timeout | null>(null);
  const rowRefs = useRef<Map<number, HTMLTableRowElement>>(new Map());

  // Reset page when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [data]);

  // Filter data
  const filteredData = useMemo(() => {
    let filtered = [...data];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(row =>
        columns.some(col => {
          const value = row[col.key];
          return value?.toString().toLowerCase().includes(query);
        })
      );
    }

    Object.entries(columnFilters).forEach(([key, value]) => {
      if (value) {
        const query = value.toLowerCase();
        filtered = filtered.filter(row => {
          const cellValue = row[key];
          return cellValue?.toString().toLowerCase().includes(query);
        });
      }
    });

    return filtered;
  }, [data, searchQuery, columns, columnFilters]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
      if (aValue === bValue) return 0;
      const comparison = aValue < bValue ? -1 : 1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortColumn, sortDirection]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  // Get display data (grouped or regular)
  const displayData = useMemo<FlattenedRow<T>[]>(() => {
    if (groupConfig && groupedRows.length > 0) {
      return flattenGroupedData(groupedRows);
    }
    return paginatedData.map(row => ({ type: 'data' as const, row, depth: 0 }));
  }, [groupConfig, groupedRows, paginatedData]);

  // Keyboard navigation
  const { handleTableKeyDown, getFocusableCellProps } = useDataGridKeyboardNav({
    rows: paginatedData,
    columns,
    isEditing: !!editingCell,
    editingCell,
    onStartEditing: (rowIndex, columnKey) => {
      const row = paginatedData[rowIndex];
      if (row) {
        const currentValue = row[columnKey];
        handleCellEdit(rowIndex, columnKey, currentValue);
      }
    },
    onStopEditing: () => setEditingCell(null),
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

  // Handlers
  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIndices = new Set(
        paginatedData.map((_, idx) => (currentPage - 1) * pageSize + idx)
      );
      setSelectedRows(allIndices);
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleColumnFilter = (columnKey: string, value: string) => {
    setColumnFilters(prev => ({ ...prev, [columnKey]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setColumnFilters({});
    setCurrentPage(1);
  };

  const handleCellEdit = (rowIndex: number, columnKey: string, currentValue: any) => {
    setEditingCell({ rowIndex, columnKey });
    setEditValue(currentValue?.toString() || '');
  };

  const handleCellSave = async (
    row: T,
    columnKey: string,
    overrideValue?: any
  ) => {
    if (!onUpdate || !editingCell) return;

    const column = columns.find(col => col.key === columnKey);
    let newValue = overrideValue !== undefined ? overrideValue : editValue;
    const oldValue = row[columnKey];

    // Type handling
    if (column?.type === 'boolean') {
      newValue = overrideValue !== undefined ? overrideValue : (editValue === 'true' || editValue === true);
    } else if (column?.type === 'number') {
      if (!newValue || newValue.toString().trim() === '') newValue = '0';
      if (parseFloat(newValue) === parseFloat(oldValue?.toString() || '0')) {
        setEditingCell(null);
        return;
      }
    } else {
      if (!newValue || newValue.toString().trim() === '' || newValue === oldValue?.toString()) {
        setEditingCell(null);
        return;
      }
    }

    const displayName = row['name'] || resourceName;
    const loadingToast = toast({
      title: `Updating ${displayName}...`,
      description: (
        <div className='flex items-center gap-2'>
          <div className='h-4 w-4 border-2 border-fm-gold border-t-transparent rounded-full animate-spin' />
          <span>Please wait...</span>
        </div>
      ),
      duration: Infinity,
    });

    try {
      await onUpdate(row, columnKey, newValue);
      loadingToast.dismiss();
      toast({ title: `${displayName} updated.`, duration: 2000 });
      setEditingCell(null);
    } catch (error) {
      loadingToast.dismiss();
      toast({
        title: `Failed to update ${displayName}`,
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
        duration: 3000,
      });
    }
  };

  const handleSaveNewRow = async () => {
    if (!onCreate) return;

    const processedData = { ...newRowData };
    columns.forEach(col => {
      if (col.type === 'number') {
        const value = processedData[col.key as keyof T];
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          processedData[col.key as keyof T] = 0 as any;
        }
      }
    });

    const requiredColumns = columns.filter(col => col.required);
    const missingFields = requiredColumns.filter(col => !processedData[col.key as keyof T]);

    if (missingFields.length > 0) {
      toast({
        title: 'Missing required fields',
        description: `Please fill in: ${missingFields.map(col => col.label).join(', ')}`,
        variant: 'destructive',
        duration: 3000,
      });
      return;
    }

    const loadingToast = toast({
      title: `Creating ${resourceName}...`,
      description: (
        <div className='flex items-center gap-2'>
          <div className='h-4 w-4 border-2 border-fm-gold border-t-transparent rounded-full animate-spin' />
          <span>Please wait...</span>
        </div>
      ),
      duration: Infinity,
    });

    try {
      await onCreate(processedData);
      loadingToast.dismiss();
      toast({ title: `${resourceName} created successfully`, duration: 2000 });
      setIsCreatingRow(false);
      setNewRowData({});
    } catch (error) {
      loadingToast.dismiss();
      toast({
        title: `Failed to create ${resourceName}`,
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
        duration: 3000,
      });
    }
  };

  const handleBatchDelete = async () => {
    if (!onBatchDelete) return;

    setIsBatchDeleting(true);
    const selectedRowsData = sortedData.filter((_, idx) => selectedRows.has(idx));

    const loadingToast = toast({
      title: `Deleting ${selectedRowsData.length} ${resourceName}${selectedRowsData.length !== 1 ? 's' : ''}...`,
      description: (
        <div className='flex items-center gap-2'>
          <div className='h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
          <span>Please wait...</span>
        </div>
      ),
      duration: 60000,
    });

    try {
      await onBatchDelete(selectedRowsData);
      loadingToast.dismiss();
      toast({
        title: 'Success',
        description: `Deleted ${selectedRowsData.length} ${resourceName}${selectedRowsData.length !== 1 ? 's' : ''}`,
        duration: 3000,
      });
      setSelectedRows(new Set());
      setShowBatchDeleteDialog(false);
    } catch (error) {
      loadingToast.dismiss();
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setIsBatchDeleting(false);
    }
  };

  const handleExport = (selectedColumns: string[], format: ExportFormat) => {
    const filename = exportFilename || resourceName.toLowerCase().replace(/\s+/g, '-');
    exportData(sortedData, columns, selectedColumns, format, filename);
    toast({
      title: 'Export successful',
      description: `Exported ${sortedData.length} rows to ${format.toUpperCase()}`,
      duration: 3000,
    });
  };

  const handleApplyGrouping = (config: GroupConfig) => {
    setGroupConfig(config);
    const grouped = groupData(sortedData, config, columns);
    setGroupedRows(grouped);
    const allGroupKeys = grouped.map(g => g.groupValue);
    setExpandedGroups(new Set(allGroupKeys));
    setCurrentPage(1);
  };

  const handleClearGrouping = () => {
    setGroupConfig(null);
    setGroupedRows([]);
    setExpandedGroups(new Set());
  };

  const handleToggleGroup = (groupValue: string) => {
    const updated = toggleGroupExpanded(groupedRows, groupValue);
    setGroupedRows(updated);
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupValue)) next.delete(groupValue);
      else next.add(groupValue);
      return next;
    });
  };

  const handleBulkEdit = async (updates: Partial<T>) => {
    if (!onUpdate) return;

    const selectedRowsData = sortedData.filter((_, idx) => selectedRows.has(idx));
    const loadingToast = toast({
      title: 'Updating rows...',
      description: `Applying changes to ${selectedRowsData.length} row${selectedRowsData.length !== 1 ? 's' : ''}`,
      duration: Infinity,
    });

    try {
      await Promise.all(selectedRowsData.map(row => onUpdate({ ...row, ...updates })));
      loadingToast.dismiss();
      toast({
        title: 'Bulk edit successful',
        description: `Updated ${selectedRowsData.length} row${selectedRowsData.length !== 1 ? 's' : ''}`,
        duration: 3000,
      });
      setSelectedRows(new Set());
    } catch (error) {
      loadingToast.dismiss();
      toast({
        title: 'Bulk edit failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
        duration: 3000,
      });
      throw error;
    }
  };

  // Column resizing
  const handleResizeStart = (columnKey: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingColumn(columnKey);
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = columnWidths[columnKey] || 150;
  };

  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      if (!resizingColumn) return;
      const diff = e.clientX - resizeStartX.current;
      const newWidth = Math.max(80, resizeStartWidth.current + diff);
      setColumnWidths(prev => ({ ...prev, [resizingColumn]: newWidth }));
    },
    [resizingColumn]
  );

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
  }, [resizingColumn, handleResizeMove, handleResizeEnd]);

  // Drag select handlers
  const handleMouseDown = (index: number, event: React.MouseEvent) => {
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

    const globalIndex = (currentPage - 1) * pageSize + index;
    dragTimerRef.current = setTimeout(() => {
      // Double-check we're not resizing before activating drag mode
      if (!resizingColumn) {
        setIsDragMode(true);
        setDragStartRow(globalIndex);
        setDragCurrentRow(globalIndex);
        setHoveredColumn(null);
        document.body.style.userSelect = 'none';
      }
    }, 300);
  };

  const handleMouseUp = () => {
    if (dragTimerRef.current) {
      clearTimeout(dragTimerRef.current);
      dragTimerRef.current = null;
    }

    if (isDragMode && dragStartRow !== null && dragCurrentRow !== null) {
      const start = Math.min(dragStartRow, dragCurrentRow);
      const end = Math.max(dragStartRow, dragCurrentRow);
      const newSelection = new Set(selectedRows);
      for (let i = start; i <= end; i++) newSelection.add(i);
      setSelectedRows(newSelection);
    }

    document.body.style.userSelect = '';
    setIsDragMode(false);
    setDragStartRow(null);
    setDragCurrentRow(null);
  };

  const handleMouseEnterRow = (index: number) => {
    if (isDragMode) {
      const globalIndex = (currentPage - 1) * pageSize + index;
      setDragCurrentRow(globalIndex);
    }
  };

  useEffect(() => {
    return () => {
      if (dragTimerRef.current) clearTimeout(dragTimerRef.current);
    };
  }, []);

  const getDragBoxStyle = (): React.CSSProperties | null => {
    if (!isDragMode || dragStartRow === null || dragCurrentRow === null) return null;

    const startRowEl = rowRefs.current.get(dragStartRow);
    const endRowEl = rowRefs.current.get(dragCurrentRow);
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
    paginatedData.every((_, idx) => selectedRows.has((currentPage - 1) * pageSize + idx));

  const selectedRowsData = useMemo(
    () => sortedData.filter((_, idx) => selectedRows.has(idx)),
    [sortedData, selectedRows]
  );

  return (
    <div className={cn('space-y-4', className)}>
      {/* Toolbar */}
      <FmDataGridToolbar
        searchQuery={searchQuery}
        onSearchChange={value => {
          setSearchQuery(value);
          setCurrentPage(1);
        }}
        hasActiveFilters={!!searchQuery || Object.values(columnFilters).some(v => v)}
        onClearFilters={clearFilters}
        selectedCount={selectedRows.size}
        onBatchDelete={onBatchDelete ? () => setShowBatchDeleteDialog(true) : undefined}
        onBulkEdit={onUpdate && selectedRows.size > 0 ? () => setShowBulkEditDialog(true) : undefined}
        onExport={enableExport && sortedData.length > 0 ? () => setShowExportDialog(true) : undefined}
        onGroupBy={sortedData.length > 0 ? () => setShowGroupDialog(true) : undefined}
        onCreate={onCreate ? () => { setIsCreatingRow(true); setNewRowData({}); } : undefined}
        onCreateButtonClick={onCreateButtonClick}
        resourceName={resourceName}
        createButtonLabel={createButtonLabel}
        enableExport={enableExport}
        hasGrouping={!!groupConfig}
        totalDataCount={sortedData.length}
        toolbarActions={toolbarActions}
        isBatchDeleting={isBatchDeleting}
      />

      {/* Table */}
      <div
        ref={parentRef}
        className={cn(
          'rounded-none border border-border/50 bg-background/30 backdrop-blur-sm relative',
          isVirtualized ? 'overflow-auto' : 'overflow-x-auto overflow-y-visible'
        )}
        style={isVirtualized ? { maxHeight: '600px' } : undefined}
        onKeyDown={handleTableKeyDown}
        role='grid'
        aria-label={`${resourceName} data grid`}
      >
        <Table className='relative'>
          <FmDataGridHeader
            columns={columns}
            hasActions={actions.length > 0}
            isAllSelected={isAllSelected}
            onSelectAll={handleSelectAll}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={handleSort}
            columnFilters={columnFilters}
            onColumnFilter={handleColumnFilter}
            onHideColumn={onHideColumn}
            onColumnReorder={onColumnReorder}
            columnWidths={columnWidths}
            onResizeStart={handleResizeStart}
            onToggleFreeze={onToggleFreeze}
          />
          <TableBody>
            {/* Virtual scrolling top spacer */}
            {isVirtualized && virtualRows.length > 0 && virtualRows[0].index > 0 && (
              <TableRow style={{ height: `${virtualRows[0].start}px` }}>
                <TableCell colSpan={columns.length + 1 + (actions.length > 0 ? 1 : 0)} />
              </TableRow>
            )}

            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 1 + (actions.length > 0 ? 1 : 0)}
                  className='h-32 text-center'
                >
                  <div className='flex items-center justify-center gap-2'>
                    <div className='h-4 w-4 border-2 border-fm-gold border-t-transparent rounded-full animate-spin' />
                    <span className='text-muted-foreground'>Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : displayData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 1 + (actions.length > 0 ? 1 : 0)}
                  className='h-32 text-center'
                >
                  <span className='text-muted-foreground'>No data found</span>
                </TableCell>
              </TableRow>
            ) : (
              virtualRows.map(virtualRow => {
                const index = virtualRow.index;
                const displayRow = displayData[index];
                if (!displayRow) return null;

                // Group row
                if (displayRow.type === 'group') {
                  const groupData = displayRow.row as GroupedRow<T>;
                  return (
                    <FmDataGridGroupRow
                      key={`group-${groupData.groupValue}`}
                      groupData={groupData}
                      columns={columns}
                      hasActions={actions.length > 0}
                      isExpanded={expandedGroups.has(groupData.groupValue)}
                      onToggle={() => handleToggleGroup(groupData.groupValue)}
                    />
                  );
                }

                // Data row
                const row = displayRow.row as T;
                const globalIndex = (currentPage - 1) * pageSize + index;
                const isSelected = selectedRows.has(globalIndex);
                const isEvenRow = index % 2 === 0;
                const hasContextMenuOpen = contextMenuOpenRow === globalIndex;

                const isDragSelected =
                  isDragMode &&
                  dragStartRow !== null &&
                  dragCurrentRow !== null &&
                  globalIndex >= Math.min(dragStartRow, dragCurrentRow) &&
                  globalIndex <= Math.max(dragStartRow, dragCurrentRow);

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
                    onSelectRow={() => {
                      const newSelection = new Set(selectedRows);
                      if (newSelection.has(globalIndex)) newSelection.delete(globalIndex);
                      else newSelection.add(globalIndex);
                      setSelectedRows(newSelection);
                    }}
                    onMouseDown={e => handleMouseDown(index, e)}
                    onMouseUp={handleMouseUp}
                    onMouseEnter={() => handleMouseEnterRow(index)}
                    setRowRef={el => {
                      if (el) rowRefs.current.set(globalIndex, el);
                      else rowRefs.current.delete(globalIndex);
                    }}
                    editingCell={editingCell}
                    editValue={editValue}
                    onEditValueChange={setEditValue}
                    onStartEdit={handleCellEdit}
                    onSaveEdit={handleCellSave}
                    onCancelEdit={() => { setEditingCell(null); setEditValue(''); }}
                    onUpdate={onUpdate}
                    isDragMode={isDragMode}
                    isDragSelected={isDragSelected}
                    hoveredColumn={hoveredColumn}
                    onSetHoveredColumn={setHoveredColumn}
                    onContextMenuOpenChange={open => setContextMenuOpenRow(open ? globalIndex : null)}
                    isMultipleSelected={selectedRows.size > 1}
                    onUnselectAll={() => {
                      setSelectedRows(new Set());
                    }}
                    getFocusableCellProps={getFocusableCellProps}
                    columnWidths={columnWidths}
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
                isCreating={isCreatingRow}
                newRowData={newRowData}
                onFieldChange={(columnKey, value) =>
                  setNewRowData(prev => ({ ...prev, [columnKey]: value }))
                }
                onSave={handleSaveNewRow}
                onCancel={() => {
                  setIsCreatingRow(false);
                  setNewRowData({});
                }}
                onStartCreating={
                  onCreateButtonClick
                    ? onCreateButtonClick
                    : () => {
                        setIsCreatingRow(true);
                        setNewRowData({});
                      }
                }
                resourceName={resourceName}
              />
            )}
          </TableBody>
        </Table>

        {/* Drag selection overlay */}
        {isDragMode && getDragBoxStyle() && (
          <div style={getDragBoxStyle()!} className='animate-in fade-in duration-100' />
        )}
      </div>

      {/* Pagination */}
      <FmDataGridPagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalCount={sortedData.length}
        onPageChange={setCurrentPage}
      />

      {/* Dialogs */}
      <FmDataGridBatchDeleteDialog
        open={showBatchDeleteDialog}
        onOpenChange={setShowBatchDeleteDialog}
        selectedRows={selectedRowsData}
        resourceName={resourceName}
        onConfirm={handleBatchDelete}
        isDeleting={isBatchDeleting}
      />

      <FmDataGridExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        columns={columns}
        data={sortedData}
        filename={exportFilename || resourceName.toLowerCase().replace(/\s+/g, '-')}
        onExport={handleExport}
      />

      <FmDataGridGroupDialog
        open={showGroupDialog}
        onOpenChange={setShowGroupDialog}
        columns={columns}
        currentGroupConfig={groupConfig}
        onApply={handleApplyGrouping}
        onClear={handleClearGrouping}
      />

      <FmBulkEditDialog
        open={showBulkEditDialog}
        onOpenChange={setShowBulkEditDialog}
        columns={columns}
        selectedRows={selectedRowsData}
        onApply={handleBulkEdit}
      />
    </div>
  );
}
