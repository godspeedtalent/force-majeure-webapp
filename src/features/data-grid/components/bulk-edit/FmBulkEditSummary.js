import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
export function FmBulkEditSummary({ selectedRowCount, enabledFields, editableColumns, }) {
    const { t } = useTranslation('common');
    const enabledFieldCount = Object.values(enabledFields).filter(Boolean).length;
    return (_jsxs("div", { className: 'rounded-none bg-muted/30 p-4 space-y-2', children: [_jsx("div", { className: 'text-sm font-medium', children: t('bulkEdit.summary') }), _jsxs("div", { className: 'text-sm text-muted-foreground space-y-1', children: [_jsxs("div", { children: ["\u2022 ", t('bulkEdit.rowsSelected', { count: selectedRowCount })] }), _jsxs("div", { children: ["\u2022 ", t('bulkEdit.fieldsToBeUpdated', { count: enabledFieldCount })] }), enabledFieldCount > 0 && (_jsxs("div", { className: 'text-foreground font-medium mt-2', children: [t('bulkEdit.fieldsToUpdate'), ' ', Object.keys(enabledFields)
                                .filter(k => enabledFields[k])
                                .map(k => editableColumns.find(c => c.key === k)?.label)
                                .join(', ')] }))] })] }));
}
