import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { TableCell, TableRow } from '@/components/common/shadcn/table';
import { Button } from '@/components/common/shadcn/button';
import { Input } from '@/components/common/shadcn/input';
import { Plus } from 'lucide-react';
import { cn } from '@/shared';
import { isRelationField, getRelationConfig } from '../../utils/dataGridRelations';
export function FmDataGridNewRow({ columns, hasActions, isCreating, newRowData, onFieldChange, onSave, onCancel, onStartCreating, resourceName, }) {
    if (isCreating) {
        return (_jsxs(TableRow, { className: 'border-border/50 bg-fm-gold/5', children: [_jsx(TableCell, { children: _jsxs("div", { className: 'flex gap-2', children: [_jsx(Button, { size: 'sm', variant: 'ghost', onClick: onSave, className: 'h-7 px-2 text-xs bg-fm-gold/20 hover:bg-fm-gold/30 text-fm-gold', children: "Save" }), _jsx(Button, { size: 'sm', variant: 'ghost', onClick: onCancel, className: 'h-7 px-2 text-xs', children: "Cancel" })] }) }), columns.map(column => {
                    const relationConfig = isRelationField(column.key)
                        ? getRelationConfig(column.key)
                        : null;
                    // Skip created_date fields - they are auto-populated
                    if (column.type === 'created_date') {
                        return (_jsx(TableCell, { children: _jsx("div", { className: 'text-sm text-muted-foreground italic', children: "Auto-populated" }) }, column.key));
                    }
                    return (_jsx(TableCell, { children: _jsxs("div", { className: 'flex items-center gap-2', children: [relationConfig ? (relationConfig.component({
                                    value: newRowData[column.key] || '',
                                    onChange: value => onFieldChange(column.key, value),
                                })) : (_jsx(Input, { type: column.type || 'text', value: newRowData[column.key] || '', onChange: e => onFieldChange(column.key, e.target.value), placeholder: column.label, className: cn('h-8 bg-background/50', column.required && 'border-fm-gold/50') })), column.required && _jsx("span", { className: 'text-fm-gold text-xs', children: "*" })] }) }, column.key));
                }), hasActions && _jsx(TableCell, {})] }));
    }
    // Bottom "Add new" button row
    return (_jsx(TableRow, { className: 'border-border/50 hover:bg-fm-gold/5 transition-colors cursor-pointer', onClick: onStartCreating, children: _jsx(TableCell, { colSpan: columns.length + 1 + (hasActions ? 1 : 0), className: 'text-center py-3', children: _jsxs("button", { className: 'flex items-center justify-center gap-2 mx-auto text-muted-foreground hover:text-fm-gold transition-colors', children: [_jsx(Plus, { className: 'h-4 w-4' }), _jsxs("span", { className: 'text-sm', children: ["Add new ", resourceName.toLowerCase()] })] }) }) }));
}
