import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { AnimatedCounter } from '@/components/primitives/AnimatedCounter';
import { MessagePanel } from '@/components/feedback/MessagePanel';
import { Button } from '@/components/common/shadcn/button';
import { LF_SYSTEM_TICKET_URL } from '@/shared';
export function AuthenticatedUserView({ displayName, totalUndiscoveredCheckpoints, isLoading, }) {
    return (_jsx(MessagePanel, { isLoading: isLoading, title: `Welcome back, ${displayName || 'Raver'}!`, description: totalUndiscoveredCheckpoints > 0
            ? 'Each checkpoint you discover gets you and a friend on the guestlist! Head out and scan the QR codes.'
            : undefined, action: _jsx(_Fragment, { children: _jsx("div", { className: 'text-center mb-8', children: totalUndiscoveredCheckpoints > 0 ? (_jsxs(_Fragment, { children: [_jsx("p", { className: 'text-lg text-muted-foreground mb-4', children: "Undiscovered Checkpoints" }), _jsx(AnimatedCounter, { value: totalUndiscoveredCheckpoints, className: 'text-6xl md:text-8xl' })] })) : (_jsxs(_Fragment, { children: [_jsx("p", { className: 'text-xl text-muted-foreground mb-6', children: "All checkpoints have been discovered! Tickets are still available below:" }), _jsx(Button, { size: 'lg', className: 'bg-gradient-gold hover:opacity-90 font-semibold text-black transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]', asChild: true, children: _jsx("a", { href: LF_SYSTEM_TICKET_URL, target: '_blank', rel: 'noopener noreferrer', children: "Get Tickets" }) })] })) }) }) }));
}
