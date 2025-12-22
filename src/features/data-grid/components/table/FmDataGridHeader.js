import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TableHead, TableHeader, TableRow } from '@/components/common/shadcn/table';
import { Input } from '@/components/common/shadcn/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, } from '@/components/common/shadcn/dropdown-menu';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger, } from '@/components/common/shadcn/context-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, } from '@/components/common/shadcn/tooltip';
import { ChevronDown, ChevronUp, Filter, X, GripVertical, Pin, PinOff } from 'lucide-react';
import { FmCommonCheckbox } from '@/components/common/forms/FmCommonCheckbox';
import { cn } from '@/shared';
export function FmDataGridHeader({ columns, hasActions, isAllSelected, onSelectAll, sortColumn, sortDirection, onSort, columnFilters, onColumnFilter, onHideColumn, onColumnReorder, columnWidths, onResizeStart, onToggleFreeze, }) {
    const { t } = useTranslation('common');
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);
    const [isResizing, setIsResizing] = useState(false);
    // Calculate cumulative left positions for frozen columns
    const frozenColumnPositions = useMemo(() => {
        const positions = {};
        let cumulativeLeft = 48; // Start after checkbox column (w-12 = 48px)
        columns.forEach(column => {
            if (column.frozen) {
                positions[column.key] = cumulativeLeft;
                const width = columnWidths[column.key] || 150; // Default width
                cumulativeLeft += width;
            }
        });
        return positions;
    }, [columns, columnWidths]);
    const handleDragStart = (e, index) => {
        // Don't allow dragging if we're resizing
        if (isResizing) {
            e.preventDefault();
            return;
        }
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
        // Add a semi-transparent drag image
        if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.style.opacity = '0.5';
        }
    };
    const handleDragEnd = (e) => {
        if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.style.opacity = '1';
        }
        if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
            onColumnReorder?.(draggedIndex, dragOverIndex);
        }
        setDraggedIndex(null);
        setDragOverIndex(null);
    };
    const handleDragOver = (e, index) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (index !== dragOverIndex) {
            setDragOverIndex(index);
        }
    };
    const handleDragLeave = (e) => {
        // Only reset dragOverIndex if we're actually leaving the entire header row,
        // not just moving between columns within the row
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX;
        const y = e.clientY;
        // Check if mouse is still within the header row bounds
        if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
            setDragOverIndex(null);
        }
    };
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };
    const handleResizeMouseDown = (columnKey, e) => {
        e.stopPropagation(); // Prevent drag from starting
        setIsResizing(true);
        onResizeStart(columnKey, e);
    };
    // Reset resizing state when mouse is released
    useEffect(() => {
        const handleMouseUp = () => {
            setIsResizing(false);
        };
        window.addEventListener('mouseup', handleMouseUp);
        return () => window.removeEventListener('mouseup', handleMouseUp);
    }, []);
    return (_jsx(TableHeader, { children: _jsxs(TableRow, { className: 'border-border/50 bg-muted/50 hover:bg-muted/50 group', children: [_jsx(TableHead, { className: 'w-12', children: _jsx(FmCommonCheckbox, { checked: isAllSelected, onCheckedChange: onSelectAll, "aria-label": t('table.selectAll') }) }), columns.map((column, colIndex) => (_jsxs(ContextMenu, { children: [_jsx(ContextMenuTrigger, { asChild: true, children: _jsxs(TableHead, { draggable: !!onColumnReorder, onDragStart: e => onColumnReorder && handleDragStart(e, colIndex), onDragEnd: handleDragEnd, onDragOver: e => onColumnReorder && handleDragOver(e, colIndex), onDragLeave: handleDragLeave, onDrop: handleDrop, className: cn('font-canela text-foreground font-semibold relative group/header', column.width, column.sortable && 'cursor-pointer select-none hover:bg-muted', sortColumn === column.key &&
                                    'bg-fm-gold text-black hover:bg-fm-gold/90', 'border-l border-r border-border/60', draggedIndex === colIndex && 'opacity-50', dragOverIndex === colIndex && 'border-l-2 border-l-fm-gold', onColumnReorder && 'cursor-grab active:cursor-grabbing', column.frozen && 'sticky bg-background/95 backdrop-blur-sm shadow-[2px_0_4px_rgba(0,0,0,0.1)]'), style: {
                                    width: columnWidths[column.key]
                                        ? `${columnWidths[column.key]}px`
                                        : column.width,
                                    minWidth: columnWidths[column.key]
                                        ? `${columnWidths[column.key]}px`
                                        : undefined,
                                    maxWidth: columnWidths[column.key]
                                        ? `${columnWidths[column.key]}px`
                                        : undefined,
                                    ...(column.frozen && {
                                        position: 'sticky',
                                        left: `${frozenColumnPositions[column.key]}px`,
                                        zIndex: 20,
                                    }),
                                }, onClick: () => column.sortable && onSort(column.key), children: [_jsxs("div", { className: 'flex items-center gap-2', children: [onColumnReorder && (_jsx(GripVertical, { className: 'h-3 w-3 text-muted-foreground opacity-0 group-hover/header:opacity-100 transition-opacity flex-shrink-0' })), column.icon && columnWidths[column.key] && columnWidths[column.key] < 100 ? (_jsx(TooltipProvider, { children: _jsxs(Tooltip, { delayDuration: 300, children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("div", { className: 'flex items-center', children: column.icon }) }), _jsx(TooltipContent, { side: 'bottom', children: _jsx("p", { className: 'text-xs', children: column.label }) })] }) })) : (_jsx("span", { children: column.label })), column.sortable &&
                                                sortColumn === column.key &&
                                                (sortDirection === 'asc' ? (_jsx(ChevronUp, { className: 'h-3 w-3' })) : (_jsx(ChevronDown, { className: 'h-3 w-3' }))), column.filterable && (_jsxs(DropdownMenu, { children: [_jsx(TooltipProvider, { children: _jsxs(Tooltip, { delayDuration: 300, children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx(DropdownMenuTrigger, { asChild: true, children: _jsx("button", { "data-filter-trigger": true, className: cn('h-6 w-6 p-0 hover:bg-fm-gold/20 transition-all duration-200 rounded opacity-0 group-hover:opacity-100', columnFilters[column.key] && 'opacity-100 bg-fm-gold/20'), onClick: e => e.stopPropagation(), children: _jsx(Filter, { className: cn('h-3 w-3 mx-auto', columnFilters[column.key]
                                                                                    ? 'text-fm-gold'
                                                                                    : 'text-muted-foreground') }) }) }) }), columnFilters[column.key] && (_jsx(TooltipContent, { side: 'bottom', className: 'max-w-xs', children: _jsxs("p", { className: 'text-xs', children: ["Filter: ", columnFilters[column.key]] }) }))] }) }), _jsx(DropdownMenuContent, { align: 'start', className: 'w-64', children: _jsx("div", { className: 'p-2', children: _jsxs("div", { className: 'relative', children: [_jsx(Input, { placeholder: t('table.filterColumn', { column: column.label }), value: columnFilters[column.key] || '', onChange: e => onColumnFilter(column.key, e.target.value), className: 'h-8 pr-8', onClick: e => e.stopPropagation() }), columnFilters[column.key] && (_jsx("button", { onClick: e => {
                                                                            e.stopPropagation();
                                                                            onColumnFilter(column.key, '');
                                                                        }, className: 'absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center hover:bg-muted rounded-sm transition-colors', children: _jsx(X, { className: 'h-3 w-3 text-muted-foreground' }) }))] }) }) })] }))] }), _jsx("div", { className: 'absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-fm-gold/50 transition-colors group-hover/header:opacity-100 opacity-0 z-10', onMouseDown: e => handleResizeMouseDown(column.key, e), onClick: e => e.stopPropagation(), draggable: false })] }) }), _jsxs(ContextMenuContent, { className: 'bg-card border-border rounded-none', children: [column.filterable && (_jsx(ContextMenuItem, { onClick: () => {
                                        const filterButton = document.querySelector(`[data-filter-trigger]`);
                                        filterButton?.click();
                                    }, className: 'text-white hover:bg-muted focus:bg-muted', children: t('table.filter') })), column.sortable && (_jsxs(_Fragment, { children: [(sortColumn !== column.key || sortDirection === 'desc') && (_jsx(ContextMenuItem, { onClick: () => onSort(column.key), className: 'text-white hover:bg-muted focus:bg-muted', children: t('table.sortAscending') })), (sortColumn !== column.key || sortDirection === 'asc') && (_jsx(ContextMenuItem, { onClick: () => onSort(column.key), className: 'text-white hover:bg-muted focus:bg-muted', children: t('table.sortDescending') }))] })), onToggleFreeze && (_jsxs(_Fragment, { children: [(column.filterable || column.sortable) && _jsx(ContextMenuSeparator, {}), _jsx(ContextMenuItem, { onClick: () => onToggleFreeze(column.key), className: 'text-white hover:bg-muted focus:bg-muted', children: column.frozen ? (_jsxs(_Fragment, { children: [_jsx(PinOff, { className: 'h-4 w-4 mr-2' }), t('table.unfreezeColumn')] })) : (_jsxs(_Fragment, { children: [_jsx(Pin, { className: 'h-4 w-4 mr-2' }), t('table.freezeColumn')] })) })] })), onHideColumn && (_jsxs(_Fragment, { children: [_jsx(ContextMenuSeparator, {}), _jsx(ContextMenuItem, { onClick: () => onHideColumn(column.key), className: 'text-white hover:bg-muted focus:bg-muted', children: t('table.hideColumn') })] }))] })] }, column.key))), hasActions && _jsx(TableHead, { className: 'w-24 text-right', children: t('table.actions') })] }) }));
}
