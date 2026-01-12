/**
 * Enhanced Column Configuration Modal
 *
 * Provides comprehensive column management:
 * - Show/hide all columns (including hidden ones)
 * - Rename column display labels
 * - Reorder columns via drag-and-drop
 * - Freeze/unfreeze columns
 * - Refresh schema from database
 * - Reset to defaults
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/common/shadcn/dialog';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { Input } from '@/components/common/shadcn/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/shadcn/select';
import { DataGridColumn } from '../FmDataGrid';
import {
  Eye,
  EyeOff,
  RotateCcw,
  Pin,
  PinOff,
  Save,
  X,
  Edit2,
  Check,
  GripVertical,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/shared';
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
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { arrayMove } from '@dnd-kit/sortable';

interface ColumnConfig {
  key: string;
  visible: boolean;
  order: number;
  width?: number;
  frozen?: boolean;
  customLabel?: string;
  type?:
    | 'text'
    | 'number'
    | 'email'
    | 'url'
    | 'date'
    | 'boolean'
    | 'created_date'
    | 'select';
}

export interface FmColumnConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  baseColumns: DataGridColumn[];
  columnConfigs: ColumnConfig[];
  onSaveConfiguration: (configs: ColumnConfig[]) => void;
  onResetConfiguration: () => void;
  /** Optional callback to refresh schema from database */
  onRefreshSchema?: () => void;
  /** Whether schema refresh is in progress */
  isRefreshing?: boolean;
}

/** Sortable column row component for drag-and-drop reordering */
interface SortableColumnRowProps {
  column: DataGridColumn;
  config: ColumnConfig;
  originalLabel: string;
  displayLabel: string;
  isEditing: boolean;
  editValue: string;
  onEditValueChange: (value: string) => void;
  onStartEditing: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onToggleVisibility: () => void;
  onToggleFrozen: () => void;
  onUpdateType: (type: ColumnConfig['type']) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}

