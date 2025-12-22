import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { Eye, Share2, Star } from 'lucide-react';
/**
 * EventHeaderActions - Interest, share, and view count buttons
 *
 * Extracted from EventDetailsContent.tsx for better component organization.
 */
export const EventHeaderActions = ({ isInterested, isInterestLoading, interestCount, shouldShowInterestCount, shareCount, shouldShowShareCount, viewCount, showViewCount, guestListEnabled, onInterestClick, onShareClick, }) => {
    const { t } = useTranslation('common');
    return (_jsxs("div", { className: 'flex items-center gap-2', children: [_jsxs("button", { type: 'button', "aria-label": isInterested ? t('eventActions.removeInterest') : t('eventActions.markAsInterested'), onClick: onInterestClick, disabled: isInterestLoading, className: 'h-10 px-3 rounded-none flex items-center justify-center gap-2 bg-white/5 text-muted-foreground border border-transparent transition-all duration-200 hover:bg-white/10 hover:text-fm-gold hover:border-fm-gold hover:scale-105 active:scale-95 relative overflow-hidden cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed', children: [_jsx(Star, { className: `h-4 w-4 transition-all duration-300 ${isInterested
                            ? 'fill-fm-gold text-fm-gold'
                            : 'text-muted-foreground'}` }), shouldShowInterestCount && interestCount > 0 && (_jsx("span", { className: 'text-xs text-muted-foreground', children: interestCount.toLocaleString() }))] }), _jsxs("div", { className: 'flex items-center gap-1', children: [_jsx("button", { type: 'button', "aria-label": t('eventActions.shareEvent'), onClick: onShareClick, className: 'h-10 w-10 rounded-none flex items-center justify-center bg-white/5 text-muted-foreground border border-transparent transition-all duration-200 hover:bg-white/10 hover:text-fm-gold hover:border-fm-gold hover:scale-105 active:scale-95 relative overflow-hidden cursor-pointer', children: _jsx(Share2, { className: 'h-4 w-4' }) }), shouldShowShareCount && shareCount > 0 && (_jsx("span", { className: 'text-xs text-muted-foreground ml-1', children: shareCount.toLocaleString() }))] }), !guestListEnabled && showViewCount && (_jsxs("div", { className: 'flex items-center gap-2 px-3 py-2 h-10 bg-white/5 rounded-none border border-transparent', children: [_jsx(Eye, { className: 'w-4 h-4 text-muted-foreground' }), _jsx("span", { className: 'text-sm text-muted-foreground', children: viewCount.toLocaleString() })] }))] }));
};
