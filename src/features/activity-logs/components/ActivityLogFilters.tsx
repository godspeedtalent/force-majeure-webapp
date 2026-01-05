/**
 * Activity Log Filters Component
 *
 * Sidebar component for filtering activity logs.
 * Includes category checkboxes, date range, and search.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X } from 'lucide-react';
import { cn } from '@/shared';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonIconButton } from '@/components/common/buttons/FmCommonIconButton';
import { Input } from '@/components/common/shadcn/input';
import { FmCommonDatePicker } from '@/components/common/forms/FmCommonDatePicker';
import { FmCommonCheckbox } from '@/components/common/forms/FmCommonCheckbox';
import {
  ActivityLogFilters as Filters,
  ActivityCategory,
  CATEGORY_CONFIG,
  ALL_CATEGORIES,
} from '../types';

interface ActivityLogFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  onClearFilters: () => void;
}

export function ActivityLogFilters({
  filters,
  onFiltersChange,
  onClearFilters,
}: ActivityLogFiltersProps) {
  const { t } = useTranslation('common');
  const [searchValue, setSearchValue] = useState(filters.search || '');

  const handleCategoryToggle = (category: ActivityCategory) => {
    const currentCategories = filters.categories || [];
    const newCategories = currentCategories.includes(category)
      ? currentCategories.filter(c => c !== category)
      : [...currentCategories, category];

    onFiltersChange({
      ...filters,
      categories: newCategories.length > 0 ? newCategories : undefined,
    });
  };

  const handleSearchSubmit = () => {
    onFiltersChange({
      ...filters,
      search: searchValue || undefined,
    });
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  const handleDateFromChange = (date: Date | undefined) => {
    onFiltersChange({
      ...filters,
      dateFrom: date ? date.toISOString() : undefined,
    });
  };

  const handleDateToChange = (date: Date | undefined) => {
    onFiltersChange({
      ...filters,
      dateTo: date ? date.toISOString() : undefined,
    });
  };

  const hasActiveFilters =
    (filters.categories && filters.categories.length > 0) ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.search;

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Search */}
      <div className="space-y-2">
        <label className="text-xs uppercase text-muted-foreground font-medium">
          {t('activityLogFilters.search')}
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder={t('activityLogFilters.searchPlaceholder')}
              className="pl-9 bg-black/40 border-white/20 focus:border-fm-gold"
            />
          </div>
          <FmCommonIconButton
            icon={Search}
            onClick={handleSearchSubmit}
            tooltip={t('activityLogFilters.search')}
          />
        </div>
      </div>

      {/* Date Range */}
      <div className="space-y-2">
        <label className="text-xs uppercase text-muted-foreground font-medium">
          {t('activityLogFilters.dateRange')}
        </label>
        <div className="space-y-2">
          <FmCommonDatePicker
            value={filters.dateFrom ? new Date(filters.dateFrom) : undefined}
            onChange={handleDateFromChange}
            placeholder={t('activityLogFilters.fromDate')}
          />
          <FmCommonDatePicker
            value={filters.dateTo ? new Date(filters.dateTo) : undefined}
            onChange={handleDateToChange}
            placeholder={t('activityLogFilters.toDate')}
          />
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-2">
        <label className="text-xs uppercase text-muted-foreground font-medium">
          {t('activityLogFilters.categories')}
        </label>
        <div className="space-y-2">
          {ALL_CATEGORIES.map(category => {
            const config = CATEGORY_CONFIG[category];
            const isChecked = filters.categories?.includes(category) ?? false;

            return (
              <label
                key={category}
                className={cn(
                  'flex items-center gap-3 p-2 rounded cursor-pointer transition-colors',
                  'hover:bg-white/5',
                  isChecked && 'bg-white/5'
                )}
              >
                <FmCommonCheckbox
                  checked={isChecked}
                  onCheckedChange={() => handleCategoryToggle(category)}
                />
                <span className={cn('text-sm', config.color)}>
                  {config.label}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <FmCommonButton
          variant="destructive-outline"
          onClick={onClearFilters}
          icon={X}
          className="w-full"
        >
          {t('activityLogFilters.clearFilters')}
        </FmCommonButton>
      )}
    </div>
  );
}