function SortableColumnRow({
  column,
  config,
  originalLabel,
  displayLabel,
  isEditing,
  editValue,
  onEditValueChange,
  onStartEditing,
  onSaveEdit,
  onCancelEdit,
  onToggleVisibility,
  onToggleFrozen,
  onUpdateType,
  t,
}: SortableColumnRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isRenamed = config.customLabel !== undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 p-3 hover:bg-muted/50 transition-all duration-200',
        config.frozen && 'bg-fm-gold/5 border-l-2 border-l-fm-gold',
        !config.visible && 'opacity-50',
        isDragging && 'opacity-50 shadow-lg z-50 bg-background'
      )}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className='cursor-grab active:cursor-grabbing hover:text-fm-gold transition-colors p-1'
        title={t('dataGrid.dragToReorder')}
      >
        <GripVertical className='h-4 w-4 text-muted-foreground' />
      </button>

      {/* Visibility Toggle */}
      <button
        onClick={onToggleVisibility}
        className='p-1 hover:bg-muted rounded-none transition-colors'
        title={config.visible ? t('table.hideColumn') : t('table.showColumn')}
      >
        {config.visible ? (
          <Eye className='h-4 w-4 text-green-500' />
        ) : (
          <EyeOff className='h-4 w-4 text-muted-foreground' />
        )}
      </button>

      {/* Freeze Toggle */}
      <button
        onClick={onToggleFrozen}
        className='p-1 hover:bg-muted rounded-none transition-colors'
        title={config.frozen ? t('table.unfreezeColumn') : t('table.freezeColumn')}
      >
        {config.frozen ? (
          <Pin className='h-4 w-4 text-fm-gold' />
        ) : (
          <PinOff className='h-4 w-4 text-muted-foreground' />
        )}
      </button>

      {/* Column Label/Name */}
      <div className='flex-1 min-w-0'>
        {isEditing ? (
          <div className='flex items-center gap-2'>
            <Input
              value={editValue}
              onChange={e => onEditValueChange(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') onSaveEdit();
                if (e.key === 'Escape') onCancelEdit();
              }}
              className='h-8 text-sm'
              autoFocus
            />
            <button
              onClick={onSaveEdit}
              className='p-1 hover:bg-green-500/10 rounded-none transition-colors'
            >
              <Check className='h-4 w-4 text-green-500' />
            </button>
            <button
              onClick={onCancelEdit}
              className='p-1 hover:bg-destructive/10 rounded-none transition-colors'
            >
              <X className='h-4 w-4 text-destructive' />
            </button>
          </div>
        ) : (
          <div className='flex flex-col'>
            <div className='flex items-center gap-2'>
              <span className='font-medium text-sm truncate'>
                {displayLabel}
              </span>
              {isRenamed && (
                <span className='text-xs text-blue-500 font-mono'>
                  ({t('table.renamed').toLowerCase().replace(':', '')})
                </span>
              )}
            </div>
            {isRenamed && (
              <span className='text-xs text-muted-foreground truncate'>
                {t('table.original', { label: originalLabel })}
              </span>
            )}
            <span className='text-xs text-muted-foreground font-mono truncate'>
              {column.key}
            </span>
          </div>
        )}
      </div>

      {/* Type Selector */}
      {!isEditing && (
        <div className='w-32'>
          <Select
            value={config.type || 'text'}
            onValueChange={(value) =>
              onUpdateType(value as ColumnConfig['type'])
            }
          >
            <SelectTrigger className='h-8 text-xs'>
              <SelectValue placeholder='Type' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='text'>{t('dataTypes.text')}</SelectItem>
              <SelectItem value='number'>{t('dataTypes.number')}</SelectItem>
              <SelectItem value='email'>{t('dataTypes.email')}</SelectItem>
              <SelectItem value='url'>{t('dataTypes.url')}</SelectItem>
              <SelectItem value='date'>{t('dataTypes.date')}</SelectItem>
              <SelectItem value='boolean'>{t('dataTypes.boolean')}</SelectItem>
              <SelectItem value='created_date'>{t('dataTypes.date')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Edit Button */}
      {!isEditing && (
        <button
          onClick={onStartEditing}
          className='p-1 hover:bg-muted rounded-none transition-colors'
          title={t('table.renameColumn')}
        >
          <Edit2 className='h-4 w-4 text-muted-foreground' />
        </button>
      )}
    </div>
  );
}

