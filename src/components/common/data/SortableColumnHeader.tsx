import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@/shared/utils/utils';

interface SortableColumnHeaderProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Sortable column header for drag and drop reordering
 */
export function SortableColumnHeader({
  id,
  children,
  className,
}: SortableColumnHeaderProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <th
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group',
        isDragging && 'opacity-50 z-50',
        className
      )}
    >
      <div className='flex items-center gap-2'>
        <div
          {...attributes}
          {...listeners}
          className='cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity'
        >
          <GripVertical className='h-4 w-4 text-muted-foreground' />
        </div>
        {children}
      </div>
    </th>
  );
}
