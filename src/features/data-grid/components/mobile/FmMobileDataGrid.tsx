import { useState, useMemo } from 'react';
import { cn } from '@/shared';
import { FmMobileDataGridProps, MobileCardFieldConfig } from './types';
import { FmMobileDataGridCard, getDefaultFieldConfig } from './FmMobileDataGridCard';
import { FmMobileDataGridToolbar } from './FmMobileDataGridToolbar';
import { FmMobileDataGridDetailDrawer } from './FmMobileDataGridDetailDrawer';
import { FmMobileDataGridFilters } from './FmMobileDataGridFilters';
import { FmMobileDataGridSort } from './FmMobileDataGridSort';
import { FmMobileDataGridColumnConfig } from './FmMobileDataGridColumnConfig';
import { FmDataGridPagination } from '../table/FmDataGridPagination';
import { useDataGridFilters } from '../../hooks/useDataGridFilters';

/**
 * Main mobile data grid container
 * Orchestrates all mobile subcomponents
 */
export function FmMobileDataGrid<T extends Record<string, any>>({
  data,
  columns,
  actions = [],
  loading = false,
  className,
  onUpdate,
  resourceName = 'Item',
  cardFieldConfig: externalFieldConfig,
  onCardFieldConfigChange,
  pageSize = 20,
}: FmMobileDataGridProps<T>) {
  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [showColumnConfig, setShowColumnConfig] = useState(false);
  const [selectedRow, setSelectedRow] = useState<T | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Field configuration
  const [internalFieldConfig, setInternalFieldConfig] = useState<MobileCardFieldConfig[]>(() =>
    getDefaultFieldConfig(columns)
  );
  
  const fieldConfig = externalFieldConfig ?? internalFieldConfig;
  const handleFieldConfigChange = onCardFieldConfigChange ?? setInternalFieldConfig;
  
  // Filtering
  const filters = useDataGridFilters({
    data,
    columns,
    sortColumn,
    sortDirection,
  });
  
  // Pagination
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filters.filteredData.slice(start, start + pageSize);
  }, [filters.filteredData, currentPage, pageSize]);
  
  const totalPages = Math.ceil(filters.filteredData.length / pageSize);
  
  // Sort handler
  const handleSort = (columnKey: string) => {
    if (!columnKey) {
      setSortColumn(null);
      return;
    }
    if (sortColumn === columnKey) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };
  
  return (
    <div className={cn('space-y-4', className)}>
      {/* Toolbar */}
      <FmMobileDataGridToolbar
        searchQuery={filters.searchQuery}
        onSearchChange={query => {
          filters.setSearchQuery(query);
          setCurrentPage(1);
        }}
        onOpenFilters={() => setShowFilters(true)}
        onOpenSort={() => setShowSort(true)}
        onOpenColumnConfig={() => setShowColumnConfig(true)}
        activeFilterCount={filters.activeFilterCount}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
      />
      
      {/* Card list */}
      <div className='space-y-2'>
        {loading ? (
          <div className='flex items-center justify-center py-12'>
            <div className='h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin' />
          </div>
        ) : paginatedData.length === 0 ? (
          <div className='text-center py-12 text-muted-foreground'>
            No {resourceName.toLowerCase()}s found
          </div>
        ) : (
          paginatedData.map((row, idx) => (
            <FmMobileDataGridCard
              key={row.id ?? idx}
              row={row}
              columns={columns}
              fieldConfig={fieldConfig}
              actions={actions}
              onClick={() => setSelectedRow(row)}
            />
          ))
        )}
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <FmDataGridPagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalCount={filters.filteredData.length}
          onPageChange={setCurrentPage}
        />
      )}
      
      {/* Detail Drawer */}
      <FmMobileDataGridDetailDrawer
        open={!!selectedRow}
        onOpenChange={open => !open && setSelectedRow(null)}
        row={selectedRow}
        columns={columns}
        actions={actions}
        onUpdate={onUpdate}
        resourceName={resourceName}
      />
      
      {/* Filter Sheet */}
      <FmMobileDataGridFilters
        open={showFilters}
        onOpenChange={setShowFilters}
        columns={columns}
        columnFilters={filters.columnFilters}
        onColumnFilter={(key, val) => {
          filters.handleColumnFilter(key, val);
          setCurrentPage(1);
        }}
        onClearFilters={() => {
          filters.clearFilters();
          setCurrentPage(1);
        }}
      />
      
      {/* Sort Sheet */}
      <FmMobileDataGridSort
        open={showSort}
        onOpenChange={setShowSort}
        columns={columns}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={handleSort}
      />
      
      {/* Column Config Sheet */}
      <FmMobileDataGridColumnConfig
        open={showColumnConfig}
        onOpenChange={setShowColumnConfig}
        columns={columns}
        fieldConfig={fieldConfig}
        onFieldConfigChange={handleFieldConfigChange}
      />
    </div>
  );
}
