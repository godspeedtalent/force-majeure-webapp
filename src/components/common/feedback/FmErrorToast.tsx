import { AlertCircle, Copy, Check, FileText, FileEdit } from 'lucide-react';
import { logger } from '@/shared';
import { useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/shared';
import { FmErrorOverlay } from './FmErrorOverlay';
import { useTranslation } from 'react-i18next';
import { extractErrorContext, formatErrorContextForNote, generateErrorNoteTitle } from '@/shared/utils/errorContext';
import { supabase, handleError, ROLES } from '@/shared';
import { useAuth } from '@/features/auth/services/AuthContext';
import { useUserPermissions } from '@/shared/hooks/useUserRole';

interface FmErrorToastProps {
  title: string;
  description?: string;
  error?: Error;
  isDeveloper?: boolean;
  context?: string;
  endpoint?: string;
  method?: string;
  /** User role for determining which actions to show */
  userRole?: string;
}

/**
 * FmErrorToast Component
 *
 * Enhanced error toast with role-based features:
 * - Copy Stack Trace button for ADMIN/DEVELOPER roles
 * - Create Staff Note button for FM_STAFF role
 * - View Details overlay for ADMIN/DEVELOPER roles
 * - Generic message for regular users
 * - Dark crimson styling (border, text, icon)
 *
 * Usage:
 * ```tsx
 * import { showErrorToast } from '@/components/common/feedback/FmErrorToast';
 *
 * showErrorToast({
 *   title: 'Upload Failed',
 *   description: 'Image failed to upload',
 *   error: myError,
 *   isDeveloper: true,
 *   userRole: 'admin'
 * });
 * ```
 */
export const FmErrorToast = ({
  title,
  description,
  error,
  isDeveloper = false,
  context,
  endpoint,
  method,
  userRole,
}: FmErrorToastProps) => {
  const { t } = useTranslation('common');
  const { user, profile } = useAuth();
  const { isAdmin: checkIsAdmin, hasRole } = useUserPermissions();
  const [copied, setCopied] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [isCreatingNote, setIsCreatingNote] = useState(false);

  // Determine which actions to show based on role
  // Use prop if provided, otherwise check actual user roles
  const isAdmin = userRole === 'admin' || (!userRole && checkIsAdmin());
  const isDev = userRole === 'developer' || isAdmin || (!userRole && hasRole(ROLES.DEVELOPER));
  const isFmStaff = userRole === 'fm_staff' || isDev || (!userRole && hasRole(ROLES.FM_STAFF));

  const handleCopyStackTrace = async () => {
    const errorDetails = [
      `Title: ${title}`,
      description ? `Description: ${description}` : null,
      error ? `Error: ${error.message}` : null,
      error?.stack ? `\nStack Trace:\n${error.stack}` : null,
      context ? `\nContext: ${context}` : null,
      endpoint ? `Endpoint: ${endpoint}` : null,
      method ? `Method: ${method}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await navigator.clipboard.writeText(errorDetails);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success(t('errors.copiedToClipboard'));
    } catch (err) {
      logger.error('Failed to copy to clipboard', { error: err });
      toast.error(t('errors.copyFailed'));
    }
  };

  const handleCreateStaffNote = async () => {
    if (!user) {
      toast.error(t('devTools.notes.mustBeLoggedIn'));
      return;
    }

    setIsCreatingNote(true);

    try {
      // Extract comprehensive error context
      const errorContext = extractErrorContext(error, {
        context,
        endpoint,
        method,
        additionalInfo: {
          toastTitle: title,
          toastDescription: description,
        },
      });

      // Generate note title and formatted content
      const noteTitle = generateErrorNoteTitle(errorContext);
      const noteMessage = formatErrorContextForNote(errorContext);

      // Create the staff note
      const authorName = profile?.display_name || user.email || 'Unknown';
      const { error: insertError } = await supabase.from('dev_notes').insert({
        author_id: user.id,
        author_name: authorName,
        title: noteTitle,
        message: noteMessage,
        type: 'BUG',
        status: 'TODO',
        priority: 3, // Default to medium priority
      });

      if (insertError) throw insertError;

      toast.success(t('devTools.notes.createSuccess'));
    } catch (err: unknown) {
      handleError(err, {
        title: t('devTools.notes.createError'),
        context: 'FmErrorToast.handleCreateStaffNote',
        endpoint: 'dev_notes.insert',
      });
    } finally {
      setIsCreatingNote(false);
    }
  };

  // For non-developers, show generic message
  const displayDescription = isDeveloper
    ? description
    : t('errors.genericError');

  return (
    <div className='flex items-start gap-3'>
      <AlertCircle className='h-5 w-5 text-fm-crimson flex-shrink-0 mt-0.5' />
      <div className='flex-1 min-w-0 max-w-[400px]'>
        <div className='font-semibold text-fm-crimson'>{title}</div>
        {displayDescription && (
          <div className='text-sm text-muted-foreground mt-1 whitespace-pre-wrap break-words'>
            {displayDescription}
          </div>
        )}
        {isDeveloper && error && (
          <div className='text-xs text-muted-foreground/70 mt-1 font-mono break-words'>
            {error.message}
          </div>
        )}
      </div>
      {(isDev || isFmStaff) && (
        <div className='flex items-center gap-1'>
          {/* View Details - Admin/Developer only */}
          {isDev && (
            <button
              onClick={() => setShowOverlay(true)}
              className='flex-shrink-0 p-1.5 rounded-none hover:bg-white/10 transition-colors'
              title={t('errors.viewDetails')}
            >
              <FileText className='h-4 w-4 text-muted-foreground' />
            </button>
          )}

          {/* Copy Stack Trace - Admin/Developer only */}
          {isDev && (
            <button
              onClick={handleCopyStackTrace}
              className={cn(
                'flex-shrink-0 p-1.5 rounded-none hover:bg-white/10 transition-colors',
                copied && 'bg-white/10'
              )}
              title={t('errors.copyStackTrace')}
              disabled={isCreatingNote}
            >
              {copied ? (
                <Check className='h-4 w-4 text-fm-gold' />
              ) : (
                <Copy className='h-4 w-4 text-muted-foreground' />
              )}
            </button>
          )}

          {/* Create Staff Note - FM Staff, Developer, Admin */}
          {isFmStaff && (
            <button
              onClick={handleCreateStaffNote}
              className={cn(
                'flex-shrink-0 p-1.5 rounded-none hover:bg-white/10 transition-colors',
                isCreatingNote && 'opacity-50 cursor-not-allowed'
              )}
              title={t('errors.createStaffNote')}
              disabled={isCreatingNote || copied}
            >
              <FileEdit className='h-4 w-4 text-muted-foreground' />
            </button>
          )}
        </div>
      )}
      {error && (
        <FmErrorOverlay
          error={error}
          title={title}
          description={description}
          context={context}
          endpoint={endpoint}
          method={method}
          isOpen={showOverlay}
          onClose={() => setShowOverlay(false)}
        />
      )}
    </div>
  );
};

/**
 * Helper function to show error toast
 */
export const showErrorToast = (props: FmErrorToastProps) => {
  // Determine duration based on role - give staff/devs more time for actions
  const hasActions = props.userRole === 'admin' || props.userRole === 'developer' || props.userRole === 'fm_staff';
  const duration = hasActions ? 10000 : 4000; // 10 seconds for staff/devs, 4 seconds for users

  toast.custom(
    () => (
      <div
        className={cn(
          'bg-card border-2 border-fm-crimson rounded-none shadow-lg p-4 max-w-md',
          'animate-in slide-in-from-top-5 duration-300'
        )}
      >
        <FmErrorToast {...props} />
      </div>
    ),
    {
      duration,
    }
  );
};
