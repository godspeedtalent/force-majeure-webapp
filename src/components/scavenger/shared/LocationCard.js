import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { MapPin, Tag } from 'lucide-react';
import { Card } from '@/components/common/shadcn/card';
import { Progress } from '@/components/common/shadcn/progress';
export const LocationCard = ({ locationName, totalTokens, tokensRemaining, }) => {
    const { t } = useTranslation('common');
    const claimedCount = totalTokens - tokensRemaining;
    const progressPercentage = (claimedCount / totalTokens) * 100;
    const isFullyClaimed = tokensRemaining === 0;
    const rewardIcon = _jsx(Tag, { className: 'w-5 h-5' });
    const rewardText = t('locationCard.exclusiveReward');
    return (_jsxs(Card, { className: `p-6 transition-all duration-300 ${isFullyClaimed
            ? 'bg-muted/50 border-muted'
            : 'bg-card hover:shadow-gold border-border'}`, children: [_jsxs("div", { className: 'flex items-start gap-4 mb-4', children: [_jsx("div", { className: `p-3 rounded-lg ${isFullyClaimed ? 'bg-muted' : 'bg-gradient-gold'}`, children: _jsx(MapPin, { className: `w-6 h-6 ${isFullyClaimed
                                ? 'text-muted-foreground'
                                : 'text-primary-foreground'}` }) }), _jsxs("div", { className: 'flex-1 min-w-0', children: [_jsx("h3", { className: 'font-display text-xl mb-1 truncate', children: locationName }), _jsxs("div", { className: 'flex items-center gap-2 text-sm text-muted-foreground', children: [rewardIcon, _jsx("span", { children: rewardText })] })] })] }), _jsxs("div", { className: 'space-y-2', children: [_jsx(Progress, { value: progressPercentage, className: 'h-2' }), _jsxs("div", { className: 'flex items-center justify-between text-sm', children: [_jsx("span", { className: `font-semibold ${isFullyClaimed
                                    ? 'text-muted-foreground'
                                    : tokensRemaining <= 2
                                        ? 'text-destructive animate-pulse'
                                        : 'text-foreground'}`, children: t('locationCard.claimedOf', { claimed: claimedCount, total: totalTokens }) }), isFullyClaimed ? (_jsx("span", { className: 'text-muted-foreground font-medium', children: t('locationCard.allClaimed') })) : (_jsx("span", { className: 'text-fm-gold font-medium', children: t('locationCard.tokensLeft', { count: tokensRemaining }) }))] })] })] }));
};
