import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Layout } from '@/components/layout/Layout';
import { DecorativeDivider } from '@/components/primitives/DecorativeDivider';
import { formatHeader } from '@/shared';
export default function MemberHome() {
    const { t } = useTranslation('common');
    return (_jsx(Layout, { children: _jsx("div", { className: 'container mx-auto pt-8 pb-8 px-4', children: _jsxs("div", { className: 'max-w-4xl mx-auto', children: [_jsxs("div", { className: 'mb-[40px]', children: [_jsxs("div", { className: 'flex items-center gap-[10px] mb-2', children: [_jsx(User, { className: 'h-6 w-6 text-fm-gold' }), _jsx("h1", { className: 'text-3xl font-canela', children: formatHeader(t('memberHome.title')) })] }), _jsx("p", { className: 'text-muted-foreground', children: t('memberHome.subtitle') })] }), _jsx(DecorativeDivider, { marginTop: 'mt-0', marginBottom: 'mb-8', lineWidth: 'w-32', opacity: 0.5 }), _jsx("div", { className: 'bg-black/40 backdrop-blur-md border border-white/20 rounded-none p-[40px]', children: _jsxs("div", { className: 'text-center space-y-4', children: [_jsx(User, { className: 'h-16 w-16 mx-auto text-fm-gold/50' }), _jsx("h2", { className: 'text-2xl font-canela', children: formatHeader(t('memberHome.comingSoonTitle')) }), _jsx("p", { className: 'text-white/60', children: t('memberHome.comingSoonDescription') })] }) })] }) }) }));
}
