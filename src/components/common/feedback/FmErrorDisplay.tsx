import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { logger } from '@/shared';
import { debugAccessService } from '@/shared/services/debugAccessService';
import {
  AlertTriangle,
  Copy,
  ChevronDown,
  ChevronUp,
  Check,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/common/shadcn/button';
import { FmInfoCard } from '@/components/common/data/FmInfoCard';
import { TopographicBackground } from '@/components/common/misc/TopographicBackground';
import { FmI18nCommon } from '@/components/common/i18n';

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
  // Keep t() for FmInfoCard title prop which requires a string
  const { t } = useTranslation('common');

  // Check if user has debug access (dev mode OR admin/developer role)
  // Uses debugAccessService which stores role state in memory,
  // allowing access even in error boundary context outside AuthProvider
  const isDeveloper = debugAccessService.hasDebugAccess();

  const handleCopyStackTrace = async () => {
    const stackTrace =
      errorInfo?.componentStack || error.stack || 'No stack trace available';
    try {
      await navigator.clipboard.writeText(`${error.message}\n\n${stackTrace}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      logger.error('Failed to copy stack trace:', { context: err });
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
    <div className='min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden'>
      {/* Topography Background */}
      <TopographicBackground opacity={0.35} />
      <div className='absolute inset-0 bg-gradient-monochrome opacity-10' />

      <div className='max-w-2xl w-full text-center space-y-6 relative z-10'>
        <div className='space-y-2'>
          <FmI18nCommon
            i18nKey='errors.somethingWentWrong'
            as='h1'
            className='text-3xl font-canela text-foreground'
          />
          {isDeveloper ? (
            <FmI18nCommon i18nKey='errors.debugDetails' as='p' className='text-muted-foreground' />
          ) : (
            <FmI18nCommon i18nKey='errors.apologize' as='p' className='text-muted-foreground' />
          )}
        </div>

        {/* Error Message - Different for developers vs users */}
        {isDeveloper ? (
          <FmInfoCard
            icon={AlertTriangle}
            title={t('errors.errorDetails')}
            className='text-left'
          >
            <p className='text-sm font-mono text-destructive break-words'>
              {error.message}
            </p>

            {(errorInfo?.componentStack || error.stack) && (
              <div className='mt-4'>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => setIsStackTraceExpanded(!isStackTraceExpanded)}
                  className='w-full justify-between text-xs'
                >
                  <FmI18nCommon i18nKey='errors.stackTrace' />
                  {isStackTraceExpanded ? (
                    <ChevronUp className='h-4 w-4' />
                  ) : (
                    <ChevronDown className='h-4 w-4' />
                  )}
                </Button>

                {isStackTraceExpanded && (
                  <div className='mt-2 space-y-2'>
                    <div className='p-3 bg-black/40 border border-destructive rounded-md max-h-64 overflow-auto'>
                      <pre className='text-xs font-mono text-destructive whitespace-pre-wrap break-all w-full'>
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
                          <FmI18nCommon i18nKey='errors.copied' />
                        </>
                      ) : (
                        <>
                          <Copy className='h-3 w-3 mr-2' />
                          <FmI18nCommon i18nKey='errors.copyStackTrace' />
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </FmInfoCard>
        ) : (
          <FmInfoCard
            icon={MessageCircle}
            title={t('errors.needHelp')}
            className='text-left'
          >
            <p className='text-sm text-muted-foreground'>
              <FmI18nCommon i18nKey='errors.contactUsMessage' />{' '}
              <a
                href='https://www.instagram.com/force.majeure.events'
                target='_blank'
                rel='noopener noreferrer'
                className='text-fm-gold hover:text-fm-gold/80 transition-colors underline'
              >
                @force.majeure.events
              </a>{' '}
              <FmI18nCommon i18nKey='errors.onInstagram' />
            </p>
          </FmInfoCard>
        )}

        {/* Action Buttons */}
        <div className='flex flex-col sm:flex-row gap-3 justify-center'>
          <Button
            onClick={handleReset}
            variant='default'
            className='bg-fm-gold/20 backdrop-blur-sm border border-fm-gold text-fm-gold hover:bg-fm-gold hover:text-black transition-all duration-200'
          >
            <FmI18nCommon i18nKey='errors.reloadPage' />
          </Button>
          <Button onClick={handleGoBack} variant='outline'>
            <FmI18nCommon i18nKey='errors.goBack' />
          </Button>
        </div>
      </div>
    </div>
  );
};
