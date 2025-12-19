import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@/shared';
export function FmConfigurableSortableColumn({ colConfig, column, isRecentlyMoved, }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging, } = useSortable({ id: colConfig.key });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };
    return (_jsx("div", { ref: setNodeRef, style: style, className: cn('flex items-center justify-between p-2 rounded border transition-all duration-200', colConfig.visible ? 'bg-background' : 'bg-muted/50 opacity-60', 'hover:border-fm-gold hover:bg-fm-gold/5', isRecentlyMoved && 'animate-border-pulse-gold', isDragging && 'opacity-50 shadow-lg z-50'), children: _jsxs("div", { className: 'flex items-center gap-2', children: [_jsx("button", { ...attributes, ...listeners, className: 'cursor-grab active:cursor-grabbing hover:text-fm-gold transition-colors', children: _jsx(GripVertical, { className: 'h-4 w-4 text-muted-foreground' }) }), _jsx("span", { className: 'font-medium', children: column.label }), !colConfig.visible && (_jsx("span", { className: 'text-xs text-muted-foreground', children: "(Hidden)" }))] }) }));
}
