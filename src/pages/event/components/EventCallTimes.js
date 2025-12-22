import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Music, ArrowRight } from 'lucide-react';
import { FmCommonCollapsibleSection } from '@/components/common/data/FmCommonCollapsibleSection';
import { FmCommonStackLayout } from '@/components/common/layout';
import { FmArtistRow } from '@/components/artist/FmArtistRow';
import { Button } from '@/components/common/shadcn/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, } from '@/components/common/shadcn/dialog';
/**
 * EventCallTimes - Displays the call times / lineup schedule
 *
 * Extracted from EventDetailsContent.tsx for better component organization.
 * Headliner is displayed first (at top) with emphasized styling.
 * Optionally displays a "Looking for Artists" prompt when enabled.
 */
export const EventCallTimes = ({ callTimeLineup, onArtistSelect, lookingForUndercard = false, eventId, className = 'lg:col-span-2', }) => {
    const { t } = useTranslation('common');
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    if (callTimeLineup.length === 0 && !lookingForUndercard) {
        return null;
    }
    const handleSignUp = () => {
        setIsModalOpen(false);
        // Pass event_id so the registration can create an undercard request
        const url = eventId
            ? `/artists/register?event_id=${eventId}`
            : '/artists/register';
        navigate(url);
    };
    return (_jsxs(_Fragment, { children: [_jsx(FmCommonCollapsibleSection, { title: t('undercardApplication.callTimes'), defaultExpanded: true, className: className, children: _jsxs(FmCommonStackLayout, { spacing: 'md', children: [callTimeLineup.map((artist, index) => {
                            const isHeadliner = artist.roleLabel === 'Headliner';
                            return (_jsx(FmArtistRow, { artist: artist, onSelect: onArtistSelect, variant: isHeadliner ? 'featured' : 'default' }, `${artist.name}-${index}`));
                        }), lookingForUndercard && (_jsx("div", { className: 'flex justify-center mt-4', children: _jsx(Button, { variant: 'outline', onClick: () => setIsModalOpen(true), className: 'w-full py-1.5 px-4 border border-fm-gold bg-transparent text-white hover:text-fm-gold hover:bg-fm-gold/10 text-xs transition-all duration-300', children: t('undercardApplication.acceptingApplications') }) }))] }) }), _jsx(Dialog, { open: isModalOpen, onOpenChange: setIsModalOpen, children: _jsxs(DialogContent, { className: 'max-w-md bg-background/95 backdrop-blur border border-border/60 p-0 overflow-hidden', children: [_jsx(DialogHeader, { className: 'px-6 pt-6 pb-4', children: _jsxs(DialogTitle, { className: 'font-canela text-xl flex items-center gap-2', children: [_jsx(Music, { className: 'h-5 w-5 text-fm-gold' }), t('undercardApplication.modalTitle')] }) }), _jsxs("div", { className: 'px-6 pb-6 space-y-4', children: [_jsx("p", { className: 'text-muted-foreground leading-relaxed', children: t('undercardApplication.modalDescription') }), _jsxs("div", { className: 'p-4 bg-fm-gold/10 border border-fm-gold/20 rounded-none', children: [_jsx("h4", { className: 'font-semibold text-fm-gold mb-2', children: t('undercardApplication.howToApply') }), _jsxs("ol", { className: 'text-sm text-muted-foreground space-y-2 list-decimal list-inside', children: [_jsx("li", { children: t('undercardApplication.step1') }), _jsx("li", { children: t('undercardApplication.step2') }), _jsx("li", { children: t('undercardApplication.step3') })] })] }), _jsxs(Button, { variant: 'outline', onClick: handleSignUp, className: 'w-full border-fm-gold bg-transparent text-white hover:text-fm-gold hover:bg-fm-gold/10', children: [t('undercardApplication.signUpAsArtist'), _jsx(ArrowRight, { className: 'ml-2 h-4 w-4' })] }), _jsx("p", { className: 'text-xs text-center text-muted-foreground/70', children: t('undercardApplication.alreadyHaveProfile') })] })] }) })] }));
};
