import { useTranslation } from 'react-i18next';
import { EventStatus } from '@/features/events/types';
import { Badge } from '@/components/common/shadcn/badge';

interface EventStatusBadgeProps {
  status: EventStatus;
  className?: string;
}

type PulseStyle = 'none' | 'green' | 'gold' | 'purple';

export const EventStatusBadge = ({ status, className = '' }: EventStatusBadgeProps) => {
  const { t } = useTranslation('common');

  const getStatusConfig = (status: EventStatus) => {
    switch (status) {
      case 'draft':
        return {
          label: t('eventStatus.draft'),
          className: 'bg-fm-gold/10 text-fm-gold border-fm-gold/30 animate-glow-gold',
          indicatorColor: 'bg-yellow-400',
          pulseStyle: 'gold' as PulseStyle,
        };
      case 'published':
        return {
          label: t('eventStatus.live'),
          className: 'bg-green-500/10 text-green-500 border-green-500/20',
          indicatorColor: 'bg-green-500',
          pulseStyle: 'green' as PulseStyle,
        };
      case 'invisible':
        return {
          label: t('eventStatus.hidden'),
          className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
          indicatorColor: null,
          pulseStyle: 'none' as PulseStyle,
        };
      case 'test':
        return {
          label: t('eventStatus.test'),
          className: 'bg-fm-purple/10 text-fm-purple border-fm-purple/20 animate-glow-purple',
          indicatorColor: 'bg-fm-purple',
          pulseStyle: 'purple' as PulseStyle,
        };
    }
  };

  const config = getStatusConfig(status);

  const renderIndicator = () => {
    if (!config.indicatorColor) return null;

    const pulseColorClass = {
      green: 'bg-green-500',
      gold: 'bg-fm-gold',
      purple: 'bg-fm-purple',
      none: '',
    }[config.pulseStyle];

    return (
      <span className='relative flex h-2 w-2'>
        {config.pulseStyle !== 'none' && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full ${pulseColorClass} opacity-75`}
            style={{ animationDuration: config.pulseStyle === 'green' ? '1s' : '3s' }}
          />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${config.indicatorColor}`} />
      </span>
    );
  };

  return (
    <Badge
      variant="outline"
      className={`font-canela text-sm px-3 py-1 flex items-center gap-2 ${config.className} ${className}`}
    >
      {renderIndicator()}
      {config.label}
    </Badge>
  );
};
