import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from '@/components/common/shadcn/dialog';
import { Button } from '@/components/common/shadcn/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/common/shadcn/select';
import { Plus } from 'lucide-react';
import { FmFilterRuleRow } from './filters/FmFilterRuleRow';
import { FmFilterPresets } from './filters/FmFilterPresets';
import { FmFilterPresetSave } from './filters/FmFilterPresetSave';
export function FmAdvancedFilterDialog({ open, onOpenChange, columns, currentFilter, presets, onApply, onSavePreset, onLoadPreset, onDeletePreset, onClear, }) {
    const { t } = useTranslation('common');
    const [filterGroup, setFilterGroup] = useState(currentFilter || { logic: 'AND', rules: [] });
    const filterableColumns = columns.filter(col => col.filterable !== false);
    const addRule = () => {
        const newRule = {
            id: Date.now().toString(),
            column: filterableColumns[0]?.key || '',
            operator: 'contains',
            value: '',
        };
        setFilterGroup({
            ...filterGroup,
            rules: [...filterGroup.rules, newRule],
        });
    };
    const updateRule = (ruleId, updates) => {
        setFilterGroup({
            ...filterGroup,
            rules: filterGroup.rules.map(rule => rule.id === ruleId ? { ...rule, ...updates } : rule),
        });
    };
    const removeRule = (ruleId) => {
        setFilterGroup({
            ...filterGroup,
            rules: filterGroup.rules.filter(rule => rule.id !== ruleId),
        });
    };
    const handleApply = () => {
        onApply(filterGroup);
        onOpenChange(false);
    };
    const handleSavePreset = (name) => {
        onSavePreset(name, filterGroup);
    };
    const handleLoadPreset = (preset) => {
        setFilterGroup(preset.group);
        onLoadPreset(preset);
    };
    const handleClear = () => {
        setFilterGroup({ logic: 'AND', rules: [] });
        onClear();
    };
    return (_jsx(Dialog, { open: open, onOpenChange: onOpenChange, children: _jsxs(DialogContent, { className: 'max-w-3xl max-h-[80vh] overflow-y-auto', children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: t('filters.advancedFilters') }), _jsx(DialogDescription, { children: t('filters.buildComplexFilters') })] }), _jsxs("div", { className: 'space-y-4 py-4', children: [_jsxs("div", { className: 'flex items-center gap-2', children: [_jsx("span", { className: 'text-sm text-muted-foreground', children: t('filters.match') }), _jsxs(Select, { value: filterGroup.logic, onValueChange: (value) => setFilterGroup({ ...filterGroup, logic: value }), children: [_jsx(SelectTrigger, { className: 'w-24', children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: 'AND', children: t('filters.all') }), _jsx(SelectItem, { value: 'OR', children: t('filters.any') })] })] }), _jsx("span", { className: 'text-sm text-muted-foreground', children: t('filters.ofFollowingRules') })] }), _jsx("div", { className: 'space-y-2', children: filterGroup.rules.length === 0 ? (_jsx("div", { className: 'text-center py-8 text-muted-foreground', children: t('formMessages.noFiltersAdded') })) : (filterGroup.rules.map((rule, index) => (_jsx(FmFilterRuleRow, { rule: rule, index: index, filterableColumns: filterableColumns, onUpdate: updateRule, onRemove: removeRule }, rule.id)))) }), _jsxs(Button, { variant: 'outline', size: 'sm', onClick: addRule, className: 'w-full', children: [_jsx(Plus, { className: 'h-4 w-4 mr-2' }), t('filters.addRule')] }), _jsx(FmFilterPresets, { presets: presets, onLoadPreset: handleLoadPreset, onDeletePreset: onDeletePreset }), _jsx("div", { className: 'space-y-2 pt-2', children: _jsx(FmFilterPresetSave, { onSave: handleSavePreset, disabled: filterGroup.rules.length === 0 }) })] }), _jsxs(DialogFooter, { className: 'gap-2', children: [_jsx(Button, { variant: 'outline', onClick: handleClear, children: t('filters.clearAll') }), _jsx(Button, { variant: 'outline', onClick: () => onOpenChange(false), children: t('buttons.cancel') }), _jsx(Button, { onClick: handleApply, disabled: filterGroup.rules.length === 0, children: t('filters.applyFilters') })] })] }) }));
}
