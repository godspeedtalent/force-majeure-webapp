import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from '@/components/common/shadcn/dialog';
import { Button } from '@/components/common/shadcn/button';
import { Label } from '@/components/common/shadcn/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/common/shadcn/select';
import { Plus, X, Layers } from 'lucide-react';
const AGGREGATION_TYPES = [
    { value: 'count', label: 'Count' },
    { value: 'sum', label: 'Sum' },
    { value: 'avg', label: 'Average' },
    { value: 'min', label: 'Minimum' },
    { value: 'max', label: 'Maximum' },
];
export function FmDataGridGroupDialog({ open, onOpenChange, columns, currentGroupConfig, onApply, onClear, }) {
    const { t } = useTranslation('common');
    const [groupColumn, setGroupColumn] = useState(currentGroupConfig?.columnKey || columns[0]?.key || '');
    const [aggregations, setAggregations] = useState(currentGroupConfig?.aggregations || []);
    const addAggregation = () => {
        // Find first numeric column
        const numericColumn = columns.find(col => col.type === 'number');
        setAggregations([
            ...aggregations,
            {
                columnKey: numericColumn?.key || columns[0]?.key || '',
                type: 'sum',
            },
        ]);
    };
    const updateAggregation = (index, updates) => {
        setAggregations(aggregations.map((agg, i) => (i === index ? { ...agg, ...updates } : agg)));
    };
    const removeAggregation = (index) => {
        setAggregations(aggregations.filter((_, i) => i !== index));
    };
    const handleApply = () => {
        onApply({
            columnKey: groupColumn,
            aggregations: aggregations.length > 0 ? aggregations : undefined,
        });
        onOpenChange(false);
    };
    const handleClear = () => {
        setGroupColumn(columns[0]?.key || '');
        setAggregations([]);
        onClear();
        onOpenChange(false);
    };
    // Get numeric columns for aggregation
    const numericColumns = columns.filter(col => col.type === 'number' ||
        col.key.toLowerCase().includes('price') ||
        col.key.toLowerCase().includes('count'));
    return (_jsx(Dialog, { open: open, onOpenChange: onOpenChange, children: _jsxs(DialogContent, { className: 'max-w-2xl max-h-[80vh] overflow-y-auto', children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: t('dialogs.groupData') }), _jsx(DialogDescription, { children: t('dialogs.groupDescription') })] }), _jsxs("div", { className: 'space-y-6 py-4', children: [_jsxs("div", { className: 'space-y-2', children: [_jsx(Label, { children: t('dialogs.groupByColumn') }), _jsxs(Select, { value: groupColumn, onValueChange: setGroupColumn, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: t('placeholders.selectColumn') }) }), _jsx(SelectContent, { children: columns.map(col => (_jsx(SelectItem, { value: col.key, children: col.label }, col.key))) })] }), _jsx("p", { className: 'text-xs text-muted-foreground', children: t('dialogs.groupByHelp') })] }), _jsxs("div", { className: 'space-y-3', children: [_jsxs("div", { className: 'flex items-center justify-between', children: [_jsx(Label, { children: t('dialogs.aggregationsOptional') }), _jsxs(Button, { variant: 'outline', size: 'sm', onClick: addAggregation, disabled: numericColumns.length === 0, children: [_jsx(Plus, { className: 'h-4 w-4 mr-2' }), t('dialogs.addAggregation')] })] }), aggregations.length === 0 ? (_jsx("div", { className: 'text-center py-6 text-sm text-muted-foreground border border-dashed border-border/50 rounded-none', children: t('dialogs.noAggregationsAdded') })) : (_jsx("div", { className: 'space-y-2', children: aggregations.map((agg, index) => (_jsxs("div", { className: 'flex items-center gap-2 p-3 border border-border/50 rounded-none bg-muted/20', children: [_jsxs(Select, { value: agg.columnKey, onValueChange: value => updateAggregation(index, { columnKey: value }), children: [_jsx(SelectTrigger, { className: 'flex-1', children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: numericColumns.map(col => (_jsx(SelectItem, { value: col.key, children: col.label }, col.key))) })] }), _jsxs(Select, { value: agg.type, onValueChange: (value) => updateAggregation(index, { type: value }), children: [_jsx(SelectTrigger, { className: 'w-36', children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: AGGREGATION_TYPES.map(type => (_jsx(SelectItem, { value: type.value, children: type.label }, type.value))) })] }), _jsx(Button, { variant: 'ghost', size: 'sm', onClick: () => removeAggregation(index), className: 'h-10 w-10 p-0 hover:bg-destructive/20 hover:text-destructive', children: _jsx(X, { className: 'h-4 w-4' }) })] }, index))) })), numericColumns.length === 0 && (_jsx("p", { className: 'text-xs text-muted-foreground', children: t('dialogs.noNumericColumns') }))] }), _jsxs("div", { className: 'rounded-none bg-muted/30 p-4 space-y-2', children: [_jsxs("div", { className: 'flex items-center gap-2 text-sm font-medium', children: [_jsx(Layers, { className: 'h-4 w-4 text-fm-gold' }), _jsx("span", { children: t('dialogs.previewSection') })] }), _jsxs("div", { className: 'text-sm text-muted-foreground space-y-1', children: [_jsxs("div", { children: ["\u2022 ", t('dialogs.rowsGroupedBy'), ' ', _jsx("span", { className: 'text-foreground font-medium', children: columns.find(c => c.key === groupColumn)?.label })] }), aggregations.length > 0 && (_jsxs("div", { children: ["\u2022 ", t('dialogs.showingAggregations', { count: aggregations.length })] })), _jsxs("div", { children: ["\u2022 ", t('dialogs.clickGroupRows')] })] })] })] }), _jsxs(DialogFooter, { className: 'gap-2', children: [_jsx(Button, { variant: 'outline', onClick: handleClear, children: t('dialogs.clearGrouping') }), _jsx(Button, { variant: 'outline', onClick: () => onOpenChange(false), children: t('buttons.cancel') }), _jsx(Button, { onClick: handleApply, children: t('formActions.applyGrouping') })] })] }) }));
}
