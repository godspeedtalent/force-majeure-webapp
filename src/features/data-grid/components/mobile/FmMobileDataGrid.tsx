import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
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
import { useMobileGridPersistence } from '../../hooks/useMobileGridPersistence';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';

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
  storageKey,
  cardFieldConfig: externalFieldConfig,
  onCardFieldConfigChange,
  pageSize = 25,
  paginationMode = 'infinite',
}: FmMobileDataGridProps<T>) {
  const { t } = useTranslation('common');
  const isInfiniteScroll = paginationMode === 'infinite';
  // Persistence
  const persistence = useMobileGridPersistence({
    storageKey: storageKey || resourceName.toLowerCase().replace(/\s+/g, '-'),
    enabled: !externalFieldConfig, // Only persist if not externally controlled
  });

  // Track if we've loaded persisted state
  const hasLoadedPersistence = useRef(false);

  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [showColumnConfig, setShowColumnConfig] = useState(false);
  const [selectedRow, setSelectedRow] = useState<T | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Field configuration - load from persistence if available
  const [internalFieldConfig, setInternalFieldConfig] = useState<MobileCardFieldConfig[]>(() => {
    const persisted = persistence.loadState();
    if (persisted?.fieldConfig && persisted.fieldConfig.length > 0) {
      hasLoadedPersistence.current = true;
      return persisted.fieldConfig;
    }
    return getDefaultFieldConfig(columns);
  });

  // Load persisted sort state on mount (only once)
  useEffect(() => {
    if (hasLoadedPersistence.current) return;
    const persisted = persistence.loadState();
    if (persisted) {
      hasLoadedPersistence.current = true;
      if (persisted.sortColumn !== undefined) {
        setSortColumn(persisted.sortColumn);
      }
      if (persisted.sortDirection) {
        setSortDirection(persisted.sortDirection);
      }
    }
  }, [persistence]);

  const fieldConfig = externalFieldConfig ?? internalFieldConfig;

  // Handle field config changes with persistence
  const handleFieldConfigChange = useCallback(
    (config: MobileCardFieldConfig[]) => {
      if (onCardFieldConfigChange) {
        onCardFieldConfigChange(config);
      } else {
        setInternalFieldConfig(config);
        persistence.saveFieldConfig(config);
      }
    },
    [onCardFieldConfigChange, persistence]
  );
  
  // Filtering
  const filters = useDataGridFilters({
    data,
    columns,
    sortColumn,
    sortDirection,
  });

  // Infinite scroll hook
  const infiniteScroll = useInfiniteScroll({
    totalItems: filters.filteredData.length,
    batchSize: pageSize,
    enabled: isInfiniteScroll,
  });

  // Data slicing based on pagination mode
  const paginatedData = useMemo(() => {
    if (isInfiniteScroll) {
      // Infinite scroll: show items up to visibleCount
      return filters.filteredData.slice(0, infiniteScroll.visibleCount);
    } else {
      // Paged: traditional pagination
      const start = (currentPage - 1) * pageSize;
      return filters.filteredData.slice(start, start + pageSize);
    }
  }, [filters.filteredData, isInfiniteScroll, infiniteScroll.visibleCount, currentPage, pageSize]);

  const totalPages = Math.ceil(filters.filteredData.length / pageSize);
  
  // Sort handler with persistence
  const handleSort = useCallback(
    (columnKey: string) => {
      if (!columnKey) {
        setSortColumn(null);
        persistence.saveSortState(null, 'asc');
        return;
      }
      if (sortColumn === columnKey) {
        const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        setSortDirection(newDirection);
        persistence.saveSortState(columnKey, newDirection);
      } else {
        setSortColumn(columnKey);
        setSortDirection('asc');
        persistence.saveSortState(columnKey, 'asc');
      }
    },
    [sortColumn, sortDirection, persistence]
  );

  return (
    <div className={cn('space-y-0', className)}>
      {/* Sticky Toolbar */}
      <div className='sticky top-0 z-20 bg-background/95 backdrop-blur-sm pb-4'>
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
      </div>

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
      
      {/* Pagination or Infinite Scroll Indicator */}
      {isInfiniteScroll ? (
        <div className='flex items-center justify-between text-sm text-muted-foreground py-3'>
          <span>
            {t('dataGrid.showingCount', {
              count: paginatedData.length,
              total: filters.filteredData.length,
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
        totalPages > 1 && (
          <FmDataGridPagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalCount={filters.filteredData.length}
            onPageChange={setCurrentPage}
          />
        )
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
