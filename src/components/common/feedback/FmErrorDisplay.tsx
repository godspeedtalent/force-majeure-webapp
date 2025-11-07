import { useState } from 'react';
import {
  AlertTriangle,
  Copy,
  ChevronDown,
  ChevronUp,
  Check,
} from 'lucide-react';
import { Button } from '@/components/common/shadcn/button';
import { FmInfoCard } from '@/components/common/data/FmInfoCard';

interface FmErrorDisplayProps {
  error: Error;
  errorInfo?: React.ErrorInfo;
  onReset?: () => void;
  onGoBack?: () => void;
}

/**
 * FmErrorDisplay - A comprehensive error display component
 *
 * Features:
 * - Dual-state display: Developer/Admin vs Member/Unauthenticated
 * - Collapsible stacktrace with copy functionality
 * - Professional error messaging
 * - Actionable buttons (Reload, Go Back)
 *
 * Usage:
 * ```tsx
 * <FmErrorDisplay
 *   error={error}
 *   errorInfo={errorInfo}
 *   onReset={() => window.location.reload()}
 *   onGoBack={() => window.history.back()}
 * />
 * ```
 */
export const FmErrorDisplay = ({
  error,
  errorInfo,
  onReset,
  onGoBack,
}: FmErrorDisplayProps) => {
  const [isStackTraceExpanded, setIsStackTraceExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  // Show developer view in development environment
  const isDeveloper = import.meta.env.DEV;

  const handleCopyStackTrace = async () => {
    const stackTrace =
      errorInfo?.componentStack || error.stack || 'No stack trace available';
    try {
      await navigator.clipboard.writeText(`${error.message}\n\n${stackTrace}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy stack trace:', err);
    }
  };

  const handleReset = () => {
    if (onReset) {
      onReset();
    } else {
      window.location.reload();
    }
  };

  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    } else {
      window.history.back();
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-background p-4'>
      <div className='max-w-2xl w-full text-center space-y-6'>
        <div className='space-y-2'>
          <h1 className='text-3xl font-canela text-foreground'>
            Something went wrong
          </h1>
          {isDeveloper ? (
            <p className='text-muted-foreground'>
              An error occurred in the application. Details are shown below for
              debugging.
            </p>
          ) : (
            <p className='text-muted-foreground'>
              We apologize for the inconvenience. Our team has been notified and
              is working on a fix.
            </p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <FmInfoCard
            icon={AlertTriangle}
            title='Error Details'
            className='text-left'
          >
            <p className='text-sm font-mono text-destructive break-words'>
              {error.message}
            </p>

            {isDeveloper && (errorInfo?.componentStack || error.stack) && (
              <div className='mt-4'>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => setIsStackTraceExpanded(!isStackTraceExpanded)}
                  className='w-full justify-between text-xs'
                >
                  <span>Stack Trace</span>
                  {isStackTraceExpanded ? (
                    <ChevronUp className='h-4 w-4' />
                  ) : (
                    <ChevronDown className='h-4 w-4' />
                  )}
                </Button>

                {isStackTraceExpanded && (
                  <div className='mt-2 space-y-2'>
                    <div className='p-3 bg-black/40 border border-destructive rounded-md max-h-64 overflow-auto'>
                      <pre className='text-xs font-mono text-destructive whitespace-pre-wrap break-words'>
                        {errorInfo?.componentStack || error.stack}
                      </pre>
                    </div>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={handleCopyStackTrace}
                      className='w-full text-xs border-destructive text-destructive hover:bg-destructive/10'
                    >
                      {copied ? (
                        <>
                          <Check className='h-3 w-3 mr-2' />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className='h-3 w-3 mr-2' />
                          Copy Stack Trace
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </FmInfoCard>
        )}

        {/* Action Buttons */}
        <div className='flex flex-col sm:flex-row gap-3 justify-center'>
          <Button
            onClick={handleReset}
            variant='default'
            className='bg-fm-gold hover:bg-fm-gold/90 text-black hover:text-black'
          >
            Reload Page
          </Button>
          <Button onClick={handleGoBack} variant='outline'>
            Go Back
          </Button>
        </div>

        {!isDeveloper && (
          <p className='text-xs text-muted-foreground'>
            If this problem persists, please contact support.
          </p>
        )}
      </div>
    </div>
  );
};
