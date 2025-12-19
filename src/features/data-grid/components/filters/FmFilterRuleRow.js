import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { Input } from '@/components/common/shadcn/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/common/shadcn/select';
import { Button } from '@/components/common/shadcn/button';
import { X } from 'lucide-react';
const OPERATORS = [
    { value: 'equals', label: 'Equals', requiresValue: true },
    { value: 'not_equals', label: 'Not Equals', requiresValue: true },
    { value: 'contains', label: 'Contains', requiresValue: true },
    { value: 'not_contains', label: 'Not Contains', requiresValue: true },
    { value: 'starts_with', label: 'Starts With', requiresValue: true },
    { value: 'ends_with', label: 'Ends With', requiresValue: true },
    { value: 'greater_than', label: 'Greater Than', requiresValue: true },
    { value: 'less_than', label: 'Less Than', requiresValue: true },
    { value: 'greater_or_equal', label: 'Greater or Equal', requiresValue: true },
    { value: 'less_or_equal', label: 'Less or Equal', requiresValue: true },
    { value: 'is_empty', label: 'Is Empty', requiresValue: false },
    { value: 'is_not_empty', label: 'Is Not Empty', requiresValue: false },
];
export function FmFilterRuleRow({ rule, index, filterableColumns, onUpdate, onRemove, }) {
    const operator = OPERATORS.find(op => op.value === rule.operator);
    const requiresValue = operator?.requiresValue ?? true;
    return (_jsxs("div", { className: 'flex items-start gap-2 p-3 border border-border/50 rounded-none bg-muted/20', children: [_jsxs("span", { className: 'text-xs text-muted-foreground mt-2 w-6', children: [index + 1, "."] }), _jsxs(Select, { value: rule.column, onValueChange: value => onUpdate(rule.id, { column: value }), children: [_jsx(SelectTrigger, { className: 'w-40', children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: filterableColumns.map(col => (_jsx(SelectItem, { value: col.key, children: col.label }, col.key))) })] }), _jsxs(Select, { value: rule.operator, onValueChange: (value) => onUpdate(rule.id, { operator: value }), children: [_jsx(SelectTrigger, { className: 'w-48', children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: OPERATORS.map(op => (_jsx(SelectItem, { value: op.value, children: op.label }, op.value))) })] }), requiresValue && (_jsx(Input, { placeholder: 'Value...', value: rule.value, onChange: e => onUpdate(rule.id, { value: e.target.value }), className: 'flex-1' })), _jsx(Button, { variant: 'ghost', size: 'sm', onClick: () => onRemove(rule.id), className: 'h-10 w-10 p-0 hover:bg-destructive/20 hover:text-destructive', children: _jsx(X, { className: 'h-4 w-4' }) })] }));
}
