import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function FmBulkEditSummary({ selectedRowCount, enabledFields, editableColumns, }) {
    const enabledFieldCount = Object.values(enabledFields).filter(Boolean).length;
    return (_jsxs("div", { className: 'rounded-none bg-muted/30 p-4 space-y-2', children: [_jsx("div", { className: 'text-sm font-medium', children: "Summary" }), _jsxs("div", { className: 'text-sm text-muted-foreground space-y-1', children: [_jsxs("div", { children: ["\u2022 ", selectedRowCount, " row", selectedRowCount !== 1 ? 's' : '', " selected"] }), _jsxs("div", { children: ["\u2022 ", enabledFieldCount, " field", enabledFieldCount !== 1 ? 's' : '', " will be updated"] }), enabledFieldCount > 0 && (_jsxs("div", { className: 'text-foreground font-medium mt-2', children: ["Fields to update:", ' ', Object.keys(enabledFields)
                                .filter(k => enabledFields[k])
                                .map(k => editableColumns.find(c => c.key === k)?.label)
                                .join(', ')] }))] })] }));
}
