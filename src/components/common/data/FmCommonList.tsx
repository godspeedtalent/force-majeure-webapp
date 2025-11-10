import { ReactNode } from 'react';
import { cn } from '@/shared/utils/utils';

export interface FmCommonListColumn<T> {
  key: keyof T | string;
  label: string;
  render?: (value: any, item: T, index: number) => ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

interface FmCommonListProps<T> {
  items: T[];
  columns: FmCommonListColumn<T>[];
  striped?: boolean;
  dense?: boolean;
  className?: string;
  rowClassName?: string | ((item: T, index: number) => string);
  emptyMessage?: string;
  onRowClick?: (item: T, index: number) => void;
}

export function FmCommonList<T extends Record<string, any>>({
  items,
  columns,
  striped = true,
  dense = false,
  className,
  rowClassName,
  emptyMessage = 'No items to display',
  onRowClick,
}: FmCommonListProps<T>) {
  if (items.length === 0) {
    return (
      <div className='text-center py-6 text-muted-foreground text-sm'>
        {emptyMessage}
      </div>
    );
  }

  const getAlignment = (align?: 'left' | 'center' | 'right') => {
    switch (align) {
      case 'center':
        return 'text-center justify-center';
      case 'right':
        return 'text-right justify-end';
      default:
        return 'text-left justify-start';
    }
  };

  return (
    <div className={cn('space-y-0 overflow-hidden rounded-none', className)}>
      {items.map((item, index) => {
        const isStriped = striped && index % 2 === 1;
        const computedRowClassName =
          typeof rowClassName === 'function'
            ? rowClassName(item, index)
            : rowClassName;

        return (
          <div
            key={index}
            className={cn(
              'grid grid-cols-1 gap-2 transition-colors',
              dense ? 'px-3 py-2' : 'px-4 py-3',
              isStriped && 'bg-white/5',
              onRowClick && 'cursor-pointer',
              computedRowClassName
            )}
            style={{
              gridTemplateColumns: columns.map(() => '1fr').join(' '),
            }}
            onClick={() => onRowClick?.(item, index)}
          >
            {columns.map((column, colIndex) => {
              const value = item[column.key as keyof T];
              const content = column.render
                ? column.render(value, item, index)
                : value?.toString() || '-';

              return (
                <div
                  key={colIndex}
                  className={cn(
                    'flex items-center',
                    getAlignment(column.align),
                    dense ? 'text-xs' : 'text-sm',
                    column.className
                  )}
                >
                  {content}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
