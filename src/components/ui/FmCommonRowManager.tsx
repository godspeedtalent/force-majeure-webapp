import * as React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/shared/utils/utils';

interface FmCommonRowManagerProps<T> {
  items: T[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  renderRow: (item: T, index: number) => React.ReactNode;
  addLabel?: string;
  minItems?: number;
  maxItems?: number;
  className?: string;
}

export function FmCommonRowManager<T>({
  items,
  onAdd,
  onRemove,
  renderRow,
  addLabel = 'Add Item',
  minItems = 1,
  maxItems = 10,
  className,
}: FmCommonRowManagerProps<T>) {
  const canAdd = items.length < maxItems;
  const canRemove = items.length > minItems;

  return (
    <div className={cn('space-y-3', className)}>
      {items.map((item, index) => (
        <div key={index} className="relative">
          {canRemove && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onRemove(index)}
              className="absolute -top-2 -right-2 z-10 h-6 w-6 text-white/50 hover:text-red-400 hover:bg-red-400/10"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
          {renderRow(item, index)}
        </div>
      ))}
      {canAdd && (
        <Button
          type="button"
          variant="outline"
          onClick={onAdd}
          className="w-full border-white/20 bg-white/5 hover:bg-fm-gold/10 hover:border-fm-gold text-white hover:text-fm-gold"
        >
          <Plus className="h-4 w-4 mr-2" />
          {addLabel}
        </Button>
      )}
    </div>
  );
}
