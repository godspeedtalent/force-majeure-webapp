import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Check, Share2, Eye, MapPin, Calendar, Music } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, } from '@/components/common/shadcn/dialog';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { cn } from '@/shared';
import { FmI18nCommon } from '@/components/common/i18n';
export const FmShareModal = ({ open, onOpenChange, title, url = window.location.href, onShare, shareCount = 0, viewCount = 0, eventImage, venueName, dateTime, undercardArtists = [], }) => {
    // Keep t() for toast messages and interpolated values
    const { t } = useTranslation('common');
    const { t: tToast } = useTranslation('toasts');
    const [copied, setCopied] = useState(false);
    const handleCopyUrl = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            toast.success(tToast('success.copied'));
            // Call onShare callback to track the share
            if (onShare) {
                onShare();
            }
            // Reset copied state after 2 seconds
            setTimeout(() => {
                setCopied(false);
            }, 2000);
        }
        catch (error) {
            toast.error(tToast('share.copyFailed'));
        }
    };
    return (_jsx(Dialog, { open: open, onOpenChange: onOpenChange, children: _jsxs(DialogContent, { className: 'max-w-4xl bg-background/37 backdrop-blur-xl', children: [_jsx(DialogHeader, { children: _jsxs(DialogTitle, { className: 'font-canela text-2xl flex items-center gap-3', children: [_jsx(Share2, { className: 'h-5 w-5 text-fm-gold' }), _jsx(FmI18nCommon, { i18nKey: 'share.shareEvent' })] }) }), _jsxs("div", { className: 'flex gap-6 mt-4', children: [eventImage && (_jsx("div", { className: 'flex-shrink-0 w-64', children: _jsx("img", { src: eventImage, alt: title, className: 'w-full h-full object-cover rounded-none' }) })), _jsxs("div", { className: 'flex-1 space-y-6', children: [_jsxs("div", { children: [_jsxs("p", { className: 'text-sm text-muted-foreground mb-2', children: [_jsx(FmI18nCommon, { i18nKey: 'share.sharing' }), ":"] }), _jsxs("div", { className: 'flex items-start justify-between gap-4', children: [_jsxs("div", { className: 'flex-1', children: [_jsx("p", { className: 'font-canela text-lg text-foreground mb-3', children: title }), _jsxs("div", { className: 'space-y-2 text-sm', children: [venueName && (_jsxs("div", { className: 'flex items-center gap-2 text-muted-foreground', children: [_jsx(MapPin, { className: 'h-3.5 w-3.5 flex-shrink-0 text-fm-gold' }), _jsx("span", { children: venueName })] })), dateTime && (_jsxs("div", { className: 'flex items-center gap-2 text-muted-foreground', children: [_jsx(Calendar, { className: 'h-3.5 w-3.5 flex-shrink-0 text-fm-gold' }), _jsx("span", { children: dateTime })] })), undercardArtists.length > 0 && (_jsxs("div", { className: 'flex items-start gap-2 text-muted-foreground', children: [_jsx(Music, { className: 'h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-fm-gold' }), _jsx("span", { children: undercardArtists.join(', ') })] }))] })] }), _jsxs("div", { className: 'flex flex-col gap-2 text-sm text-muted-foreground', children: [shareCount > 0 && (_jsxs("div", { className: 'flex items-center gap-2', children: [_jsx(Share2, { className: 'h-4 w-4' }), _jsx("span", { children: t('share.shareCount', { count: shareCount }) })] })), viewCount > 0 && (_jsxs("div", { className: 'flex items-center gap-2', children: [_jsx(Eye, { className: 'h-4 w-4' }), _jsx("span", { children: t('share.viewCount', { count: viewCount }) })] }))] })] })] }), _jsxs("div", { className: 'max-w-[40vw]', children: [_jsx(FmI18nCommon, { i18nKey: 'share.eventUrl', as: 'label', className: 'text-xs uppercase text-muted-foreground mb-2 block' }), _jsxs("div", { className: cn('relative flex items-center gap-3 p-4 border-2 border-t-2 border-l-2 border-r-2 border-b-[3px] rounded-none transition-all duration-300 cursor-pointer group overflow-hidden', 'bg-background/40 hover:bg-white/5', 'border-white/20 hover:border-fm-gold border-b-fm-gold', 'hover:shadow-[0_4px_16px_rgba(223,186,125,0.2)]', 'active:shadow-[0_0_30px_rgba(223,186,125,0.4)] active:bg-fm-gold/10'), onClick: handleCopyUrl, children: [_jsx("div", { className: 'flex-1 min-w-0 overflow-hidden', children: _jsx("p", { className: 'text-sm text-foreground group-hover:text-fm-gold truncate font-mono transition-colors duration-200', children: url }) }), _jsx("div", { className: 'flex-shrink-0', children: copied ? (_jsx(Check, { className: 'h-4 w-4 text-green-500' })) : (_jsx(Copy, { className: 'h-4 w-4 text-muted-foreground group-hover:text-fm-gold transition-colors' })) })] }), _jsx(FmI18nCommon, { i18nKey: 'share.clickToCopy', as: 'p', className: 'text-xs text-muted-foreground mt-2' })] }), _jsx("div", { className: 'flex justify-end gap-3 pt-4', children: _jsx(FmCommonButton, { variant: 'secondary', onClick: () => onOpenChange(false), children: _jsx(FmI18nCommon, { i18nKey: 'buttons.close' }) }) })] })] })] }) }));
};
