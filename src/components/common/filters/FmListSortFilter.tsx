/**
 * FmListSortFilter
 *
 * Reusable sort and filter controls for list displays.
 * Provides consistent UI for sorting by different fields, filtering by criteria,
 * text search, and relative date filtering.
 */

import { ArrowUpDown, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { FmCommonSelect, SelectOption } from '@/components/common/forms/FmCommonSelect';
import { Input } from '@/components/common/shadcn/input';
import { cn } from '@/shared';

export type SortDirection = 'asc' | 'desc';

export type DateRange = 'all' | 'week' | 'month' | 'year';

export interface SortOption {
  value: string;
  label: string;
}

export interface FilterOption {
  value: string;
  label: string;
}

interface FmListSortFilterProps {
  /** Current sort field value */
  sortBy: string;
  /** Callback when sort field changes */
  onSortChange: (value: string) => void;
  /** Available sort options */
  sortOptions: SortOption[];
  /** Current sort direction */
  sortDirection?: SortDirection;
  /** Callback when sort direction changes */
  onSortDirectionChange?: (direction: SortDirection) => void;
  /** Current filter value (optional) */
  filterBy?: string;
  /** Callback when filter changes (optional) */
  onFilterChange?: (value: string) => void;
  /** Available filter options (optional) */
  filterOptions?: FilterOption[];
  /** Filter placeholder text */
  filterPlaceholder?: string;
  /** Current search text (optional) */
  searchText?: string;
  /** Callback when search text changes (optional) */
  onSearchChange?: (value: string) => void;
  /** Search placeholder text */
  searchPlaceholder?: string;
  /** Current date range filter (optional) */
  dateRange?: DateRange;
  /** Callback when date range changes (optional) */
  onDateRangeChange?: (value: DateRange) => void;
  /** Additional CSS classes */
  className?: string;
  /** Compact mode for tighter layouts */
  compact?: boolean;
}

export function FmListSortFilter({
  sortBy,
  onSortChange,
  sortOptions,
  sortDirection = 'desc',
  onSortDirectionChange,
  filterBy,
  onFilterChange,
  filterOptions,
  filterPlaceholder,
  searchText,
  onSearchChange,
  searchPlaceholder,
  dateRange,
  onDateRangeChange,
  className,
  compact = false,
}: FmListSortFilterProps) {
  const { t } = useTranslation('common');

  const sortSelectOptions: SelectOption[] = sortOptions.map(opt => ({
    value: opt.value,
    label: opt.label,
  }));

  const filterSelectOptions: SelectOption[] = filterOptions?.map(opt => ({
    value: opt.value,
    label: opt.label,
  })) || [];

  const dateRangeOptions: SelectOption[] = [
    { value: 'all', label: t('filters.dateRange.allTime') },
    { value: 'week', label: t('filters.dateRange.pastWeek') },
    { value: 'month', label: t('filters.dateRange.pastMonth') },
    { value: 'year', label: t('filters.dateRange.pastYear') },
  ];

  const handleDirectionToggle = () => {
    if (onSortDirectionChange) {
      onSortDirectionChange(sortDirection === 'asc' ? 'desc' : 'asc');
    }
  };

  const handleClearSearch = () => {
    if (onSearchChange) {
      onSearchChange('');
    }
  };

  return (
    <div className={cn('flex items-center gap-[10px] flex-wrap', className)}>
      {/* Search Input */}
      {onSearchChange && (
        <div className='relative flex items-center h-8'>
          <Search className='absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground' />
          <Input
            type='text'
            value={searchText || ''}
            onChange={e => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder || t('placeholders.searchByName')}
            className={cn(
              'pl-7 pr-7 h-8 text-xs bg-transparent border-white/20',
              'focus:border-fm-gold/50 focus:ring-0',
              'placeholder:text-muted-foreground/60',
              compact ? 'w-[280px]' : 'w-[360px]'
            )}
          />
          {searchText && (
            <button
              type='button'
              onClick={handleClearSearch}
              className='absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
            >
              <X className='h-3.5 w-3.5' />
            </button>
          )}
        </div>
      )}

      {/* Date Range Filter */}
      {onDateRangeChange && (
        <FmCommonSelect
          value={dateRange || 'all'}
          onChange={value => onDateRangeChange(value as DateRange)}
          options={dateRangeOptions}
          placeholder={t('filters.dateRange.label')}
          className={cn(compact ? 'w-[120px]' : 'w-[140px]', 'h-8 text-xs')}
          containerClassName='!space-y-0'
        />
      )}

      {/* Sort Controls */}
      <div className='flex items-center gap-[5px]'>
        <FmCommonSelect
          value={sortBy}
          onChange={onSortChange}
          options={sortSelectOptions}
          placeholder={t('labels.sortBy')}
          className={cn(compact ? 'w-[100px]' : 'w-[120px]', 'h-8 text-xs')}
          containerClassName='!space-y-0'
        />
        {onSortDirectionChange && (
          <button
            type='button'
            onClick={handleDirectionToggle}
            className={cn(
              'h-8 w-8 flex items-center justify-center border border-white/20 bg-transparent',
              'hover:bg-white/5 hover:border-fm-gold/30',
              'transition-all duration-200',
              'text-muted-foreground hover:text-fm-gold'
            )}
            title={sortDirection === 'asc' ? t('dataGrid.sortAscending') : t('dataGrid.sortDescending')}
          >
            <ArrowUpDown
              className={cn(
                'h-3.5 w-3.5 transition-transform duration-200',
                sortDirection === 'asc' && 'rotate-180'
              )}
            />
          </button>
        )}
      </div>

      {/* Custom Filter Controls (optional) */}
      {filterOptions && filterOptions.length > 0 && onFilterChange && (
        <FmCommonSelect
          value={filterBy || 'all'}
          onChange={onFilterChange}
          options={filterSelectOptions}
          placeholder={filterPlaceholder || t('buttons.filter')}
          className={cn(compact ? 'w-[120px]' : 'w-[140px]', 'h-8 text-xs')}
        />
      )}
    </div>
  );
}
