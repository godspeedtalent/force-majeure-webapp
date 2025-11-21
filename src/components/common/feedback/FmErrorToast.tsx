import { AlertCircle, Copy, Check, FileText } from 'lucide-react';
import { logger } from '@/shared/services/logger';
import { useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/shared/utils/utils';
import { FmErrorOverlay } from './FmErrorOverlay';

interface FmErrorToastProps {
  title: string;
  description?: string;
  error?: Error;
  isDeveloper?: boolean;
  context?: string;
  endpoint?: string;
  method?: string;
}

/**
 * FmErrorToast Component
 *
 * Enhanced error toast with developer-friendly features:
 * - Copy button for developers/admins (copies error details + stack trace)
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
 *   isDeveloper: true
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
}: FmErrorToastProps) => {
  const [copied, setCopied] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);

  const handleCopy = async () => {
    const errorDetails = [
      `Title: ${title}`,
      description ? `Description: ${description}` : null,
      error ? `Error: ${error.message}` : null,
      error?.stack ? `\nStack Trace:\n${error.stack}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await navigator.clipboard.writeText(errorDetails);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      logger.error('Failed to copy to clipboard:', { context: err });
    }
  };

  // For non-developers, show generic message
  const displayDescription = isDeveloper
    ? description
    : 'An error occurred. Please try again.';

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
      {isDeveloper && (
        <div className='flex items-center gap-1'>
          <button
            onClick={() => setShowOverlay(true)}
            className='flex-shrink-0 p-1.5 rounded hover:bg-white/10 transition-colors'
            title='View details'
          >
            <FileText className='h-4 w-4 text-muted-foreground' />
          </button>
          <button
            onClick={handleCopy}
            className={cn(
              'flex-shrink-0 p-1.5 rounded hover:bg-white/10 transition-colors',
              copied && 'bg-white/10'
            )}
            title='Copy error details'
          >
            {copied ? (
              <Check className='h-4 w-4 text-fm-gold' />
            ) : (
              <Copy className='h-4 w-4 text-muted-foreground' />
            )}
          </button>
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
  toast.custom(
    () => (
      <div
        className={cn(
          'bg-card border-2 border-fm-crimson rounded-lg shadow-lg p-4 max-w-md',
          'animate-in slide-in-from-top-5 duration-300'
        )}
      >
        <FmErrorToast {...props} />
      </div>
    ),
    {
      duration: props.isDeveloper ? 8000 : 4000, // Longer duration for developers to copy
    }
  );
};
