import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { ArrowLeft, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Drawer, DrawerContent, DrawerHeader, } from '@/components/common/shadcn/drawer';
import { cn } from '@/shared';
import { DevNavigationTabContent } from '../tabs/DevNavigationTab';
import { DatabaseTabContent, DatabaseTabFooter, } from '../tabs/DatabaseTab';
import { FeatureTogglesTabContent } from '../tabs/FeatureTogglesTab';
import { SessionOverridesTabContent } from '../tabs/SessionOverridesTab';
import { DevNotesTabContent } from '../tabs/DevNotesTab';
import { Button } from '@/components/common/shadcn/button';
const toolLabels = {
    navigation: 'Navigation',
    database: 'Database',
    features: 'Feature Toggles',
    session: 'Session Overrides',
    notes: 'Developer Notes',
};
/**
 * Nested drawer for displaying individual developer tool content
 * Full-screen (90vh) overlay with header (back/close buttons) and scrollable content
 * Reuses existing desktop tab content components
 */
export function FmMobileDevToolContent({ toolId, open, onClose, isAdmin, }) {
    const navigate = useNavigate();
    if (!toolId)
        return null;
    const handleNavigate = (path) => {
        navigate(path);
        onClose(); // Close drawer after navigation
    };
    const renderContent = () => {
        switch (toolId) {
            case 'navigation':
                return (_jsx(DevNavigationTabContent, { onNavigate: handleNavigate, isAdmin: isAdmin }));
            case 'database':
                return (_jsxs(_Fragment, { children: [_jsx(DatabaseTabContent, {}), _jsx("div", { className: "mt-4", children: _jsx(DatabaseTabFooter, { onNavigate: handleNavigate }) })] }));
            case 'features':
                return _jsx(FeatureTogglesTabContent, {});
            case 'session':
                return _jsx(SessionOverridesTabContent, {});
            case 'notes':
                return _jsx(DevNotesTabContent, {});
            default:
                return _jsx("div", { className: "text-white/50 text-center", children: "Tool not found" });
        }
    };
    return (_jsx(Drawer, { open: open, onOpenChange: onClose, children: _jsxs(DrawerContent, { className: cn(
            // Background - frosted glass Level 3
            'bg-black/90 backdrop-blur-xl', 
            // Border
            'border-t-2 border-white/20', 
            // Rounded top corners
            'rounded-t-[20px]', 
            // Full height - 90vh for immersive experience
            'h-[90vh]', 
            // z-index - above main drawer
            'z-[80]', 
            // Flex layout for header + content
            'flex flex-col'), children: [_jsxs(DrawerHeader, { className: cn(
                    // Padding
                    'p-[20px]', 
                    // Border bottom
                    'border-b border-white/10', 
                    // Flex row for back | title | close layout
                    'flex flex-row items-center justify-between', 
                    // Shrink to fit content
                    'flex-shrink-0'), children: [_jsx(Button, { variant: "ghost", size: "sm", onClick: onClose, className: cn('p-[10px]', 'hover:bg-white/10', 'text-white', 'transition-all duration-200'), "aria-label": "Go back", children: _jsx(ArrowLeft, { className: "h-[20px] w-[20px]", strokeWidth: 2 }) }), _jsx("h2", { className: "font-canela uppercase text-fm-gold text-base font-medium", children: toolLabels[toolId] }), _jsx(Button, { variant: "ghost", size: "sm", onClick: onClose, className: cn('p-[10px]', 'hover:bg-white/10', 'text-white', 'transition-all duration-200'), "aria-label": "Close", children: _jsx(X, { className: "h-[20px] w-[20px]", strokeWidth: 2 }) })] }), _jsx("div", { className: cn(
                    // Scrolling
                    'overflow-y-auto overflow-x-hidden', 
                    // Padding
                    'p-[20px]', 
                    // Flex grow to fill space
                    'flex-1', 
                    // Custom scrollbar styling
                    'scrollbar-thin scrollbar-thumb-fm-gold/30 scrollbar-track-transparent'), children: renderContent() }), _jsx("div", { className: "h-[env(safe-area-inset-bottom)] flex-shrink-0" })] }) }));
}
