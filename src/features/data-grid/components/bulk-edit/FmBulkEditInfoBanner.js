import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { AlertCircle } from 'lucide-react';
export function FmBulkEditInfoBanner() {
    const { t } = useTranslation('common');
    return (_jsxs("div", { className: 'flex items-start gap-3 p-3 rounded-none bg-blue-500/10 border border-blue-500/20', children: [_jsx(AlertCircle, { className: 'h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5' }), _jsxs("div", { className: 'text-sm space-y-1', children: [_jsx("p", { className: 'font-medium', children: t('bulkEdit.howItWorks') }), _jsxs("ul", { className: 'list-disc list-inside text-muted-foreground space-y-0.5', children: [_jsx("li", { children: t('bulkEdit.instructions.toggleFields') }), _jsx("li", { children: t('bulkEdit.instructions.setNewValue') }), _jsx("li", { children: t('bulkEdit.instructions.allRowsUpdated') }), _jsx("li", { children: t('bulkEdit.instructions.disabledFieldsUnchanged') })] })] })] }));
}