export function FmColumnConfigModal({
  open,
  onOpenChange,
  baseColumns,
  columnConfigs,
  onSaveConfiguration,
  onResetConfiguration,
  onRefreshSchema,
  isRefreshing = false,
}: FmColumnConfigModalProps) {
  const { t } = useTranslation('common');

  // DnD sensors for drag-and-drop reordering
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Create a map of current configs
  const configMap = useMemo(() => {
    const map = new Map<string, ColumnConfig>();
    columnConfigs.forEach(config => {
      map.set(config.key, config);
    });
    return map;
  }, [columnConfigs]);

  // Local state for editing
  const [localConfigs, setLocalConfigs] = useState<Map<string, ColumnConfig>>(() => {
    const map = new Map<string, ColumnConfig>();
    baseColumns.forEach((col, index) => {
      const existing = configMap.get(col.key);
      map.set(col.key, {
        key: col.key,
        visible: existing?.visible ?? true,
        order: existing?.order ?? index,
        width: existing?.width,
        frozen: existing?.frozen ?? false,
        customLabel: existing?.customLabel,
        type: existing?.type ?? col.type ?? 'text',
      });
    });
    return map;
  });

  // Track which columns are being edited
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Get all columns with their configs
  const columnsWithConfigs = useMemo(() => {
    return baseColumns.map(col => {
      const config = localConfigs.get(col.key) || {
        key: col.key,
        visible: true,
        order: 0,
        frozen: false,
      };
      return {
        column: col,
        config,
        originalLabel: col.label,
        displayLabel: config.customLabel || col.label,
      };
    }).sort((a, b) => a.config.order - b.config.order);
  }, [baseColumns, localConfigs]);

  // Statistics
  const stats = useMemo(() => {
    const visible = Array.from(localConfigs.values()).filter(c => c.visible).length;
    const frozen = Array.from(localConfigs.values()).filter(c => c.frozen).length;
    const renamed = Array.from(localConfigs.values()).filter(c => c.customLabel).length;
    return { total: baseColumns.length, visible, hidden: baseColumns.length - visible, frozen, renamed };
  }, [localConfigs, baseColumns.length]);

  // Toggle visibility
  const toggleVisibility = (key: string) => {
    setLocalConfigs(prev => {
      const newMap = new Map(prev);
      const config = newMap.get(key);
      if (config) {
        newMap.set(key, { ...config, visible: !config.visible });
      }
      return newMap;
    });
  };

  // Toggle frozen
  const toggleFrozen = (key: string) => {
    setLocalConfigs(prev => {
      const newMap = new Map(prev);
      const config = newMap.get(key);
      if (config) {
        newMap.set(key, { ...config, frozen: !config.frozen });
      }
      return newMap;
    });
  };

  // Update column type
  const updateType = (key: string, type: ColumnConfig['type']) => {
    setLocalConfigs(prev => {
      const newMap = new Map(prev);
      const config = newMap.get(key);
      if (config) {
        newMap.set(key, { ...config, type });
      }
      return newMap;
    });
  };

  // Start editing label
  const startEditing = (key: string, currentLabel: string) => {
    setEditingKey(key);
    setEditValue(currentLabel);
  };

  // Save edited label
  const saveEdit = (key: string) => {
    if (editValue.trim()) {
      setLocalConfigs(prev => {
        const newMap = new Map(prev);
        const config = newMap.get(key);
        const col = baseColumns.find(c => c.key === key);
        if (config && col) {
          // Only save as custom label if different from original
          const customLabel = editValue.trim() !== col.label ? editValue.trim() : undefined;
          newMap.set(key, { ...config, customLabel });
        }
        return newMap;
      });
    }
    setEditingKey(null);
    setEditValue('');
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingKey(null);
    setEditValue('');
  };

  // Show all columns
  const showAll = () => {
    setLocalConfigs(prev => {
      const newMap = new Map(prev);
      newMap.forEach((config, key) => {
        newMap.set(key, { ...config, visible: true });
      });
      return newMap;
    });
  };

  // Hide all columns
  const hideAll = () => {
    setLocalConfigs(prev => {
      const newMap = new Map(prev);
      newMap.forEach((config, key) => {
        newMap.set(key, { ...config, visible: false });
      });
      return newMap;
    });
  };

  // Unfreeze all
  const unfreezeAll = () => {
    setLocalConfigs(prev => {
      const newMap = new Map(prev);
      newMap.forEach((config, key) => {
        newMap.set(key, { ...config, frozen: false });
      });
      return newMap;
    });
  };

  // Reset all labels
  const resetLabels = () => {
    setLocalConfigs(prev => {
      const newMap = new Map(prev);
      newMap.forEach((config, key) => {
        newMap.set(key, { ...config, customLabel: undefined });
      });
      return newMap;
    });
  };

  // Handle drag end for reordering
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const sortedColumns = columnsWithConfigs.map(c => c.column.key);
    const oldIndex = sortedColumns.indexOf(active.id as string);
    const newIndex = sortedColumns.indexOf(over.id as string);

    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedKeys = arrayMove(sortedColumns, oldIndex, newIndex);

    setLocalConfigs(prev => {
      const newMap = new Map(prev);
      reorderedKeys.forEach((key, index) => {
        const config = newMap.get(key);
        if (config) {
          newMap.set(key, { ...config, order: index });
        }
      });
      return newMap;
    });
  };

  // Save changes
  const handleSave = () => {
    const configs = Array.from(localConfigs.values());
    onSaveConfiguration(configs);
    onOpenChange(false);
  };

  // Reset to defaults
  const handleReset = () => {
    onResetConfiguration();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-3xl max-h-[90vh] flex flex-col'>
        <DialogHeader>
          <DialogTitle>{t('table.configureColumns')}</DialogTitle>
          <DialogDescription>
            {t('table.manageColumnsDescription')}
          </DialogDescription>
        </DialogHeader>

        {/* Statistics */}
        <div className='flex gap-4 text-sm border-b border-border pb-4'>
          <div className='flex items-center gap-2'>
            <span className='text-muted-foreground'>{t('table.total')}</span>
            <span className='font-semibold'>{stats.total}</span>
          </div>
          <div className='flex items-center gap-2'>
            <Eye className='h-4 w-4 text-green-500' />
            <span className='text-muted-foreground'>{t('table.visible')}</span>
            <span className='font-semibold'>{stats.visible}</span>
          </div>
          <div className='flex items-center gap-2'>
            <EyeOff className='h-4 w-4 text-muted-foreground' />
            <span className='text-muted-foreground'>{t('table.hidden')}</span>
            <span className='font-semibold'>{stats.hidden}</span>
          </div>
          <div className='flex items-center gap-2'>
            <Pin className='h-4 w-4 text-fm-gold' />
            <span className='text-muted-foreground'>{t('table.frozen')}</span>
            <span className='font-semibold'>{stats.frozen}</span>
          </div>
          <div className='flex items-center gap-2'>
            <Edit2 className='h-4 w-4 text-blue-500' />
            <span className='text-muted-foreground'>{t('table.renamed')}</span>
            <span className='font-semibold'>{stats.renamed}</span>
          </div>
        </div>

        {/* Bulk Actions */}
        <div className='flex flex-wrap gap-2'>
          <FmCommonButton variant='default' size='sm' icon={Eye} onClick={showAll}>
            {t('table.showAll')}
          </FmCommonButton>
          <FmCommonButton variant='default' size='sm' icon={EyeOff} onClick={hideAll}>
            {t('table.hideAll')}
          </FmCommonButton>
          <FmCommonButton variant='default' size='sm' icon={PinOff} onClick={unfreezeAll}>
            {t('table.unfreezeAll')}
          </FmCommonButton>
          <FmCommonButton variant='default' size='sm' icon={RotateCcw} onClick={resetLabels}>
            {t('table.resetLabels')}
          </FmCommonButton>
          {onRefreshSchema && (
            <FmCommonButton
              variant='default'
              size='sm'
              icon={RefreshCw}
              onClick={onRefreshSchema}
              disabled={isRefreshing}
              loading={isRefreshing}
            >
              {t('dataGrid.refreshSchema')}
            </FmCommonButton>
          )}
        </div>

        {/* Column List with Drag-and-Drop Reordering */}
        <div className='flex-1 overflow-y-auto border border-border rounded-none'>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={columnsWithConfigs.map(c => c.column.key)}
              strategy={verticalListSortingStrategy}
            >
              <div className='divide-y divide-border'>
                {columnsWithConfigs.map(({ column, config, originalLabel, displayLabel }) => (
                  <SortableColumnRow
                    key={column.key}
                    column={column}
                    config={config}
                    originalLabel={originalLabel}
                    displayLabel={displayLabel}
                    isEditing={editingKey === column.key}
                    editValue={editValue}
                    onEditValueChange={setEditValue}
                    onStartEditing={() => startEditing(column.key, displayLabel)}
                    onSaveEdit={() => saveEdit(column.key)}
                    onCancelEdit={cancelEdit}
                    onToggleVisibility={() => toggleVisibility(column.key)}
                    onToggleFrozen={() => toggleFrozen(column.key)}
                    onUpdateType={(type) => updateType(column.key, type)}
                    t={t}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        {/* Actions */}
        <div className='flex justify-between pt-4 border-t border-border'>
          <FmCommonButton
            variant='destructive'
            icon={RotateCcw}
            onClick={handleReset}
          >
            {t('table.resetToDefault')}
          </FmCommonButton>
          <div className='flex gap-2'>
            <FmCommonButton
              variant='default'
              onClick={() => onOpenChange(false)}
            >
              {t('buttons.cancel')}
            </FmCommonButton>
            <FmCommonButton
              variant='gold'
              icon={Save}
              onClick={handleSave}
            >
              {t('formActions.saveChanges')}
            </FmCommonButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
