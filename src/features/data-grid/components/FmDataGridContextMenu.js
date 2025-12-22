import { jsx as _jsx } from "react/jsx-runtime";
import { FmCommonContextMenu, } from '@/components/common/modals/FmCommonContextMenu';
export function FmDataGridContextMenu({ children, row, actions, onOpenChange, }) {
    return (_jsx(FmCommonContextMenu, { actions: actions, data: row, onOpenChange: onOpenChange, children: children }));
}
