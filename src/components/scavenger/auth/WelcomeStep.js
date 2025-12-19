import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { ExternalLink } from 'lucide-react';
import { DecorativeDivider } from '@/components/primitives/DecorativeDivider';
import { MessagePanel } from '@/components/feedback/MessagePanel';
import { FmI18nCommon } from '@/components/common/i18n';
import { Button } from '@/components/common/shadcn/button';
import { PromoCodePanel } from './PromoCodePanel';
import { LF_SYSTEM_TICKET_URL, PROMO_CODE, } from '@/shared';
// Dumb component: Success state for users who have already claimed
export function ClaimSuccessPanel({ userFullName }) {
    const { t } = useTranslation('common');
    return (_jsx(MessagePanel, { title: t('scavenger.claimSuccess.title'), description: '', action: _jsxs(_Fragment, { children: [_jsxs("p", { className: 'text-m text-white mb-6', children: [t('scavenger.claimSuccess.addedToGuestlist'), " ", _jsx("br", {}), _jsx("span", { className: 'text-fm-gold font-semibold', children: "LF SYSTEM @ Kingdom | Sat 10.18" }), ' ', _jsx("br", {}), t('scavenger.claimSuccess.seeYouThere')] }), _jsx(DecorativeDivider, {}), _jsx("p", { className: 'text-sm text-muted-foreground mb-6', children: t('scavenger.claimSuccess.checkInInstructions') }), _jsxs("p", { className: 'text-sm text-white mb-6', children: [' ', t('scavenger.claimSuccess.nameListedAs'), ' ', _jsx("span", { className: 'text-fm-gold font-medium', children: userFullName }), "."] }), _jsxs("p", { className: 'text-sm text-muted-foreground mb-6', children: [t('scavenger.claimSuccess.incorrectNameHelp'), ' ', _jsx("span", { className: 'text-fm-gold', children: "@force.majeure.events" }), ' ', t('scavenger.claimSuccess.onInstagram')] }), _jsx(DecorativeDivider, {}), _jsxs("p", { className: 'text-base text-white mb-6', children: [t('scavenger.claimSuccess.needMoreTickets'), ' ', _jsx("span", { className: 'text-fm-gold font-bold', children: PROMO_CODE }), ' ', t('scavenger.claimSuccess.discountOff')] }), _jsxs(Button, { size: 'lg', className: 'w-full max-w-xs mx-auto bg-gradient-gold hover:opacity-90 font-semibold text-black transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]', onClick: () => window.open(LF_SYSTEM_TICKET_URL, '_blank'), children: [_jsx(ExternalLink, { className: 'mr-2 h-4 w-4' }), t('buttons.buyTickets')] })] }) }));
}
// Dumb component: Claim button for authenticated users at a checkpoint
export function CheckpointClaimPanel({ locationName, onClaimClick, isLoading, }) {
    const { t } = useTranslation('common');
    return (_jsx(MessagePanel, { title: '', description: '', action: _jsxs(_Fragment, { children: [_jsxs("h1", { className: 'font-display text-5xl md:text-6xl mb-4', children: [t('scavenger.checkpoint.welcomeTo'), ' ', _jsx("span", { className: 'text-fm-gold', children: locationName }), ' ', t('scavenger.checkpoint.checkpoint')] }), _jsx(FmI18nCommon, { i18nKey: 'scavenger.checkpoint.getOnGuestlist', as: 'p', className: 'text-base text-muted-foreground' }), _jsx(DecorativeDivider, {}), _jsx(Button, { size: 'lg', className: 'w-full max-w-xs mx-auto mb-6 bg-gradient-gold hover:opacity-90 font-semibold text-black transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none', onClick: onClaimClick, disabled: isLoading, children: isLoading ? (_jsxs(_Fragment, { children: [_jsx("div", { className: 'mr-2 h-4 w-4 animate-spin rounded-full border-2 border-fm-gold border-b-transparent' }), t('scavenger.checkpoint.addingToGuestlist')] })) : (t('scavenger.checkpoint.joinGuestlist')) })] }) }));
}
// Dumb component: Welcome screen for unauthenticated users at a checkpoint
export function CheckpointWelcomePanel({ locationName, onJoinClick, onSignInClick, }) {
    const { t } = useTranslation('common');
    return (_jsx(MessagePanel, { title: '', description: '', action: _jsxs(_Fragment, { children: [_jsxs("h1", { className: 'font-display text-5xl md:text-6xl mb-4', children: [t('scavenger.checkpoint.welcomeTo'), ' ', _jsx("span", { className: 'text-fm-gold', children: locationName }), ' ', t('scavenger.checkpoint.checkpoint')] }), _jsx(FmI18nCommon, { i18nKey: 'scavenger.checkpoint.signUpPrompt', as: 'p', className: 'text-base text-muted-foreground mb-4' }), _jsx(DecorativeDivider, {}), _jsx(Button, { size: 'lg', className: 'w-full max-w-xs mx-auto bg-gradient-gold hover:opacity-90 font-semibold text-black transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]', onClick: onJoinClick, children: t('scavenger.buttons.join') }), _jsx(Button, { size: 'lg', className: 'w-full max-w-xs mx-auto mt-4 bg-transparent border-2 border-white text-white hover:bg-white hover:text-black font-semibold transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]', onClick: onSignInClick, children: t('auth.signIn') })] }) }));
}
// Dumb component: General welcome screen when no checkpoint is scanned
export function NoCheckpointPanel({ onJoinClick, onSignInClick, }) {
    const { t } = useTranslation('common');
    return (_jsx(MessagePanel, { title: t('scavenger.noCheckpoint.title'), description: t('scavenger.noCheckpoint.description'), action: _jsxs(_Fragment, { children: [_jsx(DecorativeDivider, {}), _jsx(FmI18nCommon, { i18nKey: 'scavenger.noCheckpoint.registerTitle', as: 'h2', className: 'font-display text-2xl md:text-3xl text-fm-gold' }), _jsx(FmI18nCommon, { i18nKey: 'scavenger.noCheckpoint.registerDescription', as: 'p', className: 'text-base text-muted-foreground' }), _jsx(Button, { size: 'lg', className: 'w-full max-w-xs mx-auto bg-gradient-gold hover:opacity-90 font-semibold text-black transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]', onClick: onJoinClick, children: t('scavenger.buttons.join') }), _jsx(Button, { size: 'lg', className: 'w-full max-w-xs mx-auto mt-4 bg-transparent border-2 border-white text-white hover:bg-white hover:text-black font-semibold transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]', onClick: onSignInClick, children: t('auth.signIn') })] }) }));
}
export function WelcomeStep({ locationName, onJoinClick, onSignInClick, onClaimCheckpoint, userFullName, isAuthenticated = false, hasAlreadyClaimed = false, isClaimLoading = false, claimCount = 0, lowClaimLocationsCount, }) {
    // Show success panel if user has already claimed
    if (hasAlreadyClaimed && isAuthenticated) {
        return _jsx(ClaimSuccessPanel, { userFullName: userFullName });
    }
    // Check if claim limit reached (2 claims per checkpoint)
    if (locationName && claimCount >= 2) {
        return (_jsx(PromoCodePanel, { userDisplayName: userFullName, onJoinClick: onJoinClick, onSignInClick: onSignInClick, lowClaimLocationsCount: lowClaimLocationsCount }));
    }
    // Show claim interface for authenticated users with valid checkpoint
    if (locationName && isAuthenticated) {
        return (_jsx(CheckpointClaimPanel, { locationName: locationName, onClaimClick: onClaimCheckpoint || (() => { }), isLoading: isClaimLoading }));
    }
    if (locationName) {
        // With location name (valid checkpoint) - unauthenticated user
        return (_jsx(CheckpointWelcomePanel, { locationName: locationName, onJoinClick: onJoinClick, onSignInClick: onSignInClick }));
    }
    // Without location name (no code or early arrival)
    return (_jsx(NoCheckpointPanel, { onJoinClick: onJoinClick, onSignInClick: onSignInClick }));
}
