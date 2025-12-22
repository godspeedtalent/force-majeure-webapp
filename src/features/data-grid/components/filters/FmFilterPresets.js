import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/common/shadcn/button';
import { X } from 'lucide-react';
export function FmFilterPresets({ presets, onLoadPreset, onDeletePreset, }) {
    const { t } = useTranslation('common');
    if (presets.length === 0) {
        return null;
    }
    return (_jsxs("div", { className: 'space-y-2 pt-4 border-t', children: [_jsx("div", { className: 'text-sm font-medium', children: t('dataGrid.savedFilters') }), _jsx("div", { className: 'flex flex-wrap gap-2', children: presets.map(preset => (_jsxs("div", { className: 'flex items-center gap-1 bg-muted/30 rounded-none', children: [_jsx(Button, { variant: 'ghost', size: 'sm', onClick: () => onLoadPreset(preset), className: 'h-8 rounded-r-none', children: preset.name }), _jsx(Button, { variant: 'ghost', size: 'sm', onClick: () => onDeletePreset(preset.id), className: 'h-8 w-8 p-0 rounded-l-none hover:bg-destructive/20 hover:text-destructive', children: _jsx(X, { className: 'h-3 w-3' }) })] }, preset.id))) })] }));
}
