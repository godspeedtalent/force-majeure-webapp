import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Instagram, ShoppingCart, User, } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Breadcrumbs } from '@/components/primitives/Breadcrumbs';
import { ForceMajeureLogo } from './ForceMajeureLogo';
import { UserMenuDropdown } from '@/components/navigation/UserMenuDropdown';
import { CheckoutCountdown } from '@/components/business/CheckoutCountdown';
import { Button } from '@/components/common/shadcn/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, } from '@/components/common/shadcn/tooltip';
import { useAuth } from '@/features/auth/services/AuthContext';
import { useFeatureFlagHelpers } from '@/shared';
import { FEATURE_FLAGS } from '@/shared';
import { useCheckoutTimer } from '@/contexts/CheckoutContext';
import { SOCIAL_LINKS } from '@/shared';
import { FeatureGuard } from '@/components/common/guards/FeatureGuard';
export const Navigation = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation('common');
    const { isFeatureEnabled } = useFeatureFlagHelpers();
    const { isCheckoutActive, endCheckout, redirectUrl } = useCheckoutTimer();
    return (_jsx("nav", { className: 'sticky top-0 z-50 w-full bg-background/50 backdrop-blur-md border-b border-border', children: _jsx("div", { className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8', children: _jsxs("div", { className: 'flex justify-between items-center h-16', children: [_jsxs("div", { className: 'flex items-center', children: [_jsx(Link, { to: '/', className: 'transition-transform duration-200 hover:scale-110', children: _jsx(ForceMajeureLogo, { className: 'h-8 w-8' }) }), _jsx(Breadcrumbs, {})] }), _jsx("div", { className: 'absolute left-1/2 transform -translate-x-1/2 hidden lg:block', children: isFeatureEnabled(FEATURE_FLAGS.EVENT_CHECKOUT_TIMER) &&
                            isCheckoutActive ? (_jsx(CheckoutCountdown, { onExpire: endCheckout, redirectUrl: redirectUrl })) : (_jsxs("h2", { className: 'font-screamer text-xl', children: [_jsx("span", { className: 'text-white', children: "FORCE" }), ' ', _jsx("span", { className: 'text-fm-gold', children: "MAJEURE" })] })) }), _jsxs("div", { className: 'hidden md:flex items-center space-x-4', children: [_jsx(TooltipProvider, { children: _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("a", { href: SOCIAL_LINKS.instagram, target: '_blank', rel: 'noopener noreferrer', className: 'text-foreground hover:text-fm-gold transition-colors duration-200', "aria-label": t('nav.followOnInstagram'), children: _jsx(Instagram, { className: 'h-5 w-5' }) }) }), _jsx(TooltipContent, { children: _jsx("p", { children: SOCIAL_LINKS.instagramHandle }) })] }) }), _jsx(FeatureGuard, { feature: FEATURE_FLAGS.MERCH_STORE, children: _jsx(TooltipProvider, { children: _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx(Link, { to: '/merch', className: 'text-foreground hover:text-fm-gold transition-colors duration-200', "aria-label": t('nav.shopMerch'), children: _jsx(ShoppingCart, { className: 'h-5 w-5' }) }) }), _jsx(TooltipContent, { children: _jsx("p", { children: t('nav.shopMerch') }) })] }) }) }), _jsx("div", { className: 'h-6 w-px bg-border/50' }), user ? (_jsx(UserMenuDropdown, {})) : (_jsx(Button, { variant: 'ghost', size: 'sm', className: 'text-foreground hover:text-fm-gold hover:bg-hover-overlay', onClick: () => navigate('/auth'), children: _jsx(User, { className: 'h-4 w-4' }) }))] }), _jsx("div", { className: 'md:hidden flex items-center', children: user ? (_jsx(UserMenuDropdown, {})) : (_jsx(Button, { variant: 'ghost', size: 'sm', className: 'text-foreground hover:text-fm-gold hover:bg-hover-overlay', onClick: () => navigate('/auth'), children: _jsx(User, { className: 'h-4 w-4' }) })) })] }) }) }));
};
