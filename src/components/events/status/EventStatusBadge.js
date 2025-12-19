import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/common/shadcn/badge';
export const EventStatusBadge = ({ status, className = '' }) => {
    const { t } = useTranslation('common');
    const getStatusConfig = (status) => {
        switch (status) {
            case 'draft':
                return {
                    label: t('eventStatus.draft'),
                    className: 'bg-muted text-muted-foreground border-border',
                    showPulse: false,
                };
            case 'published':
                return {
                    label: t('eventStatus.live'),
                    className: 'bg-green-500/10 text-green-500 border-green-500/20',
                    showPulse: true,
                };
            case 'invisible':
                return {
                    label: t('eventStatus.hidden'),
                    className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
                    showPulse: false,
                };
        }
    };
    const config = getStatusConfig(status);
    return (_jsxs(Badge, { variant: "outline", className: `font-screamer text-xs px-3 py-1 flex items-center gap-2 ${config.className} ${className}`, children: [config.showPulse && (_jsxs("span", { className: 'relative flex h-2 w-2', children: [_jsx("span", { className: 'animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75' }), _jsx("span", { className: 'relative inline-flex rounded-full h-2 w-2 bg-green-500' })] })), config.label] }));
};
