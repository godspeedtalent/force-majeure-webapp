import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from '@/components/common/shadcn/dialog';
import { Button } from '@/components/common/shadcn/button';
import { Trash2 } from 'lucide-react';
import { FmI18nCommon } from '@/components/common/i18n';
export function FmDataGridBatchDeleteDialog({ open, onOpenChange, selectedRows, resourceName, onConfirm, isDeleting, }) {
    const { t } = useTranslation('common');
    return (_jsx(Dialog, { open: open, onOpenChange: onOpenChange, children: _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: t('dataGrid.confirmBatchDelete') }), _jsx(DialogDescription, { children: t('dataGrid.batchDeleteConfirmation', {
                                count: selectedRows.length,
                                resourceName: selectedRows.length !== 1 ? `${resourceName}s` : resourceName
                            }) })] }), _jsxs("div", { className: 'py-4', children: [_jsx(FmI18nCommon, { i18nKey: 'dataGrid.itemsToBeDeleted', as: 'div', className: 'text-sm text-muted-foreground mb-2' }), _jsxs("div", { className: 'max-h-48 overflow-y-auto space-y-1 rounded-none bg-muted/30 p-3', children: [selectedRows.slice(0, 10).map((row, idx) => (_jsxs("div", { className: 'text-sm', children: ["\u2022", ' ', row['name'] ||
                                            row['title'] ||
                                            row['id'] ||
                                            `${resourceName} ${idx + 1}`] }, idx))), selectedRows.length > 10 && (_jsx("div", { className: 'text-sm text-muted-foreground italic', children: t('dataGrid.andMoreItems', { count: selectedRows.length - 10 }) }))] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: 'outline', onClick: () => onOpenChange(false), disabled: isDeleting, children: t('buttons.cancel') }), _jsx(Button, { variant: 'destructive', onClick: onConfirm, disabled: isDeleting, children: isDeleting ? (_jsxs(_Fragment, { children: [_jsx("div", { className: 'h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent' }), t('dataGrid.deleting')] })) : (_jsxs(_Fragment, { children: [_jsx(Trash2, { className: 'h-4 w-4 mr-2' }), t('dataGrid.deleteCount', { count: selectedRows.length })] })) })] })] }) }));
}
