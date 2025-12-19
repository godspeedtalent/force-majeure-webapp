import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Card } from '@/components/common/shadcn/card';
import { Label } from '@/components/common/shadcn/label';
import { Switch } from '@/components/common/shadcn/switch';
import { Code, Database, ToggleLeft, Info } from 'lucide-react';
import { toast } from 'sonner';
const DEV_TOOL_SECTIONS = [
    {
        id: 'database',
        label: 'Database Tools',
        description: 'Access to Database tab in developer toolbar and database manager page',
        icon: _jsx(Database, { className: 'h-4 w-4' }),
    },
    {
        id: 'features',
        label: 'Feature Flags',
        description: 'Toggle feature flags for testing',
        icon: _jsx(ToggleLeft, { className: 'h-4 w-4' }),
    },
];
const STORAGE_KEY = 'dev_tools_visibility';
export const DevToolsManagement = () => {
    const [visibleSections, setVisibleSections] = useState(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                return JSON.parse(stored);
            }
            catch {
                return {};
            }
        }
        // Default: all enabled
        return DEV_TOOL_SECTIONS.reduce((acc, section) => {
            acc[section.id] = true;
            return acc;
        }, {});
    });
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(visibleSections));
    }, [visibleSections]);
    const handleToggle = (sectionId) => {
        setVisibleSections(prev => {
            const newState = { ...prev, [sectionId]: !prev[sectionId] };
            const isEnabled = newState[sectionId];
            toast.success(isEnabled
                ? `Enabled ${DEV_TOOL_SECTIONS.find(s => s.id === sectionId)?.label}`
                : `Disabled ${DEV_TOOL_SECTIONS.find(s => s.id === sectionId)?.label}`, { description: 'Changes will take effect on next page load' });
            return newState;
        });
    };
    return (_jsxs("div", { className: 'space-y-6', children: [_jsxs("div", { className: 'flex items-start gap-3 p-4 rounded-none border border-border bg-muted/20', children: [_jsx(Info, { className: 'h-5 w-5 text-fm-gold mt-0.5' }), _jsxs("div", { className: 'space-y-1', children: [_jsx("p", { className: 'text-sm font-medium text-foreground', children: "Development Environment Controls" }), _jsx("p", { className: 'text-sm text-muted-foreground', children: "These settings control which sections appear in the dev toolbar at the bottom of the screen. Changes require a page refresh to take effect. The dev toolbar only appears in development mode." })] })] }), _jsx("div", { className: 'grid grid-cols-1 md:grid-cols-2 gap-4', children: DEV_TOOL_SECTIONS.map(section => (_jsx(Card, { className: 'p-6', children: _jsxs("div", { className: 'flex items-start justify-between gap-4', children: [_jsxs("div", { className: 'flex items-start gap-3 flex-1', children: [_jsx("div", { className: 'p-2 rounded-lg bg-muted/50 text-fm-gold', children: section.icon }), _jsxs("div", { className: 'flex-1 space-y-1', children: [_jsx(Label, { htmlFor: `toggle-${section.id}`, className: 'text-sm font-medium cursor-pointer', children: section.label }), _jsx("p", { className: 'text-xs text-muted-foreground', children: section.description })] })] }), _jsx(Switch, { id: `toggle-${section.id}`, checked: visibleSections[section.id] ?? true, onCheckedChange: () => handleToggle(section.id) })] }) }, section.id))) }), _jsxs("div", { className: 'flex items-center gap-2 text-xs text-muted-foreground', children: [_jsx(Code, { className: 'h-3 w-3' }), _jsx("span", { children: "Keyboard shortcut: Ctrl+Shift+D (Cmd+Shift+D on Mac) to toggle dev toolbar" })] })] }));
};
