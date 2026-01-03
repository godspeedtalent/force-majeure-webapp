import { useState, useEffect } from 'react';
import { GripVertical, Star } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/common/shadcn/sheet';
import { Button } from '@/components/common/shadcn/button';
import { Switch } from '@/components/common/shadcn/switch';
import { cn } from '@/shared';
import { FmMobileDataGridColumnConfigProps, MobileCardFieldConfig } from './types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/**
 * Sortable field item component
 */
function SortableFieldItem({
  field,
  column,
  onToggleVisibility,
  onToggleTitle,
}: {
  field: MobileCardFieldConfig & { visible: boolean };
  column: { key: string; label: string } | undefined;
  onToggleVisibility: () => void;
  onToggleTitle: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.key });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  if (!column) return null;
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 p-3 border border-border/50 bg-background rounded-md',
        isDragging && 'opacity-50 shadow-lg',
        !field.visible && 'opacity-50'
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className='touch-none cursor-grab active:cursor-grabbing'
      >
        <GripVertical className='h-5 w-5 text-muted-foreground' />
      </button>
      
      <div className='flex-1 min-w-0'>
        <span className='text-sm font-medium truncate'>{column.label}</span>
        {field.isTitle && (
          <span className='ml-2 text-xs text-primary'>(Title)</span>
        )}
        {field.isSubtitle && (
          <span className='ml-2 text-xs text-muted-foreground'>(Subtitle)</span>
        )}
      </div>
      
      <div className='flex items-center gap-2'>
        <Button
          variant='ghost'
          size='icon'
          className={cn(
            'h-8 w-8',
            field.isTitle && 'text-primary'
          )}
          onClick={onToggleTitle}
          title='Set as card title'
        >
          <Star className={cn('h-4 w-4', field.isTitle && 'fill-current')} />
        </Button>
        
        <Switch
          checked={field.visible}
          onCheckedChange={onToggleVisibility}
        />
      </div>
    </div>
  );
}

/**
 * Column configuration sheet for customizing which fields appear on mobile cards
 */
export function FmMobileDataGridColumnConfig({
  open,
  onOpenChange,
  columns,
  fieldConfig,
  onFieldConfigChange,
}: FmMobileDataGridColumnConfigProps) {
  // Local state for editing
  const [localConfig, setLocalConfig] = useState<(MobileCardFieldConfig & { visible: boolean })[]>([]);
  
  /**
   * Sort fields: active (visible) first, then inactive.
   * Within each group, sort alphabetically by column label.
   */
  const sortFieldsForDisplay = (
    items: (MobileCardFieldConfig & { visible: boolean })[],
    cols: typeof columns
  ) => {
    const getLabel = (key: string) =>
      cols.find(c => c.key === key)?.label?.toLowerCase() ?? key.toLowerCase();

    // Separate visible and hidden fields
    const visible = items.filter(f => f.visible);
    const hidden = items.filter(f => !f.visible);

    // Sort each group alphabetically by label
    visible.sort((a, b) => getLabel(a.key).localeCompare(getLabel(b.key)));
    hidden.sort((a, b) => getLabel(a.key).localeCompare(getLabel(b.key)));

    // Combine: visible first, then hidden
    return [...visible, ...hidden];
  };

  // Initialize local config when opening
  useEffect(() => {
    if (open) {
      // Merge field config with all columns
      const configMap = new Map(fieldConfig.map(f => [f.key, f]));
      const merged = columns
        .filter(c => c.key !== 'id') // Exclude id column
        .map((col, idx) => {
          const existing = configMap.get(col.key);
          return {
            key: col.key,
            priority: existing?.priority ?? idx,
            showLabel: existing?.showLabel ?? true,
            isTitle: existing?.isTitle ?? false,
            isSubtitle: existing?.isSubtitle ?? false,
            isImage: existing?.isImage ?? false,
            visible: existing !== undefined,
          };
        });

      // Sort: visible first, then alphabetically within each group
      const sorted = sortFieldsForDisplay(merged, columns);
      setLocalConfig(sorted);
    }
  }, [open, columns, fieldConfig]);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setLocalConfig(items => {
        const oldIndex = items.findIndex(i => i.key === active.id);
        const newIndex = items.findIndex(i => i.key === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };
  
  const handleToggleVisibility = (key: string) => {
    setLocalConfig(items =>
      items.map(item =>
        item.key === key ? { ...item, visible: !item.visible } : item
      )
    );
  };
  
  const handleToggleTitle = (key: string) => {
    setLocalConfig(items =>
      items.map(item => ({
        ...item,
        isTitle: item.key === key ? !item.isTitle : false,
        // If setting as title, remove subtitle status
        isSubtitle: item.key === key && !item.isTitle ? false : item.isSubtitle,
      }))
    );
  };
  
  const handleSave = () => {
    // Convert local config back to field config (only visible fields)
    const newConfig: MobileCardFieldConfig[] = localConfig
      .filter(f => f.visible)
      .map((f, idx) => ({
        key: f.key,
        priority: idx,
        showLabel: f.showLabel,
        isTitle: f.isTitle,
        isSubtitle: f.isSubtitle,
        isImage: f.isImage,
      }));

    onFieldConfigChange(newConfig);
    onOpenChange(false);
  };
  
  const handleReset = () => {
    // Reset to show first 5 columns
    const defaultConfig = columns
      .filter(c => c.key !== 'id')
      .slice(0, 5)
      .map((col, idx) => ({
        key: col.key,
        priority: idx,
        showLabel: idx > 1, // First two don't show labels (title/subtitle)
        isTitle: idx === 0,
        isSubtitle: idx === 1,
        visible: true,
      }));
    
    // Mark rest as hidden
    const remaining = columns
      .filter(c => c.key !== 'id')
      .slice(5)
      .map((col, idx) => ({
        key: col.key,
        priority: 5 + idx,
        showLabel: true,
        isTitle: false,
        isSubtitle: false,
        visible: false,
      }));
    
    setLocalConfig([...defaultConfig, ...remaining]);
  };
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='bottom' className='h-[80vh] rounded-t-xl'>
        <SheetHeader className='mb-4'>
          <div className='flex items-center justify-between'>
            <SheetTitle>Card Fields</SheetTitle>
            <Button variant='ghost' size='sm' onClick={handleReset}>
              Reset
            </Button>
          </div>
          <p className='text-sm text-muted-foreground'>
            Drag to reorder. Toggle visibility. Star to set as card title.
          </p>
        </SheetHeader>
        
        <div className='overflow-y-auto max-h-[calc(80vh-180px)] space-y-2'>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={localConfig.map(f => f.key)}
              strategy={verticalListSortingStrategy}
            >
              {localConfig.map(field => (
                <SortableFieldItem
                  key={field.key}
                  field={field}
                  column={columns.find(c => c.key === field.key)}
                  onToggleVisibility={() => handleToggleVisibility(field.key)}
                  onToggleTitle={() => handleToggleTitle(field.key)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
        
        <div className='pt-4 border-t mt-4 flex gap-2'>
          <Button variant='outline' className='flex-1' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className='flex-1' onClick={handleSave}>
            Save Configuration
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
