import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { logger } from '@/shared';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from '@/components/common/shadcn/dialog';
import { Button } from '@/components/common/shadcn/button';
import { FmBulkEditField } from './bulk-edit/FmBulkEditField';
import { FmBulkEditSummary } from './bulk-edit/FmBulkEditSummary';
import { FmBulkEditInfoBanner } from './bulk-edit/FmBulkEditInfoBanner';
export function FmBulkEditDialog({ open, onOpenChange, columns, selectedRows, onApply, }) {
    const { t } = useTranslation('common');
    const [editValues, setEditValues] = useState({});
    const [editEnabled, setEditEnabled] = useState({});
    const [isApplying, setIsApplying] = useState(false);
    // Get editable columns (exclude readonly and id fields)
    const editableColumns = useMemo(() => {
        return columns.filter(col => col.editable &&
            !col.readonly &&
            col.key !== 'id' &&
            !col.key.endsWith('_id') &&
            !col.isRelation);
    }, [columns]);
    const handleToggleField = (columnKey, enabled) => {
        setEditEnabled(prev => ({ ...prev, [columnKey]: enabled }));
        if (!enabled) {
            setEditValues(prev => {
                const next = { ...prev };
                delete next[columnKey];
                return next;
            });
        }
    };
    const handleValueChange = (columnKey, value) => {
        setEditValues(prev => ({ ...prev, [columnKey]: value }));
    };
    const handleApply = async () => {
        const updates = {};
        Object.entries(editEnabled).forEach(([key, enabled]) => {
            if (enabled && editValues[key] !== undefined) {
                updates[key] = editValues[key];
            }
        });
        if (Object.keys(updates).length === 0) {
            return;
        }
        setIsApplying(true);
        try {
            await onApply(updates);
            setEditValues({});
            setEditEnabled({});
            onOpenChange(false);
        }
        catch (error) {
            logger.error('Bulk edit failed:', { error: error instanceof Error ? error.message : 'Unknown' });
        }
        finally {
            setIsApplying(false);
        }
    };
    const enabledFieldCount = Object.values(editEnabled).filter(Boolean).length;
    const canApply = enabledFieldCount > 0 && !isApplying;
    return (_jsx(Dialog, { open: open, onOpenChange: onOpenChange, children: _jsxs(DialogContent, { className: 'max-w-2xl max-h-[85vh] overflow-y-auto', children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: t('dialogs.bulkEdit') }), _jsx(DialogDescription, { children: t('dialogs.bulkEditDescription', { count: selectedRows.length }) })] }), _jsx("div", { className: 'space-y-4 py-4', children: editableColumns.length === 0 ? (_jsx("div", { className: 'text-center py-8 text-muted-foreground', children: t('dialogs.noEditableFields') })) : (_jsxs(_Fragment, { children: [_jsx(FmBulkEditInfoBanner, {}), _jsx("div", { className: 'space-y-3', children: editableColumns.map(column => (_jsx(FmBulkEditField, { column: column, value: editValues[column.key], enabled: editEnabled[column.key] ?? false, onToggle: enabled => handleToggleField(column.key, enabled), onValueChange: value => handleValueChange(column.key, value) }, column.key))) }), _jsx(FmBulkEditSummary, { selectedRowCount: selectedRows.length, enabledFields: editEnabled, editableColumns: editableColumns })] })) }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: 'outline', onClick: () => onOpenChange(false), disabled: isApplying, children: t('buttons.cancel') }), _jsx(Button, { onClick: handleApply, disabled: !canApply, children: isApplying ? (_jsxs(_Fragment, { children: [_jsx("div", { className: 'h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent' }), t('dialogs.applying')] })) : (t('buttons.apply')) })] })] }) }));
}
