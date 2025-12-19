import { jsx as _jsx } from "react/jsx-runtime";
import { Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared';
/**
 * Small, unobtrusive admin lock indicator to show that an item is
 * restricted to users with admin permissions
 */
export function AdminLockIndicator({ position = 'top-right', size = 'sm', className, tooltipText, }) {
    const { t } = useTranslation('common');
    const resolvedTooltipText = tooltipText ?? t('adminLockIndicator.adminAccess');
    const sizeClasses = {
        xs: 'h-2.5 w-2.5',
        sm: 'h-3 w-3',
        md: 'h-4 w-4',
    };
    const positionClasses = {
        'top-right': 'absolute top-1 right-1',
        'top-left': 'absolute top-1 left-1',
        'bottom-right': 'absolute bottom-1 right-1',
        'bottom-left': 'absolute bottom-1 left-1',
        'inline': 'inline-block ml-1.5',
    };
    return (_jsx("span", { className: cn(positionClasses[position], 'text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors duration-200', className), title: resolvedTooltipText, "aria-label": resolvedTooltipText, children: _jsx(Shield, { className: sizeClasses[size] }) }));
}
