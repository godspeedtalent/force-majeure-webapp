import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/common/shadcn/card';
import { Button } from '@/components/common/shadcn/button';
import { TopographicBackground } from '@/components/common/misc/TopographicBackground';
import { Separator } from '@/components/common/shadcn/separator';
export default function EventCheckoutConfirmation() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const eventId = searchParams.get('eventId') || '';
    const eventName = searchParams.get('eventName') || 'Event';
    const eventDate = searchParams.get('eventDate') || '';
    const email = searchParams.get('email') || '';
    return (_jsxs("div", { className: 'min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden', children: [_jsx(TopographicBackground, { opacity: 0.25 }), _jsx("div", { className: 'absolute inset-0 bg-gradient-monochrome opacity-10' }), _jsxs(Card, { className: 'w-full max-w-2xl relative z-10 p-8', children: [_jsxs("div", { className: 'flex flex-col items-center text-center mb-8', children: [_jsx("div", { className: 'mb-6 w-20 h-20 rounded-full bg-fm-gold/10 flex items-center justify-center', children: _jsx(CheckCircle2, { className: 'h-10 w-10 text-fm-gold' }) }), _jsx("h1", { className: 'text-3xl font-canela mb-2', children: "Purchase Successful!" }), _jsx("p", { className: 'text-muted-foreground', children: "Your tickets have been confirmed" })] }), _jsx(Separator, { className: 'my-6' }), _jsxs("div", { className: 'space-y-4 mb-8', children: [_jsxs("div", { children: [_jsx("h3", { className: 'text-sm font-medium text-muted-foreground mb-1', children: "Event" }), _jsx("p", { className: 'text-lg font-canela', children: eventName })] }), eventDate && (_jsxs("div", { children: [_jsx("h3", { className: 'text-sm font-medium text-muted-foreground mb-1', children: "Date" }), _jsx("p", { className: 'text-lg', children: new Date(eventDate).toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        }) })] }))] }), _jsx(Separator, { className: 'my-6' }), _jsxs("div", { className: 'bg-muted/20 p-4 rounded-lg mb-8', children: [_jsxs("p", { className: 'text-sm text-center', children: ["Your tickets have been sent to", ' ', _jsx("span", { className: 'font-medium text-fm-gold', children: email })] }), _jsx("p", { className: 'text-xs text-muted-foreground text-center mt-2', children: "Please check your inbox and spam folder" })] }), _jsx(Button, { onClick: () => navigate(`/developer/demo/event-checkout?eventId=${eventId}`), className: 'w-full bg-fm-gold hover:bg-fm-gold/90 text-black', size: 'lg', children: "Back to Event" })] })] }));
}
