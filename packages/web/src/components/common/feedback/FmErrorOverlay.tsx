import { useState } from 'react';
import { X, Copy, Check, AlertTriangle } from 'lucide-react';
import { logger } from '@force-majeure/shared/services/logger';
import { Button } from '@/components/common/shadcn/button';
import { cn } from '@force-majeure/shared/utils/utils';

interface FmErrorOverlayProps {
  error: Error;
  title: string;
  description?: string;
  context?: string;
  endpoint?: string;
  method?: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * FmErrorOverlay - Modal overlay for displaying detailed error information
 *
 * Features:
 * - Full-screen modal overlay
 * - Stack trace display (always expanded)
 * - Copy to clipboard functionality
 * - Error context and endpoint information
 *
 * Usage:
 * ```tsx
 * <FmErrorOverlay
 *   error={error}
 *   title="Sign in failed"
 *   description="Unable to sign in to your account"
 *   context="User authentication"
 *   endpoint="/auth/signin"
 *   method="POST"
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 * />
 * ```
 */
export const FmErrorOverlay = ({
  error,
  title,
  description,
  context,
  endpoint,
  method,
  isOpen,
  onClose,
}: FmErrorOverlayProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopyStackTrace = async () => {
    const details = [
      `Title: ${title}`,
      description && `Description: ${description}`,
      `Error: ${error.message}`,
      context && `Context: ${context}`,
      endpoint && `Endpoint: ${endpoint}`,
      method && `Method: ${method}`,
      '',
      'Stack Trace:',
      error.stack || 'No stack trace available',
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await navigator.clipboard.writeText(details);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      logger.error('Failed to copy error details:', { context: err });
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-[200] flex items-center justify-center',
        'bg-black/90 backdrop-blur-md',
        'animate-in fade-in duration-200'
      )}
      onClick={onClose}
    >
      <div
        className={cn(
          'relative w-full max-w-4xl max-h-[90vh]',
          'bg-black/95 backdrop-blur-xl',
          'border-2 border-fm-danger',
          'shadow-2xl shadow-fm-danger/20',
          'flex flex-col',
          'animate-in zoom-in-95 duration-200'
        )}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className='flex items-start justify-between p-6 border-b border-fm-danger/30'>
          <div className='flex items-start gap-4 flex-1'>
            <AlertTriangle className='h-6 w-6 text-fm-danger flex-shrink-0 mt-1' />
            <div className='flex-1 space-y-1'>
              <h2 className='text-2xl font-canela text-fm-danger'>{title}</h2>
              {description && (
                <p className='text-sm text-muted-foreground'>{description}</p>
              )}
            </div>
          </div>
          <Button
            variant='ghost'
            size='icon'
            onClick={onClose}
            className='h-8 w-8 text-white/50 hover:text-white hover:bg-white/10 flex-shrink-0'
          >
            <X className='h-4 w-4' />
          </Button>
        </div>

        {/* Content */}
        <div className='flex-1 overflow-y-auto p-6 space-y-6'>
          {/* Error Message */}
          <div className='space-y-2'>
            <h3 className='text-sm font-semibold text-fm-gold uppercase tracking-wide'>
              Error Message
            </h3>
            <div className='p-4 bg-fm-danger/10 border border-fm-danger/30 rounded-none'>
              <p className='text-sm font-mono text-fm-danger break-words'>
                {error.message}
              </p>
            </div>
          </div>

          {/* Context Information */}
          {(context || endpoint || method) && (
            <div className='space-y-2'>
              <h3 className='text-sm font-semibold text-fm-gold uppercase tracking-wide'>
                Context
              </h3>
              <div className='space-y-2'>
                {context && (
                  <div className='flex gap-2'>
                    <span className='text-sm text-muted-foreground w-24'>
                      Context:
                    </span>
                    <span className='text-sm text-foreground'>{context}</span>
                  </div>
                )}
                {endpoint && (
                  <div className='flex gap-2'>
                    <span className='text-sm text-muted-foreground w-24'>
                      Endpoint:
                    </span>
                    <span className='text-sm text-foreground font-mono'>
                      {endpoint}
                    </span>
                  </div>
                )}
                {method && (
                  <div className='flex gap-2'>
                    <span className='text-sm text-muted-foreground w-24'>
                      Method:
                    </span>
                    <span className='text-sm text-foreground font-mono'>
                      {method}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stack Trace (always expanded) */}
          {error.stack && (
            <div className='space-y-2'>
              <h3 className='text-sm font-semibold text-fm-gold uppercase tracking-wide'>
                Stack Trace
              </h3>
              <div className='p-4 bg-black/60 border border-white/20 rounded-none overflow-auto max-h-96'>
                <pre className='text-xs font-mono text-fm-danger whitespace-pre-wrap break-words'>
                  {error.stack}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='p-6 border-t border-white/10 flex justify-end gap-3'>
          <Button
            variant='outline'
            onClick={handleCopyStackTrace}
            className='border-fm-gold text-fm-gold hover:bg-fm-gold/10'
          >
            {copied ? (
              <>
                <Check className='h-4 w-4 mr-2' />
                Copied!
              </>
            ) : (
              <>
                <Copy className='h-4 w-4 mr-2' />
                Copy Details
              </>
            )}
          </Button>
          <Button
            variant='default'
            onClick={onClose}
            className='bg-fm-gold hover:bg-fm-gold/90 text-black'
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
