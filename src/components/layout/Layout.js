import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from '@/shared';
import { useIsMobile } from '@/shared';
import { Footer } from '@/components/navigation/Footer';
import { Navigation } from '@/components/navigation/Navigation';
import { TopographicBackground } from '@/components/common/misc/TopographicBackground';
import { FmBackButton } from '@/components/common/buttons/FmBackButton';
export const Layout = ({ children, enableScrollSnap = false, showBackButton = false, onBack, backButtonLabel, hideFooter = false, }) => {
    const isMobile = useIsMobile();
    return (_jsxs("div", { className: 'min-h-screen bg-background flex flex-col', children: [_jsx(Navigation, {}), _jsxs("main", { className: cn('flex-1 animate-fade-in relative overflow-hidden', !hideFooter && 'pb-[400px]', enableScrollSnap && isMobile && 'snap-y snap-mandatory overflow-y-auto'), style: enableScrollSnap && isMobile
                    ? {
                        scrollPaddingTop: '64px',
                        scrollBehavior: 'smooth',
                    }
                    : undefined, children: [_jsx(TopographicBackground, { opacity: 0.35 }), _jsx("div", { className: 'absolute inset-0 bg-gradient-monochrome opacity-10' }), _jsxs("div", { className: 'relative', children: [showBackButton && (_jsx(FmBackButton, { position: 'floating', onClick: onBack, label: backButtonLabel })), children] })] }), !hideFooter && _jsx(Footer, {})] }));
};
