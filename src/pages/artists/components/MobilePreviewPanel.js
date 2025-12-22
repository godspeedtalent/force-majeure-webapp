import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared';
import { ArtistPreviewCard } from './ArtistPreviewCard';
export function MobilePreviewPanel({ formData, genreBadges, isExpanded, onToggle, onInputChange, }) {
    const { t } = useTranslation('common');
    return (_jsxs(_Fragment, { children: [isExpanded && (_jsx("div", { className: 'fixed inset-0 bg-black/50 z-40', onClick: onToggle, "aria-hidden": 'true' })), _jsxs("div", { className: cn('fixed left-0 right-0 z-50', 'bg-black/80 backdrop-blur-lg', 'border-t border-white/20', 'transition-all duration-300 ease-out', isExpanded
                    ? 'bottom-0 h-[70vh]'
                    : 'bottom-0 h-[60px]'), style: {
                    paddingBottom: 'env(safe-area-inset-bottom)',
                }, children: [_jsxs("button", { onClick: onToggle, className: cn('w-full flex items-center justify-between px-[20px] h-[60px]', 'hover:bg-white/5 transition-colors duration-200', 'border-b border-white/10'), children: [_jsxs("div", { className: 'flex items-center gap-[10px]', children: [_jsx("div", { className: 'w-[40px] h-[40px] flex-shrink-0 overflow-hidden rounded-none border border-white/20', children: formData.profileImageUrl ? (_jsx("img", { src: formData.profileImageUrl, alt: formData.stageName || 'Preview', className: 'w-full h-full object-cover', onError: e => {
                                                e.currentTarget.style.display = 'none';
                                            } })) : (_jsx("div", { className: 'w-full h-full bg-gradient-to-br from-fm-gold/15 via-fm-gold/5 to-transparent' })) }), _jsxs("div", { className: 'flex flex-col items-start', children: [_jsx("span", { className: 'font-canela text-sm text-white truncate max-w-[150px]', children: formData.stageName || t('artistPreview.yourName') }), _jsx("span", { className: 'font-canela text-xs text-muted-foreground', children: isExpanded ? t('mobilePreview.closePreview') : t('mobilePreview.tapToPreview') })] })] }), _jsxs("div", { className: 'flex items-center gap-[5px] text-fm-gold', children: [_jsx("span", { className: 'font-canela text-xs uppercase tracking-wider', children: t('mobilePreview.preview') }), isExpanded ? (_jsx(ChevronDown, { className: 'h-5 w-5' })) : (_jsx(ChevronUp, { className: 'h-5 w-5' }))] })] }), isExpanded && (_jsx("div", { className: 'flex-1 overflow-y-auto p-[20px] h-[calc(70vh-60px)]', children: _jsxs("div", { className: 'max-w-lg mx-auto', children: [_jsx("p", { className: 'font-canela text-xs text-muted-foreground text-center mb-[20px]', children: t('mobilePreview.profileLookDescription') }), _jsx(ArtistPreviewCard, { formData: formData, genreBadges: genreBadges, onInputChange: onInputChange })] }) }))] })] }));
}
