import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ComponentRelationshipGraph } from '@/components/demo/ComponentRelationshipGraph';
export function RelationshipsSection() {
    return (_jsxs("div", { className: 'space-y-6', children: [_jsxs("div", { className: 'p-6 bg-muted/30 rounded-lg border border-border', children: [_jsx("h3", { className: 'text-xl font-canela font-semibold mb-2 text-fm-gold', children: "Component Architecture Overview" }), _jsx("p", { className: 'text-muted-foreground', children: "This interactive graph visualizes the relationships between all FmCommon components. Larger dots represent base components, while lines show inheritance (dashed gold) and composition (dotted gray) relationships. Hover over components to see details." })] }), _jsx(ComponentRelationshipGraph, {})] }));
}
