import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TableHead, TableHeader, TableRow } from '@/components/common/shadcn/table';
import { Input } from '@/components/common/shadcn/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/common/shadcn/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/shadcn/select';
import { FilterOperator, ColumnFilter } from '../../hooks/useDataGridFilters';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/common/shadcn/context-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/common/shadcn/tooltip';
import { ChevronDown, ChevronUp, Filter, X, GripVertical, Pin, PinOff } from 'lucide-react';
import { FmCommonCheckbox } from '@/components/common/forms/FmCommonCheckbox';
import { cn } from '@/shared';
import { DataGridColumn } from '../FmDataGrid';

export interface FmDataGridHeaderProps<T> {
  columns: DataGridColumn<T>[];
  hasActions: boolean;
  isAllSelected: boolean;
  onSelectAll: (checked: boolean) => void;
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
  onSort: (columnKey: string, addToMultiSort?: boolean) => void;
  columnFilters: Record<string, string>;
  onColumnFilter: (columnKey: string, value: string, operator?: FilterOperator) => void;
  onHideColumn?: (columnKey: string) => void;
  onColumnReorder?: (fromIndex: number, toIndex: number) => void;
  columnWidths: Record<string, number>;
  onResizeStart: (columnKey: string, e: React.MouseEvent) => void;
  onAutoFitColumn?: (columnKey: string) => void;
  onToggleFreeze?: (columnKey: string) => void;
  /** Get the sort order index for a column (1-based), or null if not sorted */
  getSortIndex?: (columnKey: string) => number | null;
  /** Get the sort direction for a column, or null if not sorted */
  getSortDirection?: (columnKey: string) => 'asc' | 'desc' | null;
  /** Get current filter for a column */
  getColumnFilter?: (columnKey: string) => ColumnFilter | null;
  /** Show row numbers column */
  showRowNumbers?: boolean;
}

