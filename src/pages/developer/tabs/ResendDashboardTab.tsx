/**
 * ResendDashboardTab
 *
 * Main tab component for the Resend email dashboard.
 * Shows email statistics, domains, and email history.
 */

import { useTranslation } from 'react-i18next';
import { Mail, RefreshCw, Globe, Inbox } from 'lucide-react';
import { Button } from '@/components/common/shadcn/button';
import { formatHeader } from '@/shared';
import {
  useResendEmails,
  useResendDomains,
  useResendStats,
  useRefreshResendData,
  ResendStatsOverview,
  ResendDomainsList,
  ResendEmailList,
} from '@/features/resend-dashboard';

export function ResendDashboardTab() {
  const { t } = useTranslation('common');

  // Data fetching
  const { data: emailsData, isLoading: isLoadingEmails } = useResendEmails(100);
  const { data: domainsData, isLoading: isLoadingDomains } = useResendDomains();
  const { data: stats, isLoading: isLoadingStats } = useResendStats();

  // Refresh handler
  const { refreshAll } = useRefreshResendData();

  const isLoading = isLoadingEmails || isLoadingDomains || isLoadingStats;

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[10px]">
            <Mail className="h-6 w-6 text-fm-gold" />
            <h1 className="text-3xl font-canela">
              {formatHeader(t('resendDashboard.title', 'Email dashboard'))}
            </h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshAll()}
            disabled={isLoading}
            className="border-white/20 hover:border-fm-gold"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {t('buttons.refresh', 'Refresh')}
          </Button>
        </div>
        <p className="text-muted-foreground text-sm mt-2">
          {t(
            'resendDashboard.description',
            'Monitor email delivery status and analytics from Resend'
          )}
        </p>
      </div>

      {/* Stats Overview */}
      <section>
        <ResendStatsOverview stats={stats} isLoading={isLoadingStats} />
      </section>

      {/* Two-column layout for Domains and Emails on larger screens */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* Domains Section */}
        <section className="lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-5 w-5 text-fm-gold" />
            <h2 className="text-lg font-medium">
              {t('resendDashboard.domains.title', 'Configured domains')}
            </h2>
          </div>
          <ResendDomainsList domains={domainsData?.data} isLoading={isLoadingDomains} />
        </section>

        {/* Emails Section */}
        <section className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Inbox className="h-5 w-5 text-fm-gold" />
              <h2 className="text-lg font-medium">
                {t('resendDashboard.emails.title', 'Recent emails')}
              </h2>
            </div>
            {emailsData?.data && (
              <span className="text-sm text-muted-foreground">
                {t('resendDashboard.emails.showing', 'Showing {{count}} emails', {
                  count: emailsData.data.length,
                })}
              </span>
            )}
          </div>
          <ResendEmailList emails={emailsData?.data} isLoading={isLoadingEmails} />
        </section>
      </div>
    </div>
  );
}
