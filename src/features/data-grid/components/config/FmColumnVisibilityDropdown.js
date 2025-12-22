import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/common/shadcn/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel, } from '@/components/common/shadcn/dropdown-menu';
import { Settings2, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { FmCommonToggle } from '@/components/common/forms/FmCommonToggle';
export function FmColumnVisibilityDropdown({ baseColumns, columnConfigs, onToggleVisibility, onResetConfiguration, onClearFiltersAndSort, }) {
    const { t } = useTranslation('common');
    return (_jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsxs(Button, { variant: 'outline', size: 'sm', className: 'gap-2', children: [_jsx(Settings2, { className: 'h-4 w-4' }), t('dataGrid.columns')] }) }), _jsxs(DropdownMenuContent, { align: 'end', className: 'w-64', children: [_jsx(DropdownMenuLabel, { children: t('dataGrid.toggleColumns') }), _jsx(DropdownMenuSeparator, {}), _jsx("div", { className: 'max-h-[400px] overflow-y-auto px-2 py-1 space-y-1', children: baseColumns.map(col => {
                            const isVisible = columnConfigs.find(c => c.key === col.key)?.visible ?? true;
                            return (_jsx(FmCommonToggle, { id: `column-toggle-${col.key}`, label: col.label, icon: isVisible ? Eye : EyeOff, checked: isVisible, onCheckedChange: () => onToggleVisibility(col.key), className: 'w-full' }, col.key));
                        }) }), _jsx(DropdownMenuSeparator, {}), _jsxs(Button, { variant: 'ghost', size: 'sm', onClick: onResetConfiguration, className: 'w-full justify-start text-xs', children: [_jsx(RotateCcw, { className: 'h-4 w-4 mr-2' }), t('dataGrid.resetToDefault')] }), _jsxs(Button, { variant: 'ghost', size: 'sm', onClick: onClearFiltersAndSort, className: 'w-full justify-start text-xs', children: [_jsx(RotateCcw, { className: 'h-4 w-4 mr-2' }), t('dataGrid.clearFiltersAndSort')] })] })] }));
}
