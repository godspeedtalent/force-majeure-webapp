import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from '@/components/common/shadcn/dialog';
import { Button } from '@/components/common/shadcn/button';
import { FmCommonCheckbox } from '@/components/common/forms/FmCommonCheckbox';
import { Label } from '@/components/common/shadcn/label';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { RadioGroup, RadioGroupItem, } from '@/components/common/shadcn/radio-group';
export function FmDataGridExportDialog({ open, onOpenChange, columns, data, onExport, }) {
    const { t } = useTranslation('common');
    const [selectedColumns, setSelectedColumns] = useState(columns.map(col => col.key));
    const [format, setFormat] = useState('csv');
    const toggleColumn = (columnKey) => {
        setSelectedColumns(prev => prev.includes(columnKey)
            ? prev.filter(key => key !== columnKey)
            : [...prev, columnKey]);
    };
    const toggleAll = () => {
        if (selectedColumns.length === columns.length) {
            setSelectedColumns([]);
        }
        else {
            setSelectedColumns(columns.map(col => col.key));
        }
    };
    const handleExport = () => {
        onExport(selectedColumns, format);
        onOpenChange(false);
    };
    const isAllSelected = selectedColumns.length === columns.length;
    return (_jsx(Dialog, { open: open, onOpenChange: onOpenChange, children: _jsxs(DialogContent, { className: 'max-w-md', children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: t('dialogs.exportData') }), _jsx(DialogDescription, { children: t('dialogs.exportDescription', { count: data.length }) })] }), _jsxs("div", { className: 'space-y-4 py-4', children: [_jsxs("div", { className: 'space-y-3', children: [_jsx(Label, { children: t('dialogs.exportFormat') }), _jsxs(RadioGroup, { value: format, onValueChange: value => setFormat(value), children: [_jsxs("div", { className: 'flex items-center space-x-2', children: [_jsx(RadioGroupItem, { value: 'csv', id: 'csv' }), _jsxs(Label, { htmlFor: 'csv', className: 'flex items-center gap-2 cursor-pointer', children: [_jsx(FileSpreadsheet, { className: 'h-4 w-4' }), _jsx("span", { children: t('dialogs.csvFormat') })] })] }), _jsxs("div", { className: 'flex items-center space-x-2', children: [_jsx(RadioGroupItem, { value: 'tsv', id: 'tsv' }), _jsxs(Label, { htmlFor: 'tsv', className: 'flex items-center gap-2 cursor-pointer', children: [_jsx(FileText, { className: 'h-4 w-4' }), _jsx("span", { children: t('dialogs.tsvFormat') })] })] }), _jsxs("div", { className: 'flex items-center space-x-2', children: [_jsx(RadioGroupItem, { value: 'json', id: 'json' }), _jsxs(Label, { htmlFor: 'json', className: 'flex items-center gap-2 cursor-pointer', children: [_jsx(FileText, { className: 'h-4 w-4' }), _jsx("span", { children: t('dialogs.jsonFormat') })] })] })] })] }), _jsxs("div", { className: 'space-y-3', children: [_jsxs("div", { className: 'flex items-center justify-between', children: [_jsx(Label, { children: t('dialogs.selectColumns') }), _jsx(Button, { variant: 'ghost', size: 'sm', onClick: toggleAll, className: 'h-8 text-xs', children: isAllSelected ? t('table.deselectAll') : t('table.selectAll') })] }), _jsx("div", { className: 'max-h-60 overflow-y-auto space-y-2 border border-border/50 rounded-none p-3 bg-muted/20', children: columns.map(column => (_jsxs("div", { className: 'flex items-center space-x-2', children: [_jsx(FmCommonCheckbox, { id: `export-col-${column.key}`, checked: selectedColumns.includes(column.key), onCheckedChange: () => toggleColumn(column.key) }), _jsx(Label, { htmlFor: `export-col-${column.key}`, className: 'text-sm cursor-pointer flex-1', children: column.label })] }, column.key))) }), _jsx("div", { className: 'text-xs text-muted-foreground', children: t('table.columnsSelected', { selected: selectedColumns.length, total: columns.length }) })] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: 'outline', onClick: () => onOpenChange(false), children: t('buttons.cancel') }), _jsxs(Button, { onClick: handleExport, disabled: selectedColumns.length === 0, children: [_jsx(Download, { className: 'h-4 w-4 mr-2' }), t('dialogs.exportButton', { format: format.toUpperCase() })] })] })] }) }));
}
