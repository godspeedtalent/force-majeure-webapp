import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/common/shadcn/dialog';
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
} from '@dnd-kit/sortable';
import { FmConfigurableSortableColumn } from './FmConfigurableSortableColumn';
import { DataGridColumn } from '../FmDataGrid';

interface ColumnConfig {
  key: string;
  visible: boolean;
  order: number;
  width?: number;
}

export interface FmColumnReorderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: ColumnConfig[];
  baseColumns: DataGridColumn[];
  recentlyMovedKey: string | null;
  onDragEnd: (event: DragEndEvent) => void;
}

export function FmColumnReorderDialog({
  open,
  onOpenChange,
  columns,
  baseColumns,
  recentlyMovedKey,
  onDragEnd,
}: FmColumnReorderDialogProps) {
  const { t } = useTranslation('common');
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>{t('dataGrid.reorderColumns')}</DialogTitle>
          <DialogDescription>
            {t('dataGrid.reorderColumnsDescription')}
          </DialogDescription>
        </DialogHeader>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={columns.map(c => c.key)}
            strategy={verticalListSortingStrategy}
          >
            <div className='space-y-2 max-h-[400px] overflow-y-auto'>
              {columns.map(colConfig => {
                const column = baseColumns.find(c => c.key === colConfig.key);
                if (!column) return null;

                const isRecentlyMoved = recentlyMovedKey === colConfig.key;

                return (
                  <FmConfigurableSortableColumn
                    key={colConfig.key}
                    colConfig={colConfig}
                    column={column}
                    isRecentlyMoved={isRecentlyMoved}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      </DialogContent>
    </Dialog>
  );
}
