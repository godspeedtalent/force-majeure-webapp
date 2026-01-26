/**
 * Site Health Export Hook
 *
 * Provides functionality to generate and export site health reports
 * optimized for AI analysis.
 */

import { useState, useMemo, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { SiteHealthService } from '../services/SiteHealthService';
import { formatSiteHealthReport } from '../utils/siteHealthFormatter';
import { logger } from '@/shared';

const exportLogger = logger.createNamespace('useSiteHealthExport');

interface UseSiteHealthExportOptions {
  /** Callback when export is successful */
  onSuccess?: (report: string) => void;
  /** Callback when export fails */
  onError?: (error: Error) => void;
}

interface UseSiteHealthExportResult {
  /** Export the health report and copy to clipboard */
  exportAndCopy: (dateRange: { start: Date; end: Date }) => Promise<void>;
  /** Whether the export is in progress */
  isPending: boolean;
  /** Whether the report was recently copied */
  copied: boolean;
  /** The last generated report (markdown format) */
  report: string | null;
  /** Export the health report without copying */
  exportReport: (dateRange: { start: Date; end: Date }) => Promise<string | null>;
}

export function useSiteHealthExport(options: UseSiteHealthExportOptions = {}): UseSiteHealthExportResult {
  const { t } = useTranslation('common');
  const [copied, setCopied] = useState(false);
  const [report, setReport] = useState<string | null>(null);

  const service = useMemo(() => new SiteHealthService(), []);

  const mutation = useMutation({
    mutationFn: async (dateRange: { start: Date; end: Date }) => {
      exportLogger.info('Generating site health report', {
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString(),
      });

      const healthReport = await service.generateHealthReport(dateRange);
      const formattedReport = formatSiteHealthReport(healthReport);

      return formattedReport;
    },
    onSuccess: (formattedReport) => {
      setReport(formattedReport);
      options.onSuccess?.(formattedReport);
    },
    onError: (error: Error) => {
      exportLogger.error('Failed to generate health report', { error: error.message });
      options.onError?.(error);
    },
  });

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
      return true;
    } catch (err) {
      exportLogger.error('Failed to copy to clipboard', {
        error: err instanceof Error ? err.message : 'Unknown error',
      });
      return false;
    }
  }, []);

  const exportAndCopy = useCallback(
    async (dateRange: { start: Date; end: Date }) => {
      try {
        const formattedReport = await mutation.mutateAsync(dateRange);

        const copySuccess = await copyToClipboard(formattedReport);

        if (copySuccess) {
          toast.success(t('analytics.exportHealth.success', 'Health report copied to clipboard'));
        } else {
          // Fallback: show the report in a toast with instructions
          toast.info(t('analytics.exportHealth.copyFailed', 'Could not copy automatically. Report generated successfully.'));
        }
      } catch (error) {
        toast.error(t('analytics.exportHealth.error', 'Failed to generate report'));
      }
    },
    [mutation, copyToClipboard, t]
  );

  const exportReport = useCallback(
    async (dateRange: { start: Date; end: Date }): Promise<string | null> => {
      try {
        const formattedReport = await mutation.mutateAsync(dateRange);
        return formattedReport;
      } catch {
        return null;
      }
    },
    [mutation]
  );

  return {
    exportAndCopy,
    isPending: mutation.isPending,
    copied,
    report,
    exportReport,
  };
}
