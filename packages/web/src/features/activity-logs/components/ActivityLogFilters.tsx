/**
 * Activity Log Filters Component
 *
 * Sidebar component for filtering activity logs.
 * Includes category checkboxes, date range, and search.
 */

import { useState } from 'react';
import { Search, Calendar, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@force-majeure/shared';
import { Button } from '@/components/common/shadcn/button';
import { Input } from '@/components/common/shadcn/input';
import { Calendar as CalendarComponent } from '@/components/common/shadcn/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/common/shadcn/popover';
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
          Search
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search logs..."
              className="pl-9 bg-black/40 border-white/20 focus:border-fm-gold"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleSearchSubmit}
            className="border-white/20 hover:border-fm-gold hover:bg-fm-gold/10"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Date Range */}
      <div className="space-y-2">
        <label className="text-xs uppercase text-muted-foreground font-medium">
          Date range
        </label>
        <div className="space-y-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  'bg-black/40 border-white/20 hover:border-fm-gold/50',
                  !filters.dateFrom && 'text-muted-foreground'
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {filters.dateFrom
                  ? format(new Date(filters.dateFrom), 'MMM d, yyyy')
                  : 'From date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 bg-black/90 backdrop-blur-md border border-white/20"
              align="start"
            >
              <CalendarComponent
                mode="single"
                selected={
                  filters.dateFrom ? new Date(filters.dateFrom) : undefined
                }
                onSelect={handleDateFromChange}
                initialFocus
                classNames={{
                  day_selected:
                    'bg-fm-gold text-black hover:bg-fm-gold hover:text-black',
                }}
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  'bg-black/40 border-white/20 hover:border-fm-gold/50',
                  !filters.dateTo && 'text-muted-foreground'
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {filters.dateTo
                  ? format(new Date(filters.dateTo), 'MMM d, yyyy')
                  : 'To date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 bg-black/90 backdrop-blur-md border border-white/20"
              align="start"
            >
              <CalendarComponent
                mode="single"
                selected={
                  filters.dateTo ? new Date(filters.dateTo) : undefined
                }
                onSelect={handleDateToChange}
                initialFocus
                classNames={{
                  day_selected:
                    'bg-fm-gold text-black hover:bg-fm-gold hover:text-black',
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-2">
        <label className="text-xs uppercase text-muted-foreground font-medium">
          Categories
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
        <Button
          variant="outline"
          onClick={onClearFilters}
          className="w-full border-white/20 hover:border-fm-danger hover:bg-fm-danger/10 hover:text-fm-danger"
        >
          <X className="mr-2 h-4 w-4" />
          Clear filters
        </Button>
      )}
    </div>
  );
}
