import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { ArrowRight, Mail, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/common/shadcn/button';
import { FmI18nCommon } from '@/components/common/i18n';
import { Dialog, DialogContent } from '@/components/common/shadcn/dialog';
export const ClaimSuccessModal = ({ open, claimPosition, locationName, promoCode, onClose, }) => {
    const { t } = useTranslation('common');
    const navigate = useNavigate();
    const [confettiVisible, setConfettiVisible] = useState(false);
    useEffect(() => {
        if (open) {
            setConfettiVisible(true);
            setTimeout(() => setConfettiVisible(false), 3000);
        }
    }, [open]);
    const getPositionText = (position) => {
        if (position === 1)
            return t('scavenger.claimSuccess.ordinal1');
        if (position === 2)
            return t('scavenger.claimSuccess.ordinal2');
        if (position === 3)
            return t('scavenger.claimSuccess.ordinal3');
        return t('scavenger.claimSuccess.ordinalN', { position });
    };
    return (_jsx(Dialog, { open: open, onOpenChange: onClose, children: _jsx(DialogContent, { className: 'max-w-lg bg-background border-fm-gold', children: _jsxs("div", { className: 'text-center py-8 px-4', children: [_jsxs("div", { className: 'relative mb-6', children: [_jsx("div", { className: `inline-block p-6 bg-gradient-gold rounded-full ${confettiVisible ? 'animate-scale-in' : ''}`, children: _jsx(Trophy, { className: 'w-16 h-16 text-primary-foreground' }) }), confettiVisible && (_jsx("div", { className: 'absolute inset-0 flex items-center justify-center pointer-events-none', children: _jsx("div", { className: 'text-6xl animate-pulse-gold', children: "\uD83C\uDF89" }) }))] }), _jsx(FmI18nCommon, { i18nKey: 'scavenger.claimSuccess.title', as: 'h2', className: 'font-display text-4xl mb-4 text-foreground' }), _jsxs("p", { className: 'text-lg text-muted-foreground mb-2', children: [t('scavenger.claimSuccess.youreThe'), ' ', _jsx("span", { className: 'font-bold text-fm-gold', children: getPositionText(claimPosition) }), ' ', t('scavenger.claimSuccess.person')] }), _jsxs("p", { className: 'text-lg text-muted-foreground mb-6', children: [t('scavenger.claimSuccess.toFind'), " ", _jsx("span", { className: 'font-semibold', children: locationName }), "!"] }), _jsxs("div", { className: 'bg-muted/30 border border-border rounded-lg p-6 mb-6', children: [_jsx("div", { className: 'text-sm text-muted-foreground mb-2', children: t('scavenger.claimSuccess.yourReward') }), _jsx(FmI18nCommon, { i18nKey: 'scavenger.claimSuccess.exclusiveReward', as: 'div', className: 'text-3xl font-display mb-3' }), _jsxs("div", { className: 'bg-background border-2 border-fm-gold rounded-lg p-4', children: [_jsx("div", { className: 'text-xs text-muted-foreground mb-1', children: t('ticketingPanel.promoCode') }), _jsx("div", { className: 'text-2xl font-mono font-bold tracking-wider text-fm-gold', children: promoCode })] })] }), _jsxs("div", { className: 'flex items-center justify-center gap-2 text-sm text-muted-foreground mb-8', children: [_jsx(Mail, { className: 'w-4 h-4' }), _jsx("span", { children: t('scavenger.claimSuccess.checkEmail') })] }), _jsxs(Button, { onClick: () => {
                            onClose();
                            navigate('/scavenger');
                        }, className: 'w-full bg-gradient-gold hover:opacity-90 text-primary-foreground font-display text-lg py-6', children: [t('buttons.continue'), _jsx(ArrowRight, { className: 'ml-2 w-5 h-5' })] })] }) }) }));
};
