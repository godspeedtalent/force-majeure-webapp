import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/common/shadcn/button';
import { cn } from '@/shared';

interface FmCommonRowManagerProps<T> {
  items: T[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  renderRow: (item: T, index: number) => React.ReactNode;
  addLabel?: string;
  minItems?: number;
  maxItems?: number;
  className?: string;
  canRemoveItem?: (item: T, index: number) => boolean; // Optional function to determine if specific item can be removed
  getRemoveTooltip?: (item: T, index: number) => string; // Optional tooltip for disabled remove button
}

export function FmCommonRowManager<T>({
  items,
  onAdd,
  onRemove,
  renderRow,
  addLabel,
  minItems = 1,
  maxItems = 10,
  className,
  canRemoveItem,
  getRemoveTooltip,
}: FmCommonRowManagerProps<T>) {
  const { t } = useTranslation('common');
  const canAdd = items.length < maxItems;
  const baseCanRemove = items.length > minItems;

  const resolvedAddLabel = addLabel || t('rowManager.addItem');

  return (
    <div className={cn('space-y-3', className)}>
      {items.map((item, index) => {
        // Check if this specific item can be removed
        const itemCanRemove = baseCanRemove && (canRemoveItem ? canRemoveItem(item, index) : true);
        const tooltip = !itemCanRemove && getRemoveTooltip ? getRemoveTooltip(item, index) : undefined;

        return (
          <div key={index} className='relative'>
            {baseCanRemove && (
              <Button
                type='button'
                variant='ghost'
                size='icon'
                onClick={() => itemCanRemove && onRemove(index)}
                disabled={!itemCanRemove}
                title={tooltip}
                className={cn(
                  'absolute -top-2 -right-2 z-10 h-6 w-6',
                  itemCanRemove
                    ? 'text-white/50 hover:text-red-400 hover:bg-red-400/10'
                    : 'text-white/20 cursor-not-allowed opacity-50'
                )}
              >
                <Trash2 className='h-3 w-3' />
              </Button>
            )}
            {renderRow(item, index)}
          </div>
        );
      })}
      {canAdd && (
        <Button
          type='button'
          variant='outline'
          onClick={onAdd}
          className='w-full border-white/20 bg-white/5 hover:bg-fm-gold/10 hover:border-fm-gold text-white hover:text-fm-gold'
        >
          <Plus className='h-4 w-4 mr-2' />
          {resolvedAddLabel}
        </Button>
      )}
    </div>
  );
}
