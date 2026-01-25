/**
 * Resend Email List Component
 *
 * Displays sent emails with status and ability to view details.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow, format } from 'date-fns';
import {
  Mail,
  Send,
  CheckCircle,
  XCircle,
  Eye,
  MousePointer,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/shared';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import type { ResendEmail, ResendEmailStatus } from '../types';

interface ResendEmailListProps {
  emails: ResendEmail[] | undefined;
  isLoading?: boolean;
  onEmailClick?: (email: ResendEmail) => void;
}

const STATUS_CONFIG: Record<
  ResendEmailStatus,
  { icon: typeof Send; color: string; bgColor: string; label: string }
> = {
  sent: {
    icon: Send,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    label: 'Sent',
  },
  delivered: {
    icon: CheckCircle,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    label: 'Delivered',
  },
  delivery_delayed: {
    icon: Clock,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    label: 'Delayed',
  },
  bounced: {
    icon: XCircle,
    color: 'text-fm-danger',
    bgColor: 'bg-fm-danger/20',
    label: 'Bounced',
  },
  complained: {
    icon: AlertTriangle,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    label: 'Complained',
  },
  opened: {
    icon: Eye,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    label: 'Opened',
  },
  clicked: {
    icon: MousePointer,
    color: 'text-fm-gold',
    bgColor: 'bg-fm-gold/20',
    label: 'Clicked',
  },
};

function EmailRow({
  email,
  onClick,
}: {
  email: ResendEmail;
  onClick?: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const statusConfig = STATUS_CONFIG[email.last_event];
  const StatusIcon = statusConfig.icon;

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div className="border-b border-white/10 last:border-b-0">
      <button
        onClick={handleClick}
        className={cn(
          'w-full flex items-start gap-4 p-4 text-left transition-colors',
          'hover:bg-white/5',
          isExpanded && 'bg-white/5'
        )}
      >
        {/* Expand icon */}
        <div className="flex-shrink-0 w-8 h-8 rounded flex items-center justify-center bg-black/40 border border-white/10">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        {/* Email info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">
                {email.subject || '(No subject)'}
              </p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                To: {email.to.join(', ')}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(email.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>

          {/* Status and metadata */}
          <div className="flex items-center gap-2 mt-2">
            <span
              className={cn(
                'flex items-center gap-1 text-xs px-2 py-0.5 rounded-none',
                statusConfig.bgColor,
                statusConfig.color
              )}
            >
              <StatusIcon className="h-3 w-3" />
              {statusConfig.label}
            </span>
            <span className="text-xs text-muted-foreground">
              {format(new Date(email.created_at), 'MMM d, h:mm a')}
            </span>
          </div>
        </div>
      </button>

      {/* Expanded details */}
      {isExpanded && (
        <div className="px-4 pb-4 ml-12 border-t border-white/5 pt-3 space-y-2">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground">From:</span>
              <p className="text-white mt-0.5">{email.from}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Email ID:</span>
              <p className="text-white mt-0.5 font-mono text-[10px]">{email.id}</p>
            </div>
            {email.cc && email.cc.length > 0 && (
              <div>
                <span className="text-muted-foreground">CC:</span>
                <p className="text-white mt-0.5">{email.cc.join(', ')}</p>
              </div>
            )}
            {email.bcc && email.bcc.length > 0 && (
              <div>
                <span className="text-muted-foreground">BCC:</span>
                <p className="text-white mt-0.5">{email.bcc.join(', ')}</p>
              </div>
            )}
            {email.reply_to && email.reply_to.length > 0 && (
              <div>
                <span className="text-muted-foreground">Reply-To:</span>
                <p className="text-white mt-0.5">{email.reply_to.join(', ')}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function ResendEmailList({
  emails,
  isLoading,
  onEmailClick,
}: ResendEmailListProps) {
  const { t } = useTranslation('common');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <FmCommonLoadingSpinner size="lg" />
      </div>
    );
  }

  if (!emails || emails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Mail className="h-12 w-12 text-muted-foreground/40 mb-4" />
        <p className="text-muted-foreground">
          {t('resendDashboard.emails.noEmailsFound', 'No emails found')}
        </p>
        <p className="text-sm text-muted-foreground/60 mt-1">
          {t(
            'resendDashboard.emails.sendFirstEmail',
            'Send your first email to see it here'
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-white/10 bg-black/40 border border-white/10">
      {/* Header */}
      <div className="flex items-center gap-4 p-3 bg-black/20 border-b border-white/10 text-xs text-muted-foreground uppercase tracking-wide">
        <div className="w-8" /> {/* Expand icon space */}
        <div className="flex-1">Email</div>
        <div className="w-24 text-right">Sent</div>
      </div>

      {/* Email rows */}
      {emails.map(email => (
        <EmailRow
          key={email.id}
          email={email}
          onClick={onEmailClick ? () => onEmailClick(email) : undefined}
        />
      ))}
    </div>
  );
}
