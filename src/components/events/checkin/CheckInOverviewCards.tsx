import { useTranslation } from 'react-i18next';
import { Users, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { FmCommonStatCard } from '@/components/common/display/FmCommonStatCard';
import type { CheckInStats } from '@/features/events/hooks/useCheckInStats';

interface CheckInOverviewCardsProps {
  stats: CheckInStats;
}

/**
 * CheckInOverviewCards
 *
 * Displays key check-in KPIs in a grid of stat cards:
 * - Expected vs checked in
 * - Check-in percentage
 * - Successful scans
 * - Failed/duplicate scans
 */
export const CheckInOverviewCards = ({ stats }: CheckInOverviewCardsProps) => {
  const { t } = useTranslation('common');

  const { scanStats } = stats;

  // Determine status badge
  const getCheckInStatus = () => {
    if (stats.checkInPercentage >= 90) {
      return { label: t('ticketStatus.nearlyComplete'), variant: 'default' as const };
    }
    if (stats.checkInPercentage >= 50) {
      return { label: t('ticketStatus.inProgress'), variant: 'secondary' as const };
    }
    return null;
  };

  const status = getCheckInStatus();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Expected vs Checked In */}
      <FmCommonStatCard
        icon={Users}
        label={t('ticketStatus.checkedIn')}
        value={`${stats.checkedIn} / ${stats.expectedAttendees}`}
        description={`${stats.checkInPercentage}% ${t('ticketStatus.ofExpected').toLowerCase()}`}
        badge={status ?? undefined}
        size="sm"
      />

      {/* Successful Scans */}
      <FmCommonStatCard
        icon={CheckCircle}
        label={t('ticketStatus.successfulScans')}
        value={scanStats.successfulScans}
        description={t('ticketStatus.uniqueTickets', { count: scanStats.uniqueTicketsScanned })}
        size="sm"
      />

      {/* Failed Scans */}
      <FmCommonStatCard
        icon={XCircle}
        label={t('ticketStatus.failedScans')}
        value={scanStats.invalidScans + scanStats.rejectedScans}
        description={
          scanStats.invalidScans > 0 || scanStats.rejectedScans > 0
            ? t('ticketStatus.invalidOrRejected')
            : t('ticketStatus.noFailures')
        }
        size="sm"
      />

      {/* Duplicate Attempts */}
      <FmCommonStatCard
        icon={AlertTriangle}
        label={t('ticketStatus.duplicateScans')}
        value={scanStats.duplicateScans}
        description={
          scanStats.duplicateScans > 0
            ? t('ticketStatus.alreadyUsedAttempts')
            : t('ticketStatus.noDuplicates')
        }
        size="sm"
      />
    </div>
  );
};
