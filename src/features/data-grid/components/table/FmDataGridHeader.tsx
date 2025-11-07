import React from 'react';
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
import { ChevronDown, ChevronUp, Filter, X } from 'lucide-react';
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
  columnWidths: Record<string, number>;
  onResizeStart: (columnKey: string, e: React.MouseEvent) => void;
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
  columnWidths,
  onResizeStart,
}: FmDataGridHeaderProps<T>) {
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
                className={cn(
                  'font-canela text-foreground font-semibold relative',
                  column.width,
                  column.sortable && 'cursor-pointer select-none hover:bg-muted',
                  sortColumn === column.key &&
                    'bg-fm-gold text-black hover:bg-fm-gold/90',
                  colIndex > 0 && 'border-l border-border/30'
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
                }}
                onClick={() => column.sortable && onSort(column.key)}
              >
                <div className='flex items-center gap-2'>
                  <span>{column.label}</span>
                  {column.sortable &&
                    sortColumn === column.key &&
                    (sortDirection === 'asc' ? (
                      <ChevronUp className='h-3 w-3' />
                    ) : (
                      <ChevronDown className='h-3 w-3' />
                    ))}
                  {column.filterable && (
                    <TooltipProvider>
                      <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                          <DropdownMenu>
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
                  )}
                </div>

                {/* Resize handle */}
                <div
                  className='absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-fm-gold/50 transition-colors group-hover:opacity-100 opacity-0'
                  onMouseDown={e => onResizeStart(column.key, e)}
                  onClick={e => e.stopPropagation()}
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
              {(column.filterable || column.sortable) && onHideColumn && (
                <ContextMenuSeparator />
              )}
              {onHideColumn && (
                <ContextMenuItem
                  onClick={() => onHideColumn(column.key)}
                  className='text-white hover:bg-muted focus:bg-muted'
                >
                  Hide Column
                </ContextMenuItem>
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
