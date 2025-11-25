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
        };
      case 'published':
        return {
          label: 'LIVE',
          className: 'bg-green-500/10 text-green-500 border-green-500/20',
        };
      case 'invisible':
        return {
          label: 'HIDDEN',
          className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge
      variant="outline"
      className={`font-screamer text-xs px-3 py-1 ${config.className} ${className}`}
    >
      {config.label}
    </Badge>
  );
};
