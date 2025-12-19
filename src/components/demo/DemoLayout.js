import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigation } from '@/components/navigation/Navigation';
import { DecorativeDivider } from '@/components/primitives/DecorativeDivider';
import { TopographicBackground } from '@/components/common/misc/TopographicBackground';
import { FmBackButton } from '@/components/common/buttons/FmBackButton';
import { cn } from '@/shared';
export const DemoLayout = ({ title, description, icon: Icon, children, demoTools: _demoTools, condensed = false, showBackButton = true, onBack, backButtonLabel = 'Database', }) => {
    return (_jsxs(_Fragment, { children: [_jsx(Navigation, {}), _jsxs("div", { className: 'relative min-h-screen overflow-hidden', children: [_jsx(TopographicBackground, { opacity: 0.35 }), _jsx("div", { className: 'absolute inset-0 bg-gradient-monochrome opacity-10' }), _jsxs("div", { className: 'container mx-auto pt-24 pb-8 px-4 relative z-10', children: [showBackButton && (_jsx(FmBackButton, { position: 'floating', onClick: onBack, label: backButtonLabel })), _jsxs("div", { className: cn('mx-auto', condensed ? 'max-w-4xl' : 'max-w-7xl'), children: [_jsxs("div", { className: 'mb-4', children: [_jsxs("div", { className: 'flex items-center gap-3 mb-2', children: [_jsx(Icon, { className: 'h-6 w-6 text-fm-gold' }), _jsx("h1", { className: 'text-3xl font-canela', children: title })] }), _jsx("p", { className: 'text-muted-foreground', children: description })] }), _jsx(DecorativeDivider, { marginTop: 'mt-0', marginBottom: 'mb-8', lineWidth: 'w-32', opacity: 0.5 }), _jsx("div", { children: children })] })] })] })] }));
};
