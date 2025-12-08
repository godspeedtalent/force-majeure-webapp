
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@force-majeure/shared/utils/utils';
import { DataGridColumn } from '../FmDataGrid';

interface ColumnConfig {
  key: string;
  visible: boolean;
  order: number;
  width?: number;
}

export interface FmConfigurableSortableColumnProps {
  colConfig: ColumnConfig;
  column: DataGridColumn;
  isRecentlyMoved: boolean;
}

export function FmConfigurableSortableColumn({
  colConfig,
  column,
  isRecentlyMoved,
}: FmConfigurableSortableColumnProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: colConfig.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center justify-between p-2 rounded border transition-all duration-200',
        colConfig.visible ? 'bg-background' : 'bg-muted/50 opacity-60',
        'hover:border-fm-gold hover:bg-fm-gold/5',
        isRecentlyMoved && 'animate-border-pulse-gold',
        isDragging && 'opacity-50 shadow-lg z-50'
      )}
    >
      <div className='flex items-center gap-2'>
        <button
          {...attributes}
          {...listeners}
          className='cursor-grab active:cursor-grabbing hover:text-fm-gold transition-colors'
        >
          <GripVertical className='h-4 w-4 text-muted-foreground' />
        </button>
        <span className='font-medium'>{column.label}</span>
        {!colConfig.visible && (
          <span className='text-xs text-muted-foreground'>(Hidden)</span>
        )}
      </div>
    </div>
  );
}
