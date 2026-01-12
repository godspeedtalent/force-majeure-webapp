/**
 * Contact Submissions Tab Component
 *
 * Dedicated view for managing contact form submissions.
 * Shows a simple list with status management and message details.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow, format } from 'date-fns';
import {
  Mail,
  ChevronDown,
  ChevronUp,
  Archive,
  Reply,
  Trash2,
  Search,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/shared';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonIconButton } from '@/components/common/buttons/FmCommonIconButton';
import { Input } from '@/components/common/shadcn/input';
import { Textarea } from '@/components/common/shadcn/textarea';
import {
  useContactSubmissions,
  useUpdateSubmissionStatus,
  useUpdateSubmissionNotes,
  useDeleteContactSubmission,
} from '../hooks/useContactSubmissions';
import {
  ContactSubmission,
  ContactSubmissionFilters,
  ContactSubmissionStatus,
  STATUS_CONFIG,
  ALL_STATUSES,
} from '../types';

/**
 * Status badge component
 */
function StatusBadge({ status }: { status: ContactSubmissionStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        'text-xs px-2 py-0.5 uppercase tracking-wider font-medium',
        config.bgColor,
        config.color
      )}
    >
      {config.label}
    </span>
  );
}

/**
 * Individual submission item
 */
function SubmissionItem({
  submission,
  isExpanded,
  onToggle,
}: {
  submission: ContactSubmission;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation('common');
  const [notes, setNotes] = useState(submission.notes || '');
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  const updateStatus = useUpdateSubmissionStatus();
  const updateNotes = useUpdateSubmissionNotes();
  const deleteSubmission = useDeleteContactSubmission();

  const handleStatusChange = (newStatus: ContactSubmissionStatus) => {
    updateStatus.mutate({ id: submission.id, status: newStatus });
  };

  const handleSaveNotes = () => {
    updateNotes.mutate({ id: submission.id, notes });
    setIsEditingNotes(false);
  };

  const handleDelete = () => {
    if (window.confirm(t('contactSubmissions.confirmDelete'))) {
      deleteSubmission.mutate(submission.id);
    }
  };

  // Mark as read when expanded if unread
  const handleToggle = () => {
    if (!isExpanded && submission.status === 'unread') {
      updateStatus.mutate({ id: submission.id, status: 'read' });
    }
    onToggle();
  };

  return (
    <div
      className={cn(
        'border-b border-white/10 last:border-b-0',
        submission.status === 'unread' && 'bg-fm-gold/5'
      )}
    >
      {/* Header row */}
      <button
        onClick={handleToggle}
        className={cn(
          'w-full flex items-start gap-4 p-4 text-left transition-colors',
          'hover:bg-white/5',
          isExpanded && 'bg-white/5'
        )}
      >
        {/* Icon */}
        <div
          className={cn(
            'flex-shrink-0 w-10 h-10 flex items-center justify-center',
            'bg-black/40 border border-white/10'
          )}
        >
          <Mail
            className={cn(
              'h-5 w-5',
              submission.status === 'unread' ? 'text-fm-gold' : 'text-muted-foreground'
            )}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {/* Name and email */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-white">
                  {submission.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  &lt;{submission.email}&gt;
                </span>
              </div>
              {/* Subject */}
              {submission.subject && (
                <p className="text-sm text-white/80 mt-1 truncate">
                  {submission.subject}
                </p>
              )}
              {/* Message preview */}
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                {submission.message}
              </p>
            </div>

            {/* Right side: status and timestamp */}
            <div className="flex-shrink-0 text-right">
              <StatusBadge status={submission.status} />
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(submission.created_at), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Expand icon */}
        <div className="flex-shrink-0">
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div
          className={cn(
            'px-4 pb-4 ml-14',
            'animate-in fade-in-0 slide-in-from-top-2 duration-200'
          )}
        >
          {/* Full message */}
          <div className="bg-black/30 border border-white/10 p-4 mb-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <MessageSquare className="h-3 w-3" />
              <span className="uppercase tracking-wider font-medium">
                {t('contactSubmissions.message')}
              </span>
            </div>
            <p className="text-sm text-white/90 whitespace-pre-wrap">
              {submission.message}
            </p>
          </div>

          {/* Meta info */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
            <span>
              {t('contactSubmissions.received')}:{' '}
              {format(new Date(submission.created_at), 'PPP p')}
            </span>
            {submission.replied_at && (
              <span>
                {t('contactSubmissions.repliedOn')}:{' '}
                {format(new Date(submission.replied_at), 'PPP p')}
              </span>
            )}
          </div>

          {/* Notes section */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs uppercase text-muted-foreground font-medium">
                {t('contactSubmissions.notes')}
              </label>
              {!isEditingNotes && submission.notes && (
                <button
                  onClick={() => setIsEditingNotes(true)}
                  className="text-xs text-fm-gold hover:underline"
                >
                  {t('contactSubmissions.edit')}
                </button>
              )}
            </div>
            {isEditingNotes || !submission.notes ? (
              <div className="space-y-2">
                <Textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder={t('contactSubmissions.notesPlaceholder')}
                  className="bg-black/40 border-white/20 min-h-[80px]"
                />
                <div className="flex gap-2">
                  <FmCommonButton
                    size="sm"
                    onClick={handleSaveNotes}
                    loading={updateNotes.isPending}
                  >
                    {t('contactSubmissions.saveNotes')}
                  </FmCommonButton>
                  {isEditingNotes && (
                    <FmCommonButton
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setNotes(submission.notes || '');
                        setIsEditingNotes(false);
                      }}
                    >
                      {t('common.cancel')}
                    </FmCommonButton>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-white/70 bg-black/20 p-2 border border-white/5">
                {submission.notes}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {submission.status !== 'read' && submission.status !== 'unread' ? null : (
              <FmCommonButton
                size="sm"
                variant="default"
                icon={Reply}
                onClick={() => handleStatusChange('replied')}
                loading={updateStatus.isPending}
              >
                {t('contactSubmissions.markReplied')}
              </FmCommonButton>
            )}
            {submission.status !== 'archived' && (
              <FmCommonButton
                size="sm"
                variant="secondary"
                icon={Archive}
                onClick={() => handleStatusChange('archived')}
                loading={updateStatus.isPending}
              >
                {t('contactSubmissions.archive')}
              </FmCommonButton>
            )}
            {submission.status === 'archived' && (
              <FmCommonButton
                size="sm"
                variant="secondary"
                icon={Mail}
                onClick={() => handleStatusChange('read')}
                loading={updateStatus.isPending}
              >
                {t('contactSubmissions.unarchive')}
              </FmCommonButton>
            )}
            <FmCommonIconButton
              icon={Trash2}
              variant="destructive"
              size="sm"
              tooltip={t('contactSubmissions.delete')}
              onClick={handleDelete}
              loading={deleteSubmission.isPending}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Main ContactSubmissionsTab component
 */
export function ContactSubmissionsTab() {
  const { t } = useTranslation('common');
  const [filters, setFilters] = useState<ContactSubmissionFilters>({});
  const [searchValue, setSearchValue] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: submissions, isLoading } = useContactSubmissions(filters);

  const handleSearch = () => {
    setFilters(prev => ({
      ...prev,
      search: searchValue || undefined,
    }));
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleStatusFilter = (status: ContactSubmissionStatus | 'all') => {
    setFilters(prev => ({
      ...prev,
      status: status === 'all' ? undefined : [status],
    }));
  };

  const activeStatus = filters.status?.[0] || 'all';
  const unreadCount = submissions?.filter(s => s.status === 'unread').length || 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md -mx-4 px-4 py-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-canela text-white">
              {t('contactSubmissions.title')}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t('contactSubmissions.description')}
            </p>
          </div>
          {unreadCount > 0 && (
            <div className="flex items-center gap-2 bg-fm-gold/20 px-3 py-1.5 border border-fm-gold/30">
              <Mail className="h-4 w-4 text-fm-gold" />
              <span className="text-sm text-fm-gold font-medium">
                {t('contactSubmissions.unreadCount', { count: unreadCount })}
              </span>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex gap-2 items-center flex-1 max-w-[300px]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchValue}
                onChange={e => setSearchValue(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder={t('contactSubmissions.searchPlaceholder')}
                className="pl-9 bg-black/40 border-white/20 focus:border-fm-gold h-10"
              />
            </div>
            <FmCommonIconButton
              icon={Search}
              onClick={handleSearch}
              tooltip={t('common.search')}
            />
          </div>

          {/* Status filter tabs */}
          <div className="flex gap-1">
            <button
              onClick={() => handleStatusFilter('all')}
              className={cn(
                'px-3 py-1.5 text-xs uppercase tracking-wider transition-colors',
                activeStatus === 'all'
                  ? 'bg-white/10 text-white border-b-2 border-fm-gold'
                  : 'text-muted-foreground hover:bg-white/5'
              )}
            >
              {t('contactSubmissions.all')}
            </button>
            {ALL_STATUSES.map(status => {
              const config = STATUS_CONFIG[status];
              const count = submissions?.filter(s => s.status === status).length || 0;
              return (
                <button
                  key={status}
                  onClick={() => handleStatusFilter(status)}
                  className={cn(
                    'px-3 py-1.5 text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5',
                    activeStatus === status
                      ? 'bg-white/10 text-white border-b-2 border-fm-gold'
                      : 'text-muted-foreground hover:bg-white/5'
                  )}
                >
                  <span className={config.color}>{config.label}</span>
                  {count > 0 && (
                    <span className="text-[10px] bg-white/10 px-1.5 py-0.5">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <FmCommonLoadingSpinner size="lg" />
        </div>
      ) : !submissions || submissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Mail className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">
            {t('contactSubmissions.noSubmissions')}
          </p>
        </div>
      ) : (
        <div className="bg-black/40 border border-white/10">
          {submissions.map(submission => (
            <SubmissionItem
              key={submission.id}
              submission={submission}
              isExpanded={expandedId === submission.id}
              onToggle={() =>
                setExpandedId(expandedId === submission.id ? null : submission.id)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
