import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, } from '@/components/common/shadcn/dialog';
import { cn } from '@/shared';
import { GLASS_STYLES } from '@/shared';
export const FmCommonModal = ({ open, onOpenChange, title, description, children, className = '', headerActions, headerContent, }) => {
    return (_jsx(Dialog, { open: open, onOpenChange: onOpenChange, children: _jsxs(DialogContent, { className: cn(GLASS_STYLES.PANEL, 'text-white max-w-2xl', className), children: [headerContent ? (_jsx("div", { className: 'mb-4', children: headerContent })) : (_jsx(DialogHeader, { className: cn('space-y-2', headerActions && 'sm:space-y-0'), children: _jsxs("div", { className: cn('flex flex-col gap-3 pr-10', headerActions &&
                            'sm:flex-row sm:items-start sm:justify-between sm:gap-6'), children: [_jsxs("div", { className: 'space-y-2', children: [_jsx(DialogTitle, { className: 'font-canela text-2xl text-white', children: title }), description && (_jsx(DialogDescription, { className: 'text-white/70', children: description }))] }), headerActions && (_jsx("div", { className: 'flex items-center justify-end gap-2 sm:min-w-[7rem]', children: headerActions }))] }) })), _jsx("div", { className: 'mt-4', children: children })] }) }));
};
