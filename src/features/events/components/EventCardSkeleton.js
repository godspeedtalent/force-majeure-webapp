import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent } from '@/components/common/shadcn/card';
import { Skeleton } from '@/components/common/shadcn/skeleton';
// A skeleton placeholder that mirrors the EventCard/CommonCard layout
export const EventCardSkeleton = () => {
    return (_jsxs(Card, { className: 'overflow-hidden bg-card border-0 border-l-[3px] border-l-fm-crimson dark:border-l-fm-gold', children: [_jsxs("div", { className: 'relative aspect-[4/5] overflow-hidden max-h-[400px]', children: [_jsx(Skeleton, { className: 'absolute inset-0' }), _jsxs("div", { className: 'absolute bottom-4 left-4 right-4', children: [_jsxs("div", { className: 'flex items-center gap-2 mb-1', children: [_jsx("div", { className: 'inline-flex items-center rounded-full border border-white/10 bg-background/70 text-foreground px-4 py-1.5 text-base font-medium max-w-full', children: _jsx(Skeleton, { className: 'h-5 w-40' }) }), _jsx(Skeleton, { className: 'h-6 w-20 rounded-full' })] }), _jsx(Skeleton, { className: 'h-6 w-56' })] })] }), _jsxs(CardContent, { className: 'p-4', children: [_jsx(Skeleton, { className: 'h-4 w-[85%] mb-3' }), _jsx(Skeleton, { className: 'h-4 w-32 mb-2' }), _jsx(Skeleton, { className: 'h-4 w-48' })] })] }));
};