export function FmDataGridHeader<T>({
  columns,
  hasActions,
  isAllSelected,
  onSelectAll,
  sortColumn,
  sortDirection,
  onSort,
  columnFilters,
  onColumnFilter,
  onHideColumn,
  onColumnReorder,
  columnWidths,
  onResizeStart,
  onAutoFitColumn,
  onToggleFreeze,
  getSortIndex,
  getSortDirection,
  getColumnFilter,
  showRowNumbers = false,
}: FmDataGridHeaderProps<T>) {
  const { t } = useTranslation('common');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isResizing, setIsResizing] = useState(false);

  // Calculate cumulative left positions for frozen columns
  const frozenColumnPositions = useMemo(() => {
    const positions: Record<string, number> = {};
    let cumulativeLeft = 48; // Start after checkbox column (w-12 = 48px)

    columns.forEach(column => {
      if (column.frozen) {
        positions[column.key] = cumulativeLeft;
        const width = columnWidths[column.key] || 150; // Default width
        cumulativeLeft += width;
      }
    });

    return positions;
  }, [columns, columnWidths]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    // Don't allow dragging if we're resizing
    if (isResizing) {
      e.preventDefault();
      return;
    }

    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
    // Add a semi-transparent drag image
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }

    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      onColumnReorder?.(draggedIndex, dragOverIndex);
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (index !== dragOverIndex) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only reset dragOverIndex if we're actually leaving the entire header row,
    // not just moving between columns within the row
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    // Check if mouse is still within the header row bounds
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleResizeMouseDown = (columnKey: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent drag from starting
    setIsResizing(true);
    onResizeStart(columnKey, e);
  };

  // Reset resizing state when mouse is released
  useEffect(() => {
    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  return (
    <TableHeader className='sticky top-0 z-20'>
      <TableRow className='border-border/50 bg-background/95 backdrop-blur-sm hover:bg-background/95 group'>
        {/* Checkbox Column - sticky for horizontal scroll */}
        <TableHead className='w-12 sticky left-0 z-30 bg-background/95 backdrop-blur-sm'>
          <div className='flex items-center justify-center'>
            <FmCommonCheckbox
              checked={isAllSelected}
              onCheckedChange={onSelectAll}
              aria-label={t('table.selectAll')}
            />
          </div>
        </TableHead>

        {/* Row Number Column */}
        {showRowNumbers && (
          <TableHead className='w-12 text-center text-muted-foreground font-mono text-xs sticky left-12 z-30 bg-background/95 backdrop-blur-sm border-r border-border/60'>
            #
          </TableHead>
        )}

        {/* Data Columns */}
        {columns.map((column, colIndex) => (
          <ContextMenu key={column.key}>
            <ContextMenuTrigger asChild>
              <TableHead
                data-column-key={column.key}
                draggable={!!onColumnReorder}
                onDragStart={e => onColumnReorder && handleDragStart(e, colIndex)}
                onDragEnd={handleDragEnd}
                onDragOver={e => onColumnReorder && handleDragOver(e, colIndex)}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  'font-canela text-foreground font-semibold relative group/header',
                  column.width,
                  column.sortable && 'cursor-pointer select-none hover:bg-muted',
                  // Highlight sorted columns (supports multi-column sorting)
                  (getSortDirection?.(column.key) != null || sortColumn === column.key) &&
                    'bg-fm-gold text-black hover:bg-fm-gold/90',
                  'border-l border-r border-border/60',
                  draggedIndex === colIndex && 'opacity-50',
                  dragOverIndex === colIndex && 'border-l-2 border-l-fm-gold',
                  onColumnReorder && 'cursor-grab active:cursor-grabbing',
                  column.frozen && 'sticky bg-background/95 backdrop-blur-sm shadow-[2px_0_4px_rgba(0,0,0,0.1)]'
                )}
                style={{
                  width: columnWidths[column.key]
                    ? `${columnWidths[column.key]}px`
                    : column.width,
                  minWidth: columnWidths[column.key]
                    ? `${columnWidths[column.key]}px`
                    : undefined,
                  maxWidth: columnWidths[column.key]
                    ? `${columnWidths[column.key]}px`
                    : undefined,
                  ...(column.frozen && {
                    position: 'sticky',
                    left: `${frozenColumnPositions[column.key]}px`,
                    zIndex: 20,
                  }),
                }}
                onClick={(e) => column.sortable && onSort(column.key, e.shiftKey)}
              >
                <div className='flex items-center gap-2'>
                  {onColumnReorder && (
                    <GripVertical className='h-3 w-3 text-muted-foreground opacity-0 group-hover/header:opacity-100 transition-opacity flex-shrink-0' />
                  )}
                  
                  {/* Show icon only when column is narrow (width < 100px) and icon exists */}
                  {column.icon && columnWidths[column.key] && columnWidths[column.key] < 100 ? (
                    <TooltipProvider>
                      <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                          <div className='flex items-center'>
                            {column.icon}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side='bottom'>
                          <p className='text-xs font-semibold'>{column.label}</p>
                          {column.description && (
                            <p className='text-xs text-muted-foreground mt-1'>{column.description}</p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : column.description ? (
                    <TooltipProvider>
                      <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                          <span className='cursor-help border-b border-dotted border-muted-foreground/50'>
                            {column.label}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side='bottom' className='max-w-xs'>
                          <p className='text-xs'>{column.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <span>{column.label}</span>
                  )}
                  
                  {column.sortable && (() => {
                    const sortIndex = getSortIndex?.(column.key);
                    const colSortDirection = getSortDirection?.(column.key);
                    // Use multi-column sort helpers if available, otherwise fall back to legacy
                    const isSorted = sortIndex !== null && sortIndex !== undefined
                      ? true
                      : sortColumn === column.key;
                    const direction = colSortDirection ?? (sortColumn === column.key ? sortDirection : null);

                    if (!isSorted || !direction) return null;

                    return (
                      <div className='flex items-center gap-0.5'>
                        {direction === 'asc' ? (
                          <ChevronUp className='h-3 w-3' />
                        ) : (
                          <ChevronDown className='h-3 w-3' />
                        )}
                        {sortIndex !== null && sortIndex !== undefined && sortIndex > 0 && (
                          <span className='text-[10px] font-bold min-w-[14px] h-[14px] rounded-full bg-black/30 flex items-center justify-center'>
                            {sortIndex}
                          </span>
                        )}
                      </div>
                    );
                  })()}
                  {column.filterable && (() => {
                    const currentFilter = getColumnFilter?.(column.key);
                    const hasFilter = currentFilter && (currentFilter.value || currentFilter.operator === 'isEmpty' || currentFilter.operator === 'isNotEmpty');
                    const filterOperator = currentFilter?.operator || 'contains';
                    const filterValue = currentFilter?.value || columnFilters[column.key] || '';

                    return (
                      <DropdownMenu>
                        <TooltipProvider>
                          <Tooltip delayDuration={300}>
                            <TooltipTrigger asChild>
                              <DropdownMenuTrigger asChild>
                                <button
                                  data-filter-trigger
                                  className={cn(
                                    'h-6 w-6 p-0 hover:bg-fm-gold/20 transition-all duration-200 rounded opacity-0 group-hover:opacity-100',
                                    hasFilter && 'opacity-100 bg-fm-gold/20'
                                  )}
                                  onClick={e => e.stopPropagation()}
                                >
                                  <Filter
                                    className={cn(
                                      'h-3 w-3 mx-auto',
                                      hasFilter
                                        ? 'text-fm-gold'
                                        : 'text-muted-foreground'
                                    )}
                                  />
                                </button>
                              </DropdownMenuTrigger>
                            </TooltipTrigger>
                            {hasFilter && (
                              <TooltipContent side='bottom' className='max-w-xs'>
                                <p className='text-xs'>
                                  {t(`filterOperators.${filterOperator}`)}: {filterValue || '-'}
                                </p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                        <DropdownMenuContent align='start' className='w-72'>
                          <div className='p-2 space-y-2'>
                            {/* Operator selector */}
                            <Select
                              value={filterOperator}
                              onValueChange={(value: FilterOperator) => {
                                onColumnFilter(column.key, filterValue, value);
                              }}
                            >
                              <SelectTrigger className='h-8' onClick={e => e.stopPropagation()}>
                                <SelectValue placeholder={t('filterOperators.contains')} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value='contains'>{t('filterOperators.contains')}</SelectItem>
                                <SelectItem value='equals'>{t('filterOperators.equals')}</SelectItem>
                                <SelectItem value='startsWith'>{t('filterOperators.startsWith')}</SelectItem>
                                <SelectItem value='endsWith'>{t('filterOperators.endsWith')}</SelectItem>
                                <SelectItem value='greaterThan'>{t('filterOperators.greaterThan')}</SelectItem>
                                <SelectItem value='lessThan'>{t('filterOperators.lessThan')}</SelectItem>
                                <SelectItem value='isEmpty'>{t('filterOperators.isEmpty')}</SelectItem>
                                <SelectItem value='isNotEmpty'>{t('filterOperators.isNotEmpty')}</SelectItem>
                              </SelectContent>
                            </Select>

                            {/* Value input (hidden for isEmpty/isNotEmpty) */}
                            {filterOperator !== 'isEmpty' && filterOperator !== 'isNotEmpty' && (
                              <div className='relative'>
                                <Input
                                  placeholder={t('table.filterColumn', { column: column.label })}
                                  value={filterValue}
                                  onChange={e =>
                                    onColumnFilter(column.key, e.target.value, filterOperator)
                                  }
                                  className='h-8 pr-8'
                                  onClick={e => e.stopPropagation()}
                                />
                                {filterValue && (
                                  <button
                                    onClick={e => {
                                      e.stopPropagation();
                                      onColumnFilter(column.key, '', filterOperator);
                                    }}
                                    className='absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center hover:bg-muted rounded-sm transition-colors'
                                  >
                                    <X className='h-3 w-3 text-muted-foreground' />
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Clear filter button */}
                            {hasFilter && (
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  onColumnFilter(column.key, '');
                                }}
                                className='w-full text-xs text-muted-foreground hover:text-foreground py-1 transition-colors'
                              >
                                {t('buttons.clear')} {t('buttons.filter').toLowerCase()}
                              </button>
                            )}
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    );
                  })()}
                </div>

                {/* Resize handle - wider hit area for better UX, double-click to auto-fit */}
                <div
                  className='absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-fm-gold/50 transition-colors group-hover/header:opacity-100 opacity-0 z-10'
                  onMouseDown={e => handleResizeMouseDown(column.key, e)}
                  onDoubleClick={e => {
                    e.stopPropagation();
                    onAutoFitColumn?.(column.key);
                  }}
                  onClick={e => e.stopPropagation()}
                  draggable={false}
                  title={t('table.doubleClickToAutoFit')}
                />
              </TableHead>
            </ContextMenuTrigger>

            {/* Column Context Menu */}
            <ContextMenuContent className='bg-card border-border rounded-none'>
              {column.filterable && (
                <ContextMenuItem
                  onClick={() => {
                    const filterButton = document.querySelector(
                      `[data-filter-trigger]`
                    ) as HTMLElement;
                    filterButton?.click();
                  }}
                  className='text-white hover:bg-muted focus:bg-muted'
                >
                  {t('table.filter')}
                </ContextMenuItem>
              )}
              {column.sortable && (
                <>
                  {(sortColumn !== column.key || sortDirection === 'desc') && (
                    <ContextMenuItem
                      onClick={() => onSort(column.key)}
                      className='text-white hover:bg-muted focus:bg-muted'
                    >
                      {t('table.sortAscending')}
                    </ContextMenuItem>
                  )}
                  {(sortColumn !== column.key || sortDirection === 'asc') && (
                    <ContextMenuItem
                      onClick={() => onSort(column.key)}
                      className='text-white hover:bg-muted focus:bg-muted'
                    >
                      {t('table.sortDescending')}
                    </ContextMenuItem>
                  )}
                </>
              )}
              {onToggleFreeze && (
                <>
                  {(column.filterable || column.sortable) && <ContextMenuSeparator />}
                  <ContextMenuItem
                    onClick={() => onToggleFreeze(column.key)}
                    className='text-white hover:bg-muted focus:bg-muted'
                  >
                    {column.frozen ? (
                      <>
                        <PinOff className='h-4 w-4 mr-2' />
                        {t('table.unfreezeColumn')}
                      </>
                    ) : (
                      <>
                        <Pin className='h-4 w-4 mr-2' />
                        {t('table.freezeColumn')}
                      </>
                    )}
                  </ContextMenuItem>
                </>
              )}
              {onHideColumn && (
                <>
                  <ContextMenuSeparator />
                  <ContextMenuItem
                    onClick={() => onHideColumn(column.key)}
                    className='text-white hover:bg-muted focus:bg-muted'
                  >
                    {t('table.hideColumn')}
                  </ContextMenuItem>
                </>
              )}
            </ContextMenuContent>
          </ContextMenu>
        ))}

        {/* Actions Column */}
        {hasActions && <TableHead className='w-24 text-right'>{t('table.actions')}</TableHead>}
      </TableRow>
    </TableHeader>
  );
}
