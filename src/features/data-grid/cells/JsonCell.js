import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
/**
 * JsonCell - Displays JSONB data as expandable key-value pairs
 *
 * Features:
 * - Expandable/collapsible view
 * - Shows summary count when collapsed
 * - Custom value formatting via formatValue prop
 * - Handles nested objects (flattens one level)
 */
export const JsonCell = ({ data, className, maxHeight = '200px', formatValue }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
        return (_jsx("span", { className: "text-muted-foreground text-sm italic", children: "No data" }));
    }
    const entries = Object.entries(data);
    const itemCount = entries.length;
    const defaultFormatValue = (_key, value) => {
        if (value === null || value === undefined)
            return 'N/A';
        if (typeof value === 'object')
            return JSON.stringify(value);
        return String(value);
    };
    const formatter = formatValue || defaultFormatValue;
    return (_jsxs("div", { className: `flex flex-col gap-1 ${className || ''}`, children: [_jsxs("button", { onClick: () => setIsExpanded(!isExpanded), className: "flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors", children: [isExpanded ? (_jsx(ChevronDown, { className: "w-3 h-3" })) : (_jsx(ChevronRight, { className: "w-3 h-3" })), _jsxs("span", { className: "font-medium", children: [itemCount, " ", itemCount === 1 ? 'item' : 'items'] })] }), isExpanded && (_jsx("div", { className: "flex flex-col gap-0.5 text-xs overflow-y-auto", style: { maxHeight }, children: entries.map(([key, value]) => (_jsxs("div", { className: "flex items-start gap-2 py-0.5", children: [_jsxs("span", { className: "font-medium text-muted-foreground min-w-[100px]", children: [key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), ":"] }), _jsx("span", { className: "text-foreground break-all", children: formatter(key, value) })] }, key))) }))] }));
};
