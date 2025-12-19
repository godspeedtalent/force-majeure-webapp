import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { TableCell } from '@/components/common/shadcn/table';
import { Input } from '@/components/common/shadcn/input';
import { Switch } from '@/components/common/shadcn/switch';
import { Button } from '@/components/common/shadcn/button';
import { Calendar } from '@/components/common/shadcn/calendar';
import { Popover, PopoverContent, PopoverTrigger, } from '@/components/common/shadcn/popover';
import { format as formatDate } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/shared';
import { isRelationField, getRelationConfig } from '../../utils/dataGridRelations';
export function FmDataGridCell({ row, column, value, isEditing, editValue, onEditValueChange, onStartEdit, onSaveEdit, onCancelEdit, onUpdate, hoveredColumn, isDragMode, focusableProps = {}, frozenLeft, columnWidths = {}, }) {
    const relationConfig = isRelationField(column.key)
        ? getRelationConfig(column.key)
        : null;
    const isEditableCell = column.editable &&
        !column.readonly &&
        onUpdate &&
        column.type !== 'boolean' &&
        column.type !== 'created_date';
    const cellContent = (_jsx(TableCell, { className: cn('font-medium transition-all duration-200 border-l border-r border-border/60', 
        // Highlight entire column on hover
        !isDragMode && hoveredColumn === column.key && 'bg-fm-gold/10 shadow-[inset_0_0_0_1px_rgba(223,186,125,0.2)]', isEditing && 'bg-fm-gold/10 ring-1 ring-fm-gold/30', isEditableCell && 'cursor-pointer hover:bg-muted/20', 
        // Frozen column styling
        column.frozen && 'sticky bg-background/95 backdrop-blur-sm shadow-[2px_0_4px_rgba(0,0,0,0.1)]', 
        // Allow column-specific className overrides (e.g., p-0 for images)
        column.cellClassName), style: {
            ...(columnWidths[column.key]
                ? {
                    width: `${columnWidths[column.key]}px`,
                    minWidth: `${columnWidths[column.key]}px`,
                    maxWidth: `${columnWidths[column.key]}px`,
                }
                : column.width
                    ? { width: column.width }
                    : {}),
            ...(column.frozen && frozenLeft !== undefined
                ? {
                    position: 'sticky',
                    left: `${frozenLeft}px`,
                    zIndex: 10,
                }
                : {}),
        }, ...(column.editable && !column.readonly && onUpdate ? focusableProps : {}), onMouseEnter: () => { }, onMouseLeave: () => { }, onClick: e => {
            // Don't interfere with interactive elements (selects, buttons, inputs, etc.)
            const target = e.target;
            const isInteractiveElement = target.closest('button') ||
                target.closest('[role="combobox"]') ||
                target.closest('[data-radix-select-trigger]') ||
                target.closest('[data-radix-dropdown-menu-trigger]') ||
                target.closest('input') ||
                target.closest('textarea') ||
                target.closest('select') ||
                target.closest('[role="checkbox"]') ||
                target.closest('[role="switch"]');
            if (isInteractiveElement) {
                // Let the interactive element handle the event
                return;
            }
            if (isEditableCell) {
                onStartEdit();
            }
        }, children: isEditing ? (
        // Editing mode
        relationConfig ? (_jsx("div", { onClick: e => e.stopPropagation(), children: relationConfig.component({
                value: editValue,
                onChange: onEditValueChange,
                onComplete: () => onSaveEdit(),
            }) })) : column.type === 'boolean' ? (_jsxs("div", { onClick: e => e.stopPropagation(), className: 'flex items-center gap-2', "data-no-select": true, children: [_jsx(Switch, { checked: (typeof editValue === 'boolean' && editValue) || (typeof editValue === 'string' && editValue === 'true'), onCheckedChange: checked => {
                        onEditValueChange(checked.toString());
                        onSaveEdit(checked);
                    }, className: 'data-[state=checked]:bg-fm-gold' }), _jsx("span", { className: 'text-sm', children: (typeof editValue === 'boolean' && editValue) || (typeof editValue === 'string' && editValue === 'true') ? 'Yes' : 'No' })] })) : column.type === 'date' ? (_jsxs(Popover, { children: [_jsx(PopoverTrigger, { asChild: true, children: _jsxs(Button, { variant: 'outline', className: 'w-full justify-start text-left font-normal h-8', onClick: e => e.stopPropagation(), children: [_jsx(CalendarIcon, { className: 'mr-2 h-4 w-4' }), editValue ? formatDate(new Date(editValue), 'PPP') : 'Pick a date'] }) }), _jsx(PopoverContent, { className: 'w-auto p-0', align: 'start', children: _jsx(Calendar, { mode: 'single', selected: editValue ? new Date(editValue) : undefined, onSelect: date => {
                            if (date) {
                                onEditValueChange(date.toISOString());
                                onSaveEdit(date.toISOString());
                            }
                        }, initialFocus: true }) })] })) : (_jsx(Input, { type: column.type || 'text', value: editValue, onChange: e => onEditValueChange(e.target.value), onBlur: () => onSaveEdit(), onKeyDown: e => {
                if (e.key === 'Enter') {
                    onSaveEdit();
                }
                else if (e.key === 'Escape') {
                    onCancelEdit();
                }
            }, autoFocus: true, className: 'h-8 bg-background/50 border-fm-gold/50' }))) : (
        // Display mode
        _jsx("div", { className: 'flex items-center gap-2', children: column.type === 'boolean' ? (_jsxs("div", { className: 'flex items-center gap-2', "data-no-select": true, children: [_jsx(Switch, { checked: value === true, onCheckedChange: checked => {
                            if (column.editable && !column.readonly && onUpdate) {
                                onSaveEdit(checked);
                            }
                        }, disabled: !column.editable || column.readonly || !onUpdate, className: 'data-[state=checked]:bg-fm-gold' }), _jsx("span", { className: 'text-sm', children: value ? 'Yes' : 'No' })] })) : column.render ? (_jsx("div", { className: cn('transition-colors', hoveredColumn === column.key && 'text-fm-gold [&_*]:text-fm-gold'), children: column.render(value, row) })) : relationConfig &&
                relationConfig.displayField &&
                row[relationConfig.displayField] ? (_jsx("span", { className: cn('transition-colors', hoveredColumn === column.key && 'text-fm-gold'), children: row[relationConfig.displayField]?.name ||
                    row[relationConfig.displayField] ||
                    '-' })) : (_jsx("span", { className: cn('transition-colors', hoveredColumn === column.key && 'text-fm-gold'), children: value?.toString() || '-' })) })) }));
    // Return cell content directly (no tooltip)
    return cellContent;
}
