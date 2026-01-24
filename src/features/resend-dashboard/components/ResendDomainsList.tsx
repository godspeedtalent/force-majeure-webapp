/**
 * Resend Domains List Component
 *
 * Displays configured domains and their verification status.
 */

import { useTranslation } from 'react-i18next';
import { Globe, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/shared';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import type { ResendDomain, ResendDomainStatus } from '../types';

interface ResendDomainsListProps {
  domains: ResendDomain[] | undefined;
  isLoading?: boolean;
}

const STATUS_CONFIG: Record<
  ResendDomainStatus,
  { icon: typeof CheckCircle; color: string; bgColor: string; label: string }
> = {
  verified: {
    icon: CheckCircle,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    label: 'Verified',
  },
  pending: {
    icon: Clock,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    label: 'Pending',
  },
  not_started: {
    icon: Clock,
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/20',
    label: 'Not Started',
  },
  failed: {
    icon: XCircle,
    color: 'text-fm-danger',
    bgColor: 'bg-fm-danger/20',
    label: 'Failed',
  },
  temporary_failure: {
    icon: AlertTriangle,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    label: 'Temporary Failure',
  },
};

function DomainRow({ domain }: { domain: ResendDomain }) {
  const statusConfig = STATUS_CONFIG[domain.status];
  const StatusIcon = statusConfig.icon;

  return (
    <div
      className={cn(
        'flex items-center gap-4 p-4',
        'bg-black/40 border border-white/10',
        'transition-all duration-200'
      )}
    >
      {/* Domain icon */}
      <div className="flex-shrink-0 w-10 h-10 rounded flex items-center justify-center bg-white/5">
        <Globe className="h-5 w-5 text-muted-foreground" />
      </div>

      {/* Domain info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{domain.name}</p>
        <p className="text-xs text-muted-foreground">
          Region: {domain.region} | Created:{' '}
          {new Date(domain.created_at).toLocaleDateString()}
        </p>
      </div>

      {/* Status badge */}
      <div
        className={cn(
          'flex items-center gap-1.5 px-2 py-1 rounded-none text-xs',
          statusConfig.bgColor,
          statusConfig.color
        )}
      >
        <StatusIcon className="h-3.5 w-3.5" />
        <span>{statusConfig.label}</span>
      </div>
    </div>
  );
}

export function ResendDomainsList({
  domains,
  isLoading,
}: ResendDomainsListProps) {
  const { t } = useTranslation('common');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <FmCommonLoadingSpinner size="md" />
      </div>
    );
  }

  if (!domains || domains.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Globe className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-muted-foreground">
          {t('resendDashboard.domains.noDomainsFound', 'No domains configured')}
        </p>
        <p className="text-sm text-muted-foreground/60 mt-1">
          {t(
            'resendDashboard.domains.addDomainHint',
            'Add a domain in the Resend dashboard to get started'
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {domains.map(domain => (
        <DomainRow key={domain.id} domain={domain} />
      ))}
    </div>
  );
}
