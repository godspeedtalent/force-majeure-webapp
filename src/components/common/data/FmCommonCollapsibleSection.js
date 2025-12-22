import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/common/shadcn/button';
import { cn } from '@/shared';
/**
 * FmCommonCollapsibleSection - A collapsible section with toggle button
 *
 * Features:
 * - Toggle expand/collapse state
 * - Chevron icon that rotates
 * - Smooth slide down/up + fade in/out animations
 * - Optional default expanded state
 *
 * Usage:
 * ```tsx
 * <FmCommonCollapsibleSection title="Demo Tools" defaultExpanded={true}>
 *   <YourContent />
 * </FmCommonCollapsibleSection>
 * ```
 */
export const FmCommonCollapsibleSection = ({ title, children, defaultExpanded = true, className = '', }) => {
    const { t } = useTranslation('common');
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    return (_jsxs("div", { className: className, children: [_jsxs("div", { className: 'flex items-center justify-between mb-4', children: [_jsx("h3", { className: 'font-canela text-lg text-white', children: title }), _jsx(Button, { variant: 'secondary', size: 'sm', onClick: () => setIsExpanded(!isExpanded), className: 'text-white hover:text-fm-gold', children: isExpanded ? (_jsxs(_Fragment, { children: [_jsx(ChevronUp, { className: 'h-4 w-4 mr-1' }), t('collapsible.collapse')] })) : (_jsxs(_Fragment, { children: [_jsx(ChevronDown, { className: 'h-4 w-4 mr-1' }), t('collapsible.expand')] })) })] }), _jsx("div", { className: cn('grid transition-all duration-300 ease-in-out', isExpanded
                    ? 'grid-rows-[1fr] opacity-100'
                    : 'grid-rows-[0fr] opacity-0'), children: _jsx("div", { className: 'overflow-hidden', children: children }) })] }));
};
