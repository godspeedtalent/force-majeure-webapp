import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from '@/components/common/shadcn/card';
import { Button } from '@/components/common/shadcn/button';
import { TopographicBackground } from '@/components/common/misc/TopographicBackground';
import { FmI18nCommon } from '@/components/common/i18n';
export default function CheckoutSuccess() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const sessionId = searchParams.get('session_id');
    useEffect(() => {
        if (!sessionId) {
            navigate('/', { replace: true });
        }
    }, [sessionId, navigate]);
    if (!sessionId) {
        return (_jsx("div", { className: 'min-h-screen flex items-center justify-center', children: _jsx("div", { className: 'h-8 w-8 animate-spin rounded-full border-[3px] border-fm-gold border-b-transparent' }) }));
    }
    return (_jsxs("div", { className: 'min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden', children: [_jsx(TopographicBackground, { opacity: 0.25 }), _jsx("div", { className: 'absolute inset-0 bg-gradient-monochrome opacity-10' }), _jsxs(Card, { className: 'w-full max-w-md relative z-10', children: [_jsxs(CardHeader, { className: 'text-center', children: [_jsx("div", { className: 'mx-auto mb-4 w-16 h-16 rounded-none bg-success/10 flex items-center justify-center', children: _jsx(CheckCircle2, { className: 'h-8 w-8 text-success' }) }), _jsx(CardTitle, { className: 'text-2xl', children: _jsx(FmI18nCommon, { i18nKey: 'checkoutResult.success.title' }) }), _jsx(CardDescription, { children: _jsx(FmI18nCommon, { i18nKey: 'checkoutResult.success.description' }) })] }), _jsxs(CardContent, { className: 'space-y-4', children: [_jsx(FmI18nCommon, { i18nKey: 'checkoutResult.success.emailNotice', as: 'p', className: 'text-sm text-muted-foreground text-center' }), _jsxs("div", { className: 'space-y-2', children: [_jsx(Button, { onClick: () => navigate('/profile'), className: 'w-full', children: _jsx(FmI18nCommon, { i18nKey: 'checkoutResult.success.viewTickets' }) }), _jsx(Button, { onClick: () => navigate('/'), variant: 'outline', className: 'w-full', children: _jsx(FmI18nCommon, { i18nKey: 'checkoutResult.backToHome' }) })] })] })] })] }));
}
