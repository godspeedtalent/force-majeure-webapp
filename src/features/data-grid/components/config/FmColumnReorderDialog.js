import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, } from '@/components/common/shadcn/dialog';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, } from '@dnd-kit/sortable';
import { FmConfigurableSortableColumn } from './FmConfigurableSortableColumn';
export function FmColumnReorderDialog({ open, onOpenChange, columns, baseColumns, recentlyMovedKey, onDragEnd, }) {
    const { t } = useTranslation('common');
    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
    }));
    return (_jsx(Dialog, { open: open, onOpenChange: onOpenChange, children: _jsxs(DialogContent, { className: 'max-w-md', children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: t('dataGrid.reorderColumns') }), _jsx(DialogDescription, { children: t('dataGrid.reorderColumnsDescription') })] }), _jsx(DndContext, { sensors: sensors, collisionDetection: closestCenter, onDragEnd: onDragEnd, children: _jsx(SortableContext, { items: columns.map(c => c.key), strategy: verticalListSortingStrategy, children: _jsx("div", { className: 'space-y-2 max-h-[400px] overflow-y-auto', children: columns.map(colConfig => {
                                const column = baseColumns.find(c => c.key === colConfig.key);
                                if (!column)
                                    return null;
                                const isRecentlyMoved = recentlyMovedKey === colConfig.key;
                                return (_jsx(FmConfigurableSortableColumn, { colConfig: colConfig, column: column, isRecentlyMoved: isRecentlyMoved }, colConfig.key));
                            }) }) }) })] }) }));
}
