import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from '@/components/common/shadcn/card';
import { Button } from '@/components/common/shadcn/button';
import { TopographicBackground } from '@/components/common/misc/TopographicBackground';
import { FmI18nCommon } from '@/components/common/i18n';
export default function CheckoutCancel() {
    const navigate = useNavigate();
    return (_jsxs("div", { className: 'min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden', children: [_jsx(TopographicBackground, { opacity: 0.25 }), _jsx("div", { className: 'absolute inset-0 bg-gradient-monochrome opacity-10' }), _jsxs(Card, { className: 'w-full max-w-md relative z-10', children: [_jsxs(CardHeader, { className: 'text-center', children: [_jsx("div", { className: 'mx-auto mb-4 w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center', children: _jsx(XCircle, { className: 'h-8 w-8 text-destructive' }) }), _jsx(CardTitle, { className: 'text-2xl', children: _jsx(FmI18nCommon, { i18nKey: 'checkoutResult.cancelled.title' }) }), _jsx(CardDescription, { children: _jsx(FmI18nCommon, { i18nKey: 'checkoutResult.cancelled.description' }) })] }), _jsxs(CardContent, { className: 'space-y-4', children: [_jsx(FmI18nCommon, { i18nKey: 'checkoutResult.cancelled.noCharges', as: 'p', className: 'text-sm text-muted-foreground text-center' }), _jsxs("div", { className: 'space-y-2', children: [_jsx(Button, { onClick: () => navigate(-1), className: 'w-full', children: _jsx(FmI18nCommon, { i18nKey: 'checkoutResult.cancelled.tryAgain' }) }), _jsx(Button, { onClick: () => navigate('/'), variant: 'outline', className: 'w-full', children: _jsx(FmI18nCommon, { i18nKey: 'checkoutResult.backToHome' }) })] })] })] })] }));
}
