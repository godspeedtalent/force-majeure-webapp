/**
 * Site Health Export Button
 *
 * Button component for exporting site health reports optimized for AI analysis.
 * Generates a markdown report and copies it to the clipboard.
 */

import { useTranslation } from 'react-i18next';
import { FileText, Check } from 'lucide-react';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { useSiteHealthExport } from '@/features/analytics/hooks/useSiteHealthExport';
import { cn } from '@/shared';

interface SiteHealthExportButtonProps {
  /** Date range for the report */
  dateRange: { start: Date; end: Date };
  /** Additional CSS classes */
  className?: string;
}

/**
 * Button to export site health report for AI analysis
 */
export function SiteHealthExportButton({
  dateRange,
  className,
}: SiteHealthExportButtonProps) {
  const { t } = useTranslation('common');
  const { exportAndCopy, isPending, copied } = useSiteHealthExport();

  const handleClick = () => {
    exportAndCopy(dateRange);
  };

  return (
    <FmCommonButton
      variant="default"
      size="default"
      onClick={handleClick}
      loading={isPending}
      icon={copied ? Check : FileText}
      className={cn(
        copied && 'border-fm-gold text-fm-gold',
        className
      )}
      disabled={isPending}
    >
      {isPending
        ? t('analytics.exportHealth.loading', 'Generating...')
        : copied
          ? t('analytics.exportHealth.copied', 'Copied!')
          : t('analytics.exportHealth.button', 'Export health report')}
    </FmCommonButton>
  );
}
