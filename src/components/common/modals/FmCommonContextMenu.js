import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuTrigger, } from '@/components/common/shadcn/context-menu';
import { cn } from '@/shared';
import { getListItemClasses, getDepthClasses } from '@/shared';
export function FmCommonContextMenu({ children, actions, data, onOpenChange, }) {
    if (actions.length === 0) {
        return _jsx(_Fragment, { children: children });
    }
    return (_jsxs(ContextMenu, { onOpenChange: onOpenChange, children: [_jsx(ContextMenuTrigger, { asChild: true, children: children }), _jsx(ContextMenuContent, { className: cn('w-56', getDepthClasses(3), 'border border-white/20 border-l-[3px] border-l-fm-gold/60 shadow-lg shadow-black/50', 'animate-in fade-in zoom-in-95 duration-200', 'p-1'), children: actions.map((action, idx) => {
                    const iconOnRight = action.iconPosition === 'right';
                    // If action has submenu, render as ContextMenuSub
                    if (action.submenu && action.submenu.length > 0) {
                        return (_jsxs("div", { children: [_jsxs(ContextMenuSub, { children: [_jsxs(ContextMenuSubTrigger, { disabled: action.disabled, className: cn('group cursor-pointer rounded-md my-0.5 relative', getListItemClasses(idx), 'data-[state=open]:bg-fm-gold/15 data-[state=open]:text-white', action.disabled &&
                                                'opacity-50 cursor-not-allowed hover:scale-100 hover:bg-transparent'), children: [action.icon && (_jsx("span", { className: 'mr-2 transition-transform duration-300 group-hover:scale-110', children: action.icon })), _jsx("span", { className: 'font-medium', children: action.label })] }), _jsx(ContextMenuSubContent, { className: cn('w-48', getDepthClasses(3), 'border border-white/20 border-l-[3px] border-l-fm-gold/60 shadow-lg shadow-black/50', 'p-1'), children: action.submenu.map((subAction, subIdx) => {
                                                const subIconOnRight = subAction.iconPosition === 'right';
                                                return (_jsxs("div", { children: [_jsxs(ContextMenuItem, { onClick: e => {
                                                                e.stopPropagation();
                                                                subAction.onClick?.(data);
                                                            }, disabled: subAction.disabled, className: cn('group cursor-pointer rounded-md my-0.5 relative', getListItemClasses(subIdx), subAction.variant === 'destructive' &&
                                                                'text-destructive hover:bg-destructive/15 hover:shadow-destructive/20 focus:bg-destructive/20 focus:shadow-destructive/20 hover:text-destructive', subIconOnRight &&
                                                                'flex justify-between items-center', subAction.disabled &&
                                                                'opacity-50 cursor-not-allowed hover:scale-100 hover:bg-transparent'), children: [!subIconOnRight && subAction.icon && (_jsx("span", { className: 'mr-2 transition-transform duration-300 group-hover:scale-110', children: subAction.icon })), _jsx("span", { className: 'font-medium', children: subAction.label }), subIconOnRight && subAction.icon && (_jsx("span", { className: 'ml-auto transition-transform duration-300 group-hover:scale-110 group-hover:translate-x-0.5', children: subAction.icon })), subIdx < action.submenu.length - 1 && (_jsx("div", { className: 'absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent' }))] }), subAction.separator &&
                                                            subIdx < action.submenu.length - 1 && (_jsx("div", { className: 'h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-1' }))] }, subIdx));
                                            }) })] }), action.separator && idx < actions.length - 1 && (_jsx("div", { className: 'h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-1' }))] }, idx));
                    }
                    // Regular menu item
                    return (_jsxs("div", { children: [_jsxs(ContextMenuItem, { onClick: e => {
                                    e.stopPropagation();
                                    action.onClick?.(data);
                                }, disabled: action.disabled, className: cn('group cursor-pointer rounded-md my-0.5 relative', getListItemClasses(idx), action.variant === 'destructive' &&
                                    'text-destructive hover:bg-destructive/15 hover:shadow-destructive/20 focus:bg-destructive/20 focus:shadow-destructive/20 hover:text-destructive', iconOnRight && 'flex justify-between items-center', action.disabled &&
                                    'opacity-50 cursor-not-allowed hover:scale-100 hover:bg-transparent'), children: [!iconOnRight && action.icon && (_jsx("span", { className: 'mr-2 transition-transform duration-300 group-hover:scale-110', children: action.icon })), _jsx("span", { className: 'font-medium', children: action.label }), iconOnRight && action.icon && (_jsx("span", { className: 'ml-auto transition-transform duration-300 group-hover:scale-110 group-hover:translate-x-0.5', children: action.icon })), idx < actions.length - 1 && (_jsx("div", { className: 'absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent' }))] }), action.separator && idx < actions.length - 1 && (_jsx("div", { className: 'h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-1' }))] }, idx));
                }) })] }));
}
