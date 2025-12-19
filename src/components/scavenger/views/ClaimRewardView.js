import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { MessagePanel } from '@/components/feedback/MessagePanel';
import { Button } from '@/components/common/shadcn/button';
export function ClaimRewardView({ locationName, onClaim, isLoading, }) {
    const { t } = useTranslation('common');
    const handleClaim = async () => {
        try {
            await onClaim();
            toast.success(t('scavenger.claimReward.successMessage'));
            window.location.href = '/scavenger';
        }
        catch (_error) {
            toast.error(t('scavenger.claimReward.errorMessage'));
        }
    };
    return (_jsxs(_Fragment, { children: [_jsx(MessagePanel, { title: t('scavenger.claimReward.title', { locationName }), description: t('scavenger.claimReward.description'), className: 'mb-6' }), _jsx("div", { className: 'text-center', children: _jsx(Button, { size: 'lg', className: 'bg-gradient-gold hover:opacity-90 font-screamer text-xl px-12 py-6 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(212,175,55,0.6)]', onClick: handleClaim, disabled: isLoading, children: isLoading ? t('scavenger.claimReward.claiming') : t('scavenger.claimReward.claimButton') }) })] }));
}
