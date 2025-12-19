import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { Plus, BarChart3 } from 'lucide-react';
import { Button } from '@/components/common/shadcn/button';
import { Card, CardContent } from '@/components/common/shadcn/card';
import { Badge } from '@/components/common/shadcn/badge';
import { Separator } from '@/components/common/shadcn/separator';
import { FmI18nCommon } from '@/components/common/i18n';
import { cn } from '@/shared';
import { GROUP_COLORS } from '../constants';
export function GroupNavigation({ groups, activeView, onViewChange, onAddGroup, }) {
    const { t } = useTranslation('common');
    return (_jsx("div", { className: 'w-64 flex-shrink-0', children: _jsx(Card, { className: 'sticky top-4', children: _jsx(CardContent, { className: 'p-4', children: _jsxs("div", { className: 'space-y-2', children: [_jsxs("button", { onClick: () => onViewChange('overview'), className: cn('w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors', activeView === 'overview'
                                ? 'bg-fm-gold/20 text-fm-gold font-semibold'
                                : 'hover:bg-muted text-foreground'), children: [_jsx(BarChart3, { className: 'h-4 w-4' }), _jsx(FmI18nCommon, { i18nKey: 'ticketGroupManager.overview' })] }), _jsx(Separator, { className: 'my-3' }), _jsx("div", { className: 'space-y-1', children: groups.map((group, index) => {
                                const colorConfig = GROUP_COLORS.find(c => c.value === group.color) ||
                                    GROUP_COLORS[0];
                                return (_jsxs("button", { onClick: () => onViewChange(group.id), className: cn('w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors', activeView === group.id
                                        ? 'bg-fm-gold/20 text-fm-gold font-semibold'
                                        : 'hover:bg-muted text-foreground'), children: [_jsx("div", { className: cn('w-3 h-3 rounded-full flex-shrink-0', colorConfig.value) }), _jsx("span", { className: 'flex-1 text-left truncate', children: group.name || t('ticketGroupManager.defaultGroupName', { number: index + 1 }) }), _jsx(Badge, { variant: 'outline', className: 'text-xs', children: group.tiers.length })] }, group.id));
                            }) }), _jsx(Separator, { className: 'my-3' }), _jsxs(Button, { variant: 'outline', size: 'sm', onClick: onAddGroup, className: 'w-full border-dashed hover:border-fm-gold hover:text-fm-gold', children: [_jsx(Plus, { className: 'h-4 w-4 mr-2' }), _jsx(FmI18nCommon, { i18nKey: 'ticketGroupManager.newGroup' })] })] }) }) }) }));
}
