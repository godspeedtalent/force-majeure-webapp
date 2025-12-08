import { EventStatus } from '@/features/events/types';
import { Badge } from '@/components/common/shadcn/badge';

interface EventStatusBadgeProps {
  status: EventStatus;
  className?: string;
}

export const EventStatusBadge = ({ status, className = '' }: EventStatusBadgeProps) => {
  const getStatusConfig = (status: EventStatus) => {
    switch (status) {
      case 'draft':
        return {
          label: 'DRAFT',
          className: 'bg-muted text-muted-foreground border-border',
          showPulse: false,
        };
      case 'published':
        return {
          label: 'LIVE',
          className: 'bg-green-500/10 text-green-500 border-green-500/20',
          showPulse: true,
        };
      case 'invisible':
        return {
          label: 'HIDDEN',
          className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
          showPulse: false,
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge
      variant="outline"
      className={`font-screamer text-xs px-3 py-1 flex items-center gap-2 ${config.className} ${className}`}
    >
      {config.showPulse && (
        <span className='relative flex h-2 w-2'>
          <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75'></span>
          <span className='relative inline-flex rounded-full h-2 w-2 bg-green-500'></span>
        </span>
      )}
      {config.label}
    </Badge>
  );
};
