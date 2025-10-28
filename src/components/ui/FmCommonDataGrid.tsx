import React, { useState, useEffect, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/shared/hooks/use-toast';
import { FmCommonDataGridContextMenu } from './FmCommonDataGridContextMenu';
import { ContextMenuAction } from './FmCommonContextMenu';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, Filter, ChevronDown, ChevronUp, MoreVertical } from 'lucide-react';
import { cn } from '@/shared/utils/utils';
import { isRelationField, getRelationConfig } from './dataGridRelations';

export interface DataGridColumn<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  editable?: boolean;
  readonly?: boolean; // Mark field as readonly (cannot be edited inline or in forms)
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
  isRelation?: boolean; // Mark this column as a foreign key relation
}

// Re-export ContextMenuAction as DataGridAction for backward compatibility
export type DataGridAction<T = any> = ContextMenuAction<T>;

export interface FmCommonDataGridProps<T = any> {
  data: T[];
  columns: DataGridColumn<T>[];
  actions?: DataGridAction<T>[];
  contextMenuActions?: DataGridAction<T>[];
  loading?: boolean;
  pageSize?: number;
  className?: string;
  onUpdate?: (row: T, columnKey: string, newValue: any) => Promise<void>;
  resourceName?: string;
}

export function FmCommonDataGrid<T extends Record<string, any>>({
  data,
  columns,
  actions = [],
  contextMenuActions = [],
  loading = false,
  pageSize = 10,
  className,
  onUpdate,
  resourceName = 'Resource',
}: FmCommonDataGridProps<T>) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; columnKey: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  // Reset page when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [data]);

  // Filter data
  const filteredData = useMemo(() => {
    let filtered = [...data];

    // Apply universal search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((row) =>
        columns.some((col) => {
          const value = row[col.key];
          return value?.toString().toLowerCase().includes(query);
        })
      );
    }

    // Apply column filters
    Object.entries(columnFilters).forEach(([key, value]) => {
      if (value) {
        const query = value.toLowerCase();
        filtered = filtered.filter((row) => {
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
      const allIndices = new Set(paginatedData.map((_, idx) => (currentPage - 1) * pageSize + idx));
      setSelectedRows(allIndices);
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (index: number, event: React.MouseEvent) => {
    const globalIndex = (currentPage - 1) * pageSize + index;

    if (event.shiftKey && lastSelectedIndex !== null) {
      // Shift+Click: Select range
      const start = Math.min(lastSelectedIndex, globalIndex);
      const end = Math.max(lastSelectedIndex, globalIndex);
      const newSelection = new Set(selectedRows);
      for (let i = start; i <= end; i++) {
        newSelection.add(i);
      }
      setSelectedRows(newSelection);
    } else {
      // Regular click or Ctrl/Cmd+Click: Add to selection
      const newSelection = new Set(selectedRows);
      if (newSelection.has(globalIndex)) {
        newSelection.delete(globalIndex);
      } else {
        newSelection.add(globalIndex);
      }
      setSelectedRows(newSelection);
      setLastSelectedIndex(globalIndex);
    }
  };

  const handleColumnFilter = (columnKey: string, value: string) => {
    setColumnFilters((prev) => ({
      ...prev,
      [columnKey]: value,
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setColumnFilters({});
    setCurrentPage(1);
  };

  const isAllSelected = paginatedData.length > 0 && 
    paginatedData.every((_, idx) => selectedRows.has((currentPage - 1) * pageSize + idx));

  const handleCellEdit = (rowIndex: number, columnKey: string, currentValue: any) => {
    setEditingCell({ rowIndex, columnKey });
    setEditValue(currentValue?.toString() || '');
  };

  const handleCellSave = async (row: T, columnKey: string) => {
    if (!onUpdate || !editingCell) return;

    const newValue = editValue;
    const oldValue = row[columnKey];

    // Don't update if value is empty or hasn't changed
    if (!newValue || newValue.trim() === '' || newValue === oldValue?.toString()) {
      setEditingCell(null);
      return;
    }

    // Get resource name for display
    const displayName = row['name'] || resourceName;

    // Show loading toast with spinner (using description for spinner)
    const loadingToast = toast({
      title: `Updating ${displayName}...`,
      description: (
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 border-2 border-fm-gold border-t-transparent rounded-full animate-spin" />
          <span>Please wait...</span>
        </div>
      ),
      duration: Infinity,
    });

    try {
      await onUpdate(row, columnKey, newValue);
      
      // Dismiss loading and show success
      loadingToast.dismiss();
      toast({
        title: `${displayName} updated.`,
        duration: 2000,
      });
      
      setEditingCell(null);
    } catch (error) {
      // Dismiss loading and show error
      loadingToast.dismiss();
      toast({
        title: `Failed to update ${displayName}`,
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
        duration: 3000,
      });
    }
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search and Filter Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search across all columns..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10 bg-background/50 border-border/50 focus:border-fm-gold transition-all duration-300"
          />
        </div>
        
        {(searchQuery || Object.values(columnFilters).some(v => v)) && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="animate-in fade-in duration-300"
          >
            Clear Filters
          </Button>
        )}

        <div className="ml-auto text-sm text-muted-foreground">
          {selectedRows.size > 0 && (
            <span className="animate-in fade-in slide-in-from-right duration-300">
              {selectedRows.size} row{selectedRows.size !== 1 ? 's' : ''} selected
            </span>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-lg border border-border/50 overflow-x-auto bg-background/30 backdrop-blur-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 bg-muted/50 hover:bg-muted/50 group">
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                  className="data-[state=checked]:bg-fm-gold data-[state=checked]:border-fm-gold transition-all duration-200"
                />
              </TableHead>
              {columns.map((column, colIndex) => (
                <TableHead
                  key={column.key}
                  className={cn(
                    'font-canela text-foreground font-semibold relative',
                    column.width,
                    column.sortable && 'cursor-pointer select-none hover:bg-muted',
                    sortColumn === column.key && 'bg-fm-gold text-black hover:bg-fm-gold/90',
                    colIndex > 0 && 'border-l border-border/30'
                  )}
                  onClick={() => column.sortable && handleSort(column.key)}
                  onContextMenu={(e) => {
                    if (column.filterable) {
                      e.preventDefault();
                      // Open filter dropdown
                      const target = e.currentTarget.querySelector('[data-filter-trigger]') as HTMLElement;
                      target?.click();
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span>{column.label}</span>
                    {column.sortable && sortColumn === column.key && (
                      sortDirection === 'asc' ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )
                    )}
                    {column.filterable && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            data-filter-trigger
                            className={cn(
                              'h-6 w-6 p-0 hover:bg-fm-gold/20 transition-all duration-200 rounded opacity-0 group-hover:opacity-100',
                              columnFilters[column.key] && 'opacity-100 bg-fm-gold/20'
                            )}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Filter className={cn(
                              'h-3 w-3 mx-auto',
                              columnFilters[column.key] ? 'text-fm-gold' : 'text-muted-foreground'
                            )} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-64">
                          <div className="p-2">
                            <Input
                              placeholder={`Filter ${column.label}...`}
                              value={columnFilters[column.key] || ''}
                              onChange={(e) => handleColumnFilter(column.key, e.target.value)}
                              className="h-8"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </TableHead>
              ))}
              {actions.length > 0 && (
                <TableHead className="w-24 text-right">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1 + (actions.length > 0 ? 1 : 0)} className="h-32 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 border-2 border-fm-gold border-t-transparent rounded-full animate-spin" />
                    <span className="text-muted-foreground">Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1 + (actions.length > 0 ? 1 : 0)} className="h-32 text-center">
                  <span className="text-muted-foreground">No data found</span>
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, index) => {
                const globalIndex = (currentPage - 1) * pageSize + index;
                const isSelected = selectedRows.has(globalIndex);
                const isEvenRow = index % 2 === 0;

                return (
                  <FmCommonDataGridContextMenu
                    key={globalIndex}
                    row={row}
                    actions={contextMenuActions}
                  >
                    <TableRow
                      className={cn(
                        'border-border/50 transition-all duration-200 cursor-pointer group',
                        isEvenRow && 'bg-muted/20',
                        isSelected && 'bg-fm-gold/10 border-fm-gold/30',
                        'hover:bg-fm-gold/5'
                      )}
                      onClick={(e) => handleSelectRow(index, e)}
                    >
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => {
                              const newSelection = new Set(selectedRows);
                              if (newSelection.has(globalIndex)) {
                                newSelection.delete(globalIndex);
                              } else {
                                newSelection.add(globalIndex);
                              }
                              setSelectedRows(newSelection);
                            }}
                            aria-label={`Select row ${globalIndex + 1}`}
                            className="data-[state=checked]:bg-fm-gold data-[state=checked]:border-fm-gold transition-all duration-200"
                          />
                        </TableCell>
                        {columns.map((column) => {
                          const isEditing = editingCell?.rowIndex === globalIndex && editingCell?.columnKey === column.key;
                          const cellValue = row[column.key];
                          const relationConfig = isRelationField(column.key) ? getRelationConfig(column.key) : null;

                          return (
                            <TableCell 
                              key={column.key} 
                              className="font-medium"
                              onClick={(e) => {
                                // Only trigger edit if not clicking on checkbox and field is not readonly
                                if (column.editable && !column.readonly && onUpdate && !(e.target as HTMLElement).closest('[role="checkbox"]')) {
                                  handleCellEdit(globalIndex, column.key, cellValue);
                                }
                              }}
                            >
                              {isEditing ? (
                                relationConfig ? (
                                  // Render relation dropdown
                                  <div onClick={(e) => e.stopPropagation()}>
                                    {relationConfig.component({
                                      value: editValue,
                                      onChange: setEditValue,
                                      onComplete: () => handleCellSave(row, column.key),
                                    })}
                                  </div>
                                ) : (
                                  // Render text input
                                  <Input
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onBlur={() => handleCellSave(row, column.key)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleCellSave(row, column.key);
                                      } else if (e.key === 'Escape') {
                                        handleCellCancel();
                                      }
                                    }}
                                    autoFocus
                                    className="h-8 bg-background/50 border-fm-gold/50"
                                  />
                                )
                              ) : (
                                <div className={cn(
                                  'flex items-center gap-2',
                                  column.editable && !column.readonly && onUpdate && 'cursor-pointer hover:bg-fm-gold/5 -mx-2 px-2 py-1 rounded'
                                )}>
                                  {column.render
                                    ? column.render(cellValue, row)
                                    : cellValue?.toString() || '-'}
                                  {column.editable && !column.readonly && onUpdate && (
                                    <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                      Click to edit
                                    </span>
                                  )}
                                </div>
                              )}
                            </TableCell>
                          );
                        })}
                        {actions.length > 0 && (
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-fm-gold/20 transition-all duration-200"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {actions.map((action, idx) => (
                                  <DropdownMenuItem
                                    key={idx}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      action.onClick(row);
                                    }}
                                    className={cn(
                                      'cursor-pointer transition-colors duration-200',
                                      action.variant === 'destructive' && 'text-destructive focus:text-destructive'
                                    )}
                                  >
                                    {action.icon && <span className="mr-2">{action.icon}</span>}
                                    {action.label}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        )}
                      </TableRow>
                  </FmCommonDataGridContextMenu>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} results
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className={cn(
                    'cursor-pointer transition-all duration-200',
                    currentPage === 1 && 'pointer-events-none opacity-50'
                  )}
                />
              </PaginationItem>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber: number;
                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }

                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      onClick={() => setCurrentPage(pageNumber)}
                      isActive={currentPage === pageNumber}
                      className="cursor-pointer transition-all duration-200"
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className={cn(
                    'cursor-pointer transition-all duration-200',
                    currentPage === totalPages && 'pointer-events-none opacity-50'
                  )}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
