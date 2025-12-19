import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, } from '@/components/common/shadcn/drawer';
import { Compass, Database, ToggleLeft, Settings2, ClipboardList, } from 'lucide-react';
import { cn } from '@/shared';
function ToolCard({ label, icon, badge, onClick }) {
    const hasBadge = badge !== undefined && badge > 0;
    return (_jsxs("button", { onClick: onClick, className: cn(
        // Base styling
        'relative', 'bg-white/5 border border-white/10', 
        // Sharp corners per design system
        'rounded-none', 
        // Spacing - MD padding
        'p-[20px]', 
        // Layout - flex column for icon + label
        'flex flex-col items-center justify-center', 'gap-[10px]', 
        // Min height for consistency
        'min-h-[100px]', 
        // Hover states
        'hover:bg-white/10 hover:border-fm-gold/50', 
        // Active state
        'active:scale-95', 
        // Transitions
        'transition-all duration-200', 
        // Focus states
        'focus:outline-none focus:ring-2 focus:ring-fm-gold/50'), type: "button", children: [_jsx("div", { className: "text-fm-gold", children: icon }), _jsx("span", { className: "text-sm font-canela uppercase text-white", children: label }), hasBadge && (_jsx("span", { className: cn(
                // Position - top-right corner
                'absolute top-[5px] right-[5px]', 
                // Size
                'min-w-[20px] h-[20px]', 
                // Styling
                'bg-fm-danger text-white', 
                // Shape
                'rounded-full', 
                // Typography
                'text-[10px] font-bold', 
                // Layout
                'flex items-center justify-center', 
                // Padding
                'px-[5px]', 
                // Border
                'border border-black'), children: badge > 99 ? '99+' : badge }))] }));
}
/**
 * Main tool selection drawer for mobile developer toolbar
 * Displays grid of available developer tools with badges
 * Uses Vaul drawer for native mobile bottom sheet behavior
 */
export function FmMobileDevDrawer({ open, onOpenChange, onToolSelect, badges, }) {
    const tools = [
        {
            id: 'navigation',
            label: 'Navigation',
            icon: _jsx(Compass, { className: "h-[24px] w-[24px]", strokeWidth: 2 }),
        },
        {
            id: 'database',
            label: 'Database',
            icon: _jsx(Database, { className: "h-[24px] w-[24px]", strokeWidth: 2 }),
        },
        {
            id: 'features',
            label: 'Features',
            icon: _jsx(ToggleLeft, { className: "h-[24px] w-[24px]", strokeWidth: 2 }),
        },
        {
            id: 'session',
            label: 'Session',
            icon: _jsx(Settings2, { className: "h-[24px] w-[24px]", strokeWidth: 2 }),
        },
        {
            id: 'notes',
            label: 'Notes',
            icon: _jsx(ClipboardList, { className: "h-[24px] w-[24px]", strokeWidth: 2 }),
        },
    ];
    return (_jsx(Drawer, { open: open, onOpenChange: onOpenChange, children: _jsxs(DrawerContent, { className: cn(
            // Background - frosted glass Level 2
            'bg-black/80 backdrop-blur-lg', 
            // Border - white subtle
            'border-t-2 border-white/20', 
            // Rounded top corners (bottom sheet convention)
            'rounded-t-[20px]', 
            // Max height - 70vh to show content behind
            'max-h-[70vh]', 
            // z-index - above FAB
            'z-[70]'), children: [_jsxs(DrawerHeader, { className: "pb-[10px]", children: [_jsx("div", { className: "mx-auto h-[4px] w-[100px] rounded-full bg-fm-gold/50 mb-[20px]" }), _jsx(DrawerTitle, { className: "text-center font-canela uppercase text-fm-gold text-lg", children: "Developer Tools" })] }), _jsx("div", { className: "p-[20px] pt-0", children: _jsx("div", { className: cn(
                        // Responsive grid - 2 cols on small, 3 cols on larger mobile
                        'grid grid-cols-2 sm:grid-cols-3', 
                        // Gap - SM spacing
                        'gap-[10px]'), children: tools.map(tool => (_jsx(ToolCard, { id: tool.id, label: tool.label, icon: tool.icon, badge: badges[tool.id], onClick: () => {
                                onToolSelect(tool.id);
                                // Don't close main drawer - let nested drawer open on top
                            } }, tool.id))) }) }), _jsx("div", { className: "h-[env(safe-area-inset-bottom)]" })] }) }));
}
