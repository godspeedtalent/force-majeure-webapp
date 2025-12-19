import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { FmCommonCheckbox } from '@/components/common/forms/FmCommonCheckbox';
import { Label } from '@/components/common/shadcn/label';
export const FmCommonFormCheckbox = ({ id, checked, onCheckedChange, label, error, }) => {
    return (_jsxs("div", { children: [_jsxs("div", { className: 'flex items-start gap-3', children: [_jsx(FmCommonCheckbox, { id: id, checked: checked, onCheckedChange: onCheckedChange }), _jsx(Label, { htmlFor: id, className: 'text-sm font-normal cursor-pointer leading-relaxed', children: label })] }), error && _jsx("p", { className: 'text-xs text-destructive mt-1 ml-7', children: error })] }));
};
