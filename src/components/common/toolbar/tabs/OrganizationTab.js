import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Building2, Scan } from 'lucide-react';
import { Separator } from '@/components/common/shadcn/separator';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
export function OrgDashboardTabContent({ onNavigate }) {
    return (_jsxs("div", { className: 'space-y-4', children: [_jsx(Separator, { className: 'bg-white/10' }), _jsx("div", { className: 'flex flex-col gap-2', children: _jsx(FmCommonButton, { variant: 'default', icon: Building2, iconPosition: 'left', onClick: () => onNavigate('/organization/tools'), className: 'w-full justify-start', children: "Go to Org Dashboard" }) })] }));
}
export function ScanTicketsTabContent({ onNavigate }) {
    return (_jsxs("div", { className: 'space-y-4', children: [_jsx(Separator, { className: 'bg-white/10' }), _jsx("div", { className: 'flex flex-col gap-2', children: _jsx(FmCommonButton, { variant: 'default', icon: Scan, iconPosition: 'left', onClick: () => onNavigate('/organization/scanning'), className: 'w-full justify-start', children: "Go to Ticket Scanner" }) })] }));
}
