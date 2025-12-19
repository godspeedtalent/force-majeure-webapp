import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@/shared';
/**
 * Sortable column header for drag and drop reordering
 */
export function SortableColumnHeader({ id, children, className, }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging, } = useSortable({ id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };
    return (_jsx("th", { ref: setNodeRef, style: style, className: cn('relative group', isDragging && 'opacity-50 z-50', className), children: _jsxs("div", { className: 'flex items-center gap-2', children: [_jsx("div", { ...attributes, ...listeners, className: 'cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity', children: _jsx(GripVertical, { className: 'h-4 w-4 text-muted-foreground' }) }), children] }) }));
}
