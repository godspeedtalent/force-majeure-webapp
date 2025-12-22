import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Enhanced Column Configuration Modal
 *
 * Provides comprehensive column management:
 * - Show/hide all columns (including hidden ones)
 * - Rename column display labels
 * - Reorder columns
 * - Freeze/unfreeze columns
 * - Reset to defaults
 */
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, } from '@/components/common/shadcn/dialog';
import { Button } from '@/components/common/shadcn/button';
import { Input } from '@/components/common/shadcn/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/common/shadcn/select';
import { Eye, EyeOff, RotateCcw, Pin, PinOff, Save, X, Edit2, Check, } from 'lucide-react';
import { cn } from '@/shared';
export function FmColumnConfigModal({ open, onOpenChange, baseColumns, columnConfigs, onSaveConfiguration, onResetConfiguration, }) {
    const { t } = useTranslation('common');
    // Create a map of current configs
    const configMap = useMemo(() => {
        const map = new Map();
        columnConfigs.forEach(config => {
            map.set(config.key, config);
        });
        return map;
    }, [columnConfigs]);
    // Local state for editing
    const [localConfigs, setLocalConfigs] = useState(() => {
        const map = new Map();
        baseColumns.forEach((col, index) => {
            const existing = configMap.get(col.key);
            map.set(col.key, {
                key: col.key,
                visible: existing?.visible ?? true,
                order: existing?.order ?? index,
                width: existing?.width,
                frozen: existing?.frozen ?? false,
                customLabel: existing?.customLabel,
                type: existing?.type ?? col.type ?? 'text',
            });
        });
        return map;
    });
    // Track which columns are being edited
    const [editingKey, setEditingKey] = useState(null);
    const [editValue, setEditValue] = useState('');
    // Get all columns with their configs
    const columnsWithConfigs = useMemo(() => {
        return baseColumns.map(col => {
            const config = localConfigs.get(col.key) || {
                key: col.key,
                visible: true,
                order: 0,
                frozen: false,
            };
            return {
                column: col,
                config,
                originalLabel: col.label,
                displayLabel: config.customLabel || col.label,
            };
        }).sort((a, b) => a.config.order - b.config.order);
    }, [baseColumns, localConfigs]);
    // Statistics
    const stats = useMemo(() => {
        const visible = Array.from(localConfigs.values()).filter(c => c.visible).length;
        const frozen = Array.from(localConfigs.values()).filter(c => c.frozen).length;
        const renamed = Array.from(localConfigs.values()).filter(c => c.customLabel).length;
        return { total: baseColumns.length, visible, hidden: baseColumns.length - visible, frozen, renamed };
    }, [localConfigs, baseColumns.length]);
    // Toggle visibility
    const toggleVisibility = (key) => {
        setLocalConfigs(prev => {
            const newMap = new Map(prev);
            const config = newMap.get(key);
            if (config) {
                newMap.set(key, { ...config, visible: !config.visible });
            }
            return newMap;
        });
    };
    // Toggle frozen
    const toggleFrozen = (key) => {
        setLocalConfigs(prev => {
            const newMap = new Map(prev);
            const config = newMap.get(key);
            if (config) {
                newMap.set(key, { ...config, frozen: !config.frozen });
            }
            return newMap;
        });
    };
    // Update column type
    const updateType = (key, type) => {
        setLocalConfigs(prev => {
            const newMap = new Map(prev);
            const config = newMap.get(key);
            if (config) {
                newMap.set(key, { ...config, type });
            }
            return newMap;
        });
    };
    // Start editing label
    const startEditing = (key, currentLabel) => {
        setEditingKey(key);
        setEditValue(currentLabel);
    };
    // Save edited label
    const saveEdit = (key) => {
        if (editValue.trim()) {
            setLocalConfigs(prev => {
                const newMap = new Map(prev);
                const config = newMap.get(key);
                const col = baseColumns.find(c => c.key === key);
                if (config && col) {
                    // Only save as custom label if different from original
                    const customLabel = editValue.trim() !== col.label ? editValue.trim() : undefined;
                    newMap.set(key, { ...config, customLabel });
                }
                return newMap;
            });
        }
        setEditingKey(null);
        setEditValue('');
    };
    // Cancel editing
    const cancelEdit = () => {
        setEditingKey(null);
        setEditValue('');
    };
    // Show all columns
    const showAll = () => {
        setLocalConfigs(prev => {
            const newMap = new Map(prev);
            newMap.forEach((config, key) => {
                newMap.set(key, { ...config, visible: true });
            });
            return newMap;
        });
    };
    // Hide all columns
    const hideAll = () => {
        setLocalConfigs(prev => {
            const newMap = new Map(prev);
            newMap.forEach((config, key) => {
                newMap.set(key, { ...config, visible: false });
            });
            return newMap;
        });
    };
    // Unfreeze all
    const unfreezeAll = () => {
        setLocalConfigs(prev => {
            const newMap = new Map(prev);
            newMap.forEach((config, key) => {
                newMap.set(key, { ...config, frozen: false });
            });
            return newMap;
        });
    };
    // Reset all labels
    const resetLabels = () => {
        setLocalConfigs(prev => {
            const newMap = new Map(prev);
            newMap.forEach((config, key) => {
                newMap.set(key, { ...config, customLabel: undefined });
            });
            return newMap;
        });
    };
    // Save changes
    const handleSave = () => {
        const configs = Array.from(localConfigs.values());
        onSaveConfiguration(configs);
        onOpenChange(false);
    };
    // Reset to defaults
    const handleReset = () => {
        onResetConfiguration();
        onOpenChange(false);
    };
    return (_jsx(Dialog, { open: open, onOpenChange: onOpenChange, children: _jsxs(DialogContent, { className: 'max-w-3xl max-h-[90vh] flex flex-col', children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: t('table.configureColumns') }), _jsx(DialogDescription, { children: t('table.manageColumnsDescription') })] }), _jsxs("div", { className: 'flex gap-4 text-sm border-b border-border pb-4', children: [_jsxs("div", { className: 'flex items-center gap-2', children: [_jsx("span", { className: 'text-muted-foreground', children: t('table.total') }), _jsx("span", { className: 'font-semibold', children: stats.total })] }), _jsxs("div", { className: 'flex items-center gap-2', children: [_jsx(Eye, { className: 'h-4 w-4 text-green-500' }), _jsx("span", { className: 'text-muted-foreground', children: t('table.visible') }), _jsx("span", { className: 'font-semibold', children: stats.visible })] }), _jsxs("div", { className: 'flex items-center gap-2', children: [_jsx(EyeOff, { className: 'h-4 w-4 text-muted-foreground' }), _jsx("span", { className: 'text-muted-foreground', children: t('table.hidden') }), _jsx("span", { className: 'font-semibold', children: stats.hidden })] }), _jsxs("div", { className: 'flex items-center gap-2', children: [_jsx(Pin, { className: 'h-4 w-4 text-fm-gold' }), _jsx("span", { className: 'text-muted-foreground', children: t('table.frozen') }), _jsx("span", { className: 'font-semibold', children: stats.frozen })] }), _jsxs("div", { className: 'flex items-center gap-2', children: [_jsx(Edit2, { className: 'h-4 w-4 text-blue-500' }), _jsx("span", { className: 'text-muted-foreground', children: t('table.renamed') }), _jsx("span", { className: 'font-semibold', children: stats.renamed })] })] }), _jsxs("div", { className: 'flex flex-wrap gap-2', children: [_jsxs(Button, { variant: 'outline', size: 'sm', onClick: showAll, children: [_jsx(Eye, { className: 'h-4 w-4 mr-2' }), t('table.showAll')] }), _jsxs(Button, { variant: 'outline', size: 'sm', onClick: hideAll, children: [_jsx(EyeOff, { className: 'h-4 w-4 mr-2' }), t('table.hideAll')] }), _jsxs(Button, { variant: 'outline', size: 'sm', onClick: unfreezeAll, children: [_jsx(PinOff, { className: 'h-4 w-4 mr-2' }), t('table.unfreezeAll')] }), _jsxs(Button, { variant: 'outline', size: 'sm', onClick: resetLabels, children: [_jsx(RotateCcw, { className: 'h-4 w-4 mr-2' }), t('table.resetLabels')] })] }), _jsx("div", { className: 'flex-1 overflow-y-auto border border-border rounded-md', children: _jsx("div", { className: 'divide-y divide-border', children: columnsWithConfigs.map(({ column, config, originalLabel, displayLabel }) => {
                            const isEditing = editingKey === column.key;
                            const isRenamed = config.customLabel !== undefined;
                            return (_jsxs("div", { className: cn('flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors', config.frozen && 'bg-fm-gold/5 border-l-2 border-l-fm-gold', !config.visible && 'opacity-50'), children: [_jsx("button", { onClick: () => toggleVisibility(column.key), className: 'p-1 hover:bg-muted rounded transition-colors', title: config.visible ? t('table.hideColumn') : t('table.showColumn'), children: config.visible ? (_jsx(Eye, { className: 'h-4 w-4 text-green-500' })) : (_jsx(EyeOff, { className: 'h-4 w-4 text-muted-foreground' })) }), _jsx("button", { onClick: () => toggleFrozen(column.key), className: 'p-1 hover:bg-muted rounded transition-colors', title: config.frozen ? t('table.unfreezeColumn') : t('table.freezeColumn'), children: config.frozen ? (_jsx(Pin, { className: 'h-4 w-4 text-fm-gold' })) : (_jsx(PinOff, { className: 'h-4 w-4 text-muted-foreground' })) }), _jsx("div", { className: 'flex-1 min-w-0', children: isEditing ? (_jsxs("div", { className: 'flex items-center gap-2', children: [_jsx(Input, { value: editValue, onChange: e => setEditValue(e.target.value), onKeyDown: e => {
                                                        if (e.key === 'Enter')
                                                            saveEdit(column.key);
                                                        if (e.key === 'Escape')
                                                            cancelEdit();
                                                    }, className: 'h-8 text-sm', autoFocus: true }), _jsx("button", { onClick: () => saveEdit(column.key), className: 'p-1 hover:bg-green-500/10 rounded transition-colors', children: _jsx(Check, { className: 'h-4 w-4 text-green-500' }) }), _jsx("button", { onClick: cancelEdit, className: 'p-1 hover:bg-destructive/10 rounded transition-colors', children: _jsx(X, { className: 'h-4 w-4 text-destructive' }) })] })) : (_jsxs("div", { className: 'flex flex-col', children: [_jsxs("div", { className: 'flex items-center gap-2', children: [_jsx("span", { className: 'font-medium text-sm truncate', children: displayLabel }), isRenamed && (_jsxs("span", { className: 'text-xs text-blue-500 font-mono', children: ["(", t('table.renamed').toLowerCase().replace(':', ''), ")"] }))] }), isRenamed && (_jsx("span", { className: 'text-xs text-muted-foreground truncate', children: t('table.original', { label: originalLabel }) })), _jsx("span", { className: 'text-xs text-muted-foreground font-mono truncate', children: column.key })] })) }), !isEditing && (_jsx("div", { className: 'w-32', children: _jsxs(Select, { value: config.type || 'text', onValueChange: (value) => updateType(column.key, value), children: [_jsx(SelectTrigger, { className: 'h-8 text-xs', children: _jsx(SelectValue, { placeholder: 'Type' }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: 'text', children: t('dataTypes.text') }), _jsx(SelectItem, { value: 'number', children: t('dataTypes.number') }), _jsx(SelectItem, { value: 'email', children: t('dataTypes.email') }), _jsx(SelectItem, { value: 'url', children: t('dataTypes.url') }), _jsx(SelectItem, { value: 'date', children: t('dataTypes.date') }), _jsx(SelectItem, { value: 'boolean', children: t('dataTypes.boolean') }), _jsx(SelectItem, { value: 'created_date', children: t('dataTypes.date') })] })] }) })), !isEditing && (_jsx("button", { onClick: () => startEditing(column.key, displayLabel), className: 'p-1 hover:bg-muted rounded transition-colors', title: t('table.renameColumn'), children: _jsx(Edit2, { className: 'h-4 w-4 text-muted-foreground' }) }))] }, column.key));
                        }) }) }), _jsxs("div", { className: 'flex justify-between pt-4 border-t border-border', children: [_jsxs(Button, { variant: 'outline', onClick: handleReset, children: [_jsx(RotateCcw, { className: 'h-4 w-4 mr-2' }), t('table.resetToDefault')] }), _jsxs("div", { className: 'flex gap-2', children: [_jsx(Button, { variant: 'outline', onClick: () => onOpenChange(false), children: t('buttons.cancel') }), _jsxs(Button, { onClick: handleSave, children: [_jsx(Save, { className: 'h-4 w-4 mr-2' }), t('formActions.saveChanges')] })] })] })] }) }));
}
