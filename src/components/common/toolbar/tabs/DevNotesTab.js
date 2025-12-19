import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Separator } from '@/components/common/shadcn/separator';
import { DevNotesSection } from '@/components/DevTools/DevNotesSection';
export function DevNotesTabContent() {
    return (_jsxs("div", { className: 'space-y-4', children: [_jsx(Separator, { className: 'bg-white/10' }), _jsx(DevNotesSection, {})] }));
}
