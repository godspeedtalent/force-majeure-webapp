import React, { useState, useEffect, useMemo } from 'react';
import { TableHead, TableHeader, TableRow } from '@/components/common/shadcn/table';
import { Input } from '@/components/common/shadcn/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/common/shadcn/dropdown-menu';
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
import { cn } from '@/shared/utils/utils';
import { DataGridColumn } from '../FmDataGrid';

export interface FmDataGridHeaderProps<T> {
  columns: DataGridColumn<T>[];
  hasActions: boolean;
  isAllSelected: boolean;
  onSelectAll: (checked: boolean) => void;
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
  onSort: (columnKey: string) => void;
  columnFilters: Record<string, string>;
  onColumnFilter: (columnKey: string, value: string) => void;
  onHideColumn?: (columnKey: string) => void;
  onColumnReorder?: (fromIndex: number, toIndex: number) => void;
  columnWidths: Record<string, number>;
  onResizeStart: (columnKey: string, e: React.MouseEvent) => void;
  onToggleFreeze?: (columnKey: string) => void;
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
  onToggleFreeze,
}: FmDataGridHeaderProps<T>) {
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
    <TableHeader>
      <TableRow className='border-border/50 bg-muted/50 hover:bg-muted/50 group'>
        {/* Checkbox Column */}
        <TableHead className='w-12'>
          <FmCommonCheckbox
            checked={isAllSelected}
            onCheckedChange={onSelectAll}
            aria-label='Select all'
          />
        </TableHead>

        {/* Data Columns */}
        {columns.map((column, colIndex) => (
          <ContextMenu key={column.key}>
            <ContextMenuTrigger asChild>
              <TableHead
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
                  sortColumn === column.key &&
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
                onClick={() => column.sortable && onSort(column.key)}
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
                          <p className='text-xs'>{column.label}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <span>{column.label}</span>
                  )}
                  
                  {column.sortable &&
                    sortColumn === column.key &&
                    (sortDirection === 'asc' ? (
                      <ChevronUp className='h-3 w-3' />
                    ) : (
                      <ChevronDown className='h-3 w-3' />
                    ))}
                  {column.filterable && (
                    <DropdownMenu>
                      <TooltipProvider>
                        <Tooltip delayDuration={300}>
                          <TooltipTrigger asChild>
                            <DropdownMenuTrigger asChild>
                              <button
                                data-filter-trigger
                                className={cn(
                                  'h-6 w-6 p-0 hover:bg-fm-gold/20 transition-all duration-200 rounded opacity-0 group-hover:opacity-100',
                                  columnFilters[column.key] && 'opacity-100 bg-fm-gold/20'
                                )}
                                onClick={e => e.stopPropagation()}
                              >
                                <Filter
                                  className={cn(
                                    'h-3 w-3 mx-auto',
                                    columnFilters[column.key]
                                      ? 'text-fm-gold'
                                      : 'text-muted-foreground'
                                  )}
                                />
                              </button>
                            </DropdownMenuTrigger>
                          </TooltipTrigger>
                          {columnFilters[column.key] && (
                            <TooltipContent side='bottom' className='max-w-xs'>
                              <p className='text-xs'>
                                Filter: {columnFilters[column.key]}
                              </p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                      <DropdownMenuContent align='start' className='w-64'>
                        <div className='p-2'>
                          <div className='relative'>
                            <Input
                              placeholder={`Filter ${column.label}...`}
                              value={columnFilters[column.key] || ''}
                              onChange={e =>
                                onColumnFilter(column.key, e.target.value)
                              }
                              className='h-8 pr-8'
                              onClick={e => e.stopPropagation()}
                            />
                            {columnFilters[column.key] && (
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  onColumnFilter(column.key, '');
                                }}
                                className='absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center hover:bg-muted rounded-sm transition-colors'
                              >
                                <X className='h-3 w-3 text-muted-foreground' />
                              </button>
                            )}
                          </div>
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                {/* Resize handle - wider hit area for better UX */}
                <div
                  className='absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-fm-gold/50 transition-colors group-hover/header:opacity-100 opacity-0 z-10'
                  onMouseDown={e => handleResizeMouseDown(column.key, e)}
                  onClick={e => e.stopPropagation()}
                  draggable={false}
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
                  Filter
                </ContextMenuItem>
              )}
              {column.sortable && (
                <>
                  {(sortColumn !== column.key || sortDirection === 'desc') && (
                    <ContextMenuItem
                      onClick={() => onSort(column.key)}
                      className='text-white hover:bg-muted focus:bg-muted'
                    >
                      Sort Ascending
                    </ContextMenuItem>
                  )}
                  {(sortColumn !== column.key || sortDirection === 'asc') && (
                    <ContextMenuItem
                      onClick={() => onSort(column.key)}
                      className='text-white hover:bg-muted focus:bg-muted'
                    >
                      Sort Descending
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
                        Unfreeze Column
                      </>
                    ) : (
                      <>
                        <Pin className='h-4 w-4 mr-2' />
                        Freeze Column
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
                    Hide Column
                  </ContextMenuItem>
                </>
              )}
            </ContextMenuContent>
          </ContextMenu>
        ))}

        {/* Actions Column */}
        {hasActions && <TableHead className='w-24 text-right'>Actions</TableHead>}
      </TableRow>
    </TableHeader>
  );
}
