import { jsx as _jsx } from "react/jsx-runtime";
import { FmInfoCard } from '@/components/common/data/FmInfoCard';
import { FmCommonCollapsibleSection } from '@/components/common/data/FmCommonCollapsibleSection';
import { Wrench } from 'lucide-react';
/**
 * FmCommonDemoToolbar - A toolbar for demo tools
 *
 * Features:
 * - Displays an array of demo tools in a collapsible card
 * - Each tool is rendered in its own section
 * - Consistent styling with FmInfoCard
 * - Collapsible with FmCommonCollapsibleSection
 *
 * Usage:
 * ```tsx
 * const tools = [
 *   eventSelectionTool,
 *   anotherTool,
 * ];
 *
 * <FmCommonDemoToolbar tools={tools} />
 * ```
 */
export const FmCommonDemoToolbar = ({ tools, defaultExpanded = true, }) => {
    return (_jsx(FmInfoCard, { icon: Wrench, className: 'mb-6', children: _jsx(FmCommonCollapsibleSection, { title: 'Demo Tools', defaultExpanded: defaultExpanded, children: _jsx("div", { className: 'space-y-6', children: tools.map(tool => (_jsx("div", { children: tool.render() }, tool.id))) }) }) }));
};
