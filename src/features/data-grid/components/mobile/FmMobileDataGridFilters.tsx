import { X, Trash2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/common/shadcn/sheet';
import { Button } from '@/components/common/shadcn/button';
import { Input } from '@/components/common/shadcn/input';
import { Label } from '@/components/common/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/shadcn/select';
import { FmMobileDataGridFiltersProps } from './types';

/**
 * Filter sheet for mobile - shows all filterable columns
 */
export function FmMobileDataGridFilters({
  open,
  onOpenChange,
  columns,
  columnFilters,
  onColumnFilter,
  onClearFilters,
}: FmMobileDataGridFiltersProps) {
  const filterableColumns = columns.filter(c => c.filterable !== false);
  const hasActiveFilters = Object.values(columnFilters).some(v => v);
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='bottom' className='h-[70vh] rounded-t-xl'>
        <SheetHeader className='mb-4'>
          <div className='flex items-center justify-between'>
            <SheetTitle>Filters</SheetTitle>
            {hasActiveFilters && (
              <Button
                variant='ghost'
                size='sm'
                onClick={onClearFilters}
                className='text-destructive'
              >
                <Trash2 className='h-4 w-4 mr-1' />
                Clear All
              </Button>
            )}
          </div>
        </SheetHeader>
        
        <div className='space-y-4 overflow-y-auto max-h-[calc(70vh-100px)]'>
          {filterableColumns.map(column => (
            <div key={column.key} className='space-y-2'>
              <Label className='text-sm font-medium'>{column.label}</Label>
              
              {column.type === 'select' && column.options ? (
                <Select
                  value={columnFilters[column.key] || ''}
                  onValueChange={val => onColumnFilter(column.key, val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${column.label}`} />
                  </SelectTrigger>
                  <SelectContent className='bg-popover z-50'>
                    <SelectItem value=''>All</SelectItem>
                    {column.options.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : column.type === 'boolean' ? (
                <Select
                  value={columnFilters[column.key] || ''}
                  onValueChange={val => onColumnFilter(column.key, val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Any' />
                  </SelectTrigger>
                  <SelectContent className='bg-popover z-50'>
                    <SelectItem value=''>Any</SelectItem>
                    <SelectItem value='true'>Yes</SelectItem>
                    <SelectItem value='false'>No</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className='relative'>
                  <Input
                    type='text'
                    placeholder={`Filter by ${column.label}`}
                    value={columnFilters[column.key] || ''}
                    onChange={e => onColumnFilter(column.key, e.target.value)}
                    className='pr-8'
                  />
                  {columnFilters[column.key] && (
                    <Button
                      variant='ghost'
                      size='icon'
                      className='absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6'
                      onClick={() => onColumnFilter(column.key, '')}
                    >
                      <X className='h-3 w-3' />
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
          
          {filterableColumns.length === 0 && (
            <p className='text-sm text-muted-foreground text-center py-8'>
              No filterable columns available
            </p>
          )}
        </div>
        
        <div className='pt-4 border-t mt-4'>
          <Button className='w-full' onClick={() => onOpenChange(false)}>
            Apply Filters
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
