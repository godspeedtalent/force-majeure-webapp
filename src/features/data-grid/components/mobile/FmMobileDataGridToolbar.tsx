import { Search, Filter, ArrowUpDown, Settings2, X } from 'lucide-react';
import { Input } from '@/components/common/shadcn/input';
import { Button } from '@/components/common/shadcn/button';
import { Badge } from '@/components/common/shadcn/badge';
import { FmMobileDataGridToolbarProps } from './types';
import { cn } from '@/shared';

/**
 * Mobile toolbar with search, filter, sort, and column config buttons
 */
export function FmMobileDataGridToolbar({
  searchQuery,
  onSearchChange,
  onOpenFilters,
  onOpenSort,
  onOpenColumnConfig,
  activeFilterCount,
  sortColumn,
}: FmMobileDataGridToolbarProps) {
  return (
    <div className='space-y-3'>
      {/* Search bar */}
      <div className='relative'>
        <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
        <Input
          type='text'
          placeholder='Search...'
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          className='pl-9 pr-9 bg-background/50'
        />
        {searchQuery && (
          <Button
            variant='ghost'
            size='icon'
            className='absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7'
            onClick={() => onSearchChange('')}
          >
            <X className='h-3.5 w-3.5' />
          </Button>
        )}
      </div>
      
      {/* Action buttons row */}
      <div className='flex gap-2'>
        <Button
          variant='outline'
          size='sm'
          className={cn(
            'flex-1 gap-2',
            activeFilterCount > 0 && 'border-primary'
          )}
          onClick={onOpenFilters}
        >
          <Filter className='h-4 w-4' />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant='secondary' className='ml-1 h-5 px-1.5'>
              {activeFilterCount}
            </Badge>
          )}
        </Button>
        
        <Button
          variant='outline'
          size='sm'
          className={cn(
            'flex-1 gap-2',
            sortColumn && 'border-primary'
          )}
          onClick={onOpenSort}
        >
          <ArrowUpDown className='h-4 w-4' />
          Sort
        </Button>
        
        <Button
          variant='outline'
          size='icon'
          className='h-9 w-9'
          onClick={onOpenColumnConfig}
        >
          <Settings2 className='h-4 w-4' />
        </Button>
      </div>
    </div>
  );
}
