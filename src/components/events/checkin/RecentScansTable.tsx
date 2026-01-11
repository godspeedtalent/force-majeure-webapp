import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';
import { Badge } from '@/components/common/shadcn/badge';
import { FmCommonCard, FmCommonCardContent, FmCommonCardHeader, FmCommonCardTitle } from '@/components/common/display/FmCommonCard';
import { cn } from '@/shared';
import type { RecentScanEvent } from '@/features/events/hooks/useCheckInStats';

interface RecentScansTableProps {
  scans: RecentScanEvent[];
  /** Maximum number of scans to display */
  limit?: number;
}

/**
 * RecentScansTable
 *
 * Displays a real-time feed of recent scan events with status indicators.
 */
export const RecentScansTable = ({ scans, limit = 10 }: RecentScansTableProps) => {
  const { t } = useTranslation('common');

  const displayScans = scans.slice(0, limit);

  // Get icon and color for scan result
  const getScanResultDisplay = (result: RecentScanEvent['scanResult']) => {
    switch (result) {
      case 'success':
        return {
          icon: CheckCircle,
          color: 'text-green-500',
          bgColor: 'bg-green-500/20',
          label: t('ticketStatus.scanSuccess'),
        };
      case 'invalid':
        return {
          icon: XCircle,
          color: 'text-fm-danger',
          bgColor: 'bg-fm-danger/20',
          label: t('ticketStatus.scanInvalid'),
        };
      case 'already_used':
        return {
          icon: AlertTriangle,
          color: 'text-fm-gold',
          bgColor: 'bg-fm-gold/20',
          label: t('ticketStatus.scanDuplicate'),
        };
      case 'refunded':
        return {
          icon: XCircle,
          color: 'text-muted-foreground',
          bgColor: 'bg-white/10',
          label: t('ticketStatus.scanRefunded'),
        };
      case 'cancelled':
        return {
          icon: XCircle,
          color: 'text-muted-foreground',
          bgColor: 'bg-white/10',
          label: t('ticketStatus.scanCancelled'),
        };
      default:
        return {
          icon: Clock,
          color: 'text-muted-foreground',
          bgColor: 'bg-white/10',
          label: result,
        };
    }
  };

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);

    if (diffSec < 60) {
      return t('ticketStatus.justNow');
    }
    if (diffMin < 60) {
      return t('ticketStatus.minutesAgo', { count: diffMin });
    }
    if (diffHour < 24) {
      return t('ticketStatus.hoursAgo', { count: diffHour });
    }
    return date.toLocaleTimeString();
  };

  if (displayScans.length === 0) {
    return (
      <FmCommonCard>
        <FmCommonCardContent className="py-8 text-center text-muted-foreground">
          <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>{t('ticketStatus.noRecentScans')}</p>
        </FmCommonCardContent>
      </FmCommonCard>
    );
  }

  return (
    <FmCommonCard>
      <FmCommonCardHeader className="pb-2">
        <FmCommonCardTitle className="text-sm font-medium flex items-center gap-2">
          <Clock className="w-4 h-4" />
          {t('ticketStatus.recentScans')}
          <Badge variant="outline" className="ml-auto text-xs">
            {scans.length} {t('ticketStatus.total').toLowerCase()}
          </Badge>
        </FmCommonCardTitle>
      </FmCommonCardHeader>
      <FmCommonCardContent className="p-0">
        <div className="divide-y divide-white/10 max-h-[400px] overflow-y-auto">
          {displayScans.map((scan, index) => {
            const display = getScanResultDisplay(scan.scanResult);
            const Icon = display.icon;

            return (
              <div
                key={scan.id}
                className={cn(
                  'flex items-center gap-3 p-3 transition-colors',
                  index === 0 && 'bg-white/5 animate-pulse',
                  'hover:bg-white/5'
                )}
              >
                {/* Status icon */}
                <div className={cn('p-2 rounded-none', display.bgColor)}>
                  <Icon className={cn('w-4 h-4', display.color)} />
                </div>

                {/* Attendee info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {scan.attendeeName || scan.attendeeEmail || t('ticketStatus.unknownAttendee')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {scan.tierName || t('ticketStatus.unknownTier')}
                  </p>
                </div>

                {/* Status and time */}
                <div className="text-right">
                  <Badge
                    variant="outline"
                    className={cn('text-xs', display.color)}
                  >
                    {display.label}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatTimeAgo(scan.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </FmCommonCardContent>
    </FmCommonCard>
  );
};
