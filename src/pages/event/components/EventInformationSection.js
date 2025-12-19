import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Calendar, Clock, MapPin } from 'lucide-react';
import { FmCommonCollapsibleSection } from '@/components/common/data/FmCommonCollapsibleSection';
import { FmCommonInfoCard } from '@/components/common/display/FmCommonInfoCard';
import { FmTextLink } from '@/components/common/display/FmTextLink';
import { Badge } from '@/components/common/shadcn/badge';
export function EventInformationSection({ longDateLabel, formattedTime, isAfterHours, venue, onVenueClick, }) {
    return (_jsx(FmCommonCollapsibleSection, { title: 'Event Information', defaultExpanded: true, children: _jsxs("div", { className: 'grid gap-4', children: [_jsx(FmCommonInfoCard, { icon: Calendar, label: 'Date & Time', size: 'sm', value: _jsxs("div", { className: 'flex flex-col gap-1.5', children: [_jsx("div", { children: longDateLabel }), _jsxs("div", { className: 'flex items-center gap-2 text-xs text-muted-foreground', children: [_jsx(Clock, { className: 'w-3 h-3' }), _jsx("span", { children: formattedTime }), isAfterHours && (_jsx(Badge, { className: 'bg-fm-gold/20 text-fm-gold border-fm-gold/40 text-[10px] px-1.5 py-0', children: "After Hours" }))] })] }) }), _jsx(FmCommonInfoCard, { icon: MapPin, label: 'Venue', size: 'sm', value: _jsx(FmTextLink, { onClick: onVenueClick, children: venue || 'Venue TBA' }) })] }) }));
}
