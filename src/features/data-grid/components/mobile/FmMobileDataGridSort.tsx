import { Check, ArrowUp, ArrowDown } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/common/shadcn/sheet';
import { Button } from '@/components/common/shadcn/button';
import { cn } from '@/shared';
import { FmMobileDataGridSortProps } from './types';

/**
 * Sort sheet for mobile - shows all sortable columns
 */
export function FmMobileDataGridSort({
  open,
  onOpenChange,
  columns,
  sortColumn,
  sortDirection,
  onSort,
}: FmMobileDataGridSortProps) {
  const sortableColumns = columns.filter(c => c.sortable !== false);
  
  const handleSort = (columnKey: string) => {
    onSort(columnKey);
    onOpenChange(false);
  };
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='bottom' className='h-[50vh] rounded-t-xl'>
        <SheetHeader className='mb-4'>
          <SheetTitle>Sort By</SheetTitle>
        </SheetHeader>
        
        <div className='space-y-1 overflow-y-auto max-h-[calc(50vh-100px)]'>
          {sortableColumns.map(column => {
            const isActive = sortColumn === column.key;
            
            return (
              <Button
                key={column.key}
                variant='ghost'
                className={cn(
                  'w-full justify-between h-12',
                  isActive && 'bg-primary/10'
                )}
                onClick={() => handleSort(column.key)}
              >
                <span>{column.label}</span>
                <div className='flex items-center gap-2'>
                  {isActive && (
                    <>
                      {sortDirection === 'asc' ? (
                        <ArrowUp className='h-4 w-4 text-primary' />
                      ) : (
                        <ArrowDown className='h-4 w-4 text-primary' />
                      )}
                      <Check className='h-4 w-4 text-primary' />
                    </>
                  )}
                </div>
              </Button>
            );
          })}
          
          {sortableColumns.length === 0 && (
            <p className='text-sm text-muted-foreground text-center py-8'>
              No sortable columns available
            </p>
          )}
        </div>
        
        {sortColumn && (
          <div className='pt-4 border-t mt-4'>
            <Button
              variant='outline'
              className='w-full'
              onClick={() => {
                onSort(''); // Clear sort
                onOpenChange(false);
              }}
            >
              Clear Sort
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
