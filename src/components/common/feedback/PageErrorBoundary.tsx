/**
 * PageErrorBoundary
 *
 * A lighter-weight error boundary for wrapping page sections.
 * Unlike the root ErrorBoundary, this provides an inline fallback
 * that doesn't replace the entire app.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { logger } from '@/shared';
import { Button } from '@/components/common/shadcn/button';

interface Props {
  children: React.ReactNode;
  /** Optional section name for error logging */
  section?: string;
  /** Custom fallback UI */
  fallback?: React.ReactNode;
  /** Callback when error occurs */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Functional wrapper component to access hooks
 */
function PageErrorFallback({
  error,
  onRetry,
  section,
}: {
  error: Error;
  onRetry: () => void;
  section?: string;
}) {
  const { t } = useTranslation('common');

  return (
    <div className='flex flex-col items-center justify-center p-8 text-center bg-black/40 backdrop-blur-sm border border-white/10'>
      <AlertTriangle className='h-12 w-12 text-fm-danger mb-4' />
      <h3 className='font-canela text-xl text-white mb-2'>
        {t('errors.sectionError', { defaultValue: 'Something went wrong' })}
      </h3>
      <p className='text-muted-foreground text-sm mb-4 max-w-md'>
        {section
          ? t('errors.sectionErrorDescription', {
              section,
              defaultValue: `There was a problem loading the ${section} section.`,
            })
          : t('errors.genericSectionError', {
              defaultValue: 'There was a problem loading this section.',
            })}
      </p>
      {process.env.NODE_ENV === 'development' && (
        <p className='text-xs text-fm-danger/80 font-mono mb-4 max-w-md truncate'>
          {error.message}
        </p>
      )}
      <Button
        variant='outline'
        size='sm'
        onClick={onRetry}
        className='gap-2'
      >
        <RefreshCw className='h-4 w-4' />
        {t('buttons.tryAgain', { defaultValue: 'Try Again' })}
      </Button>
    </div>
  );
}

export class PageErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('PageErrorBoundary caught an error', {
      error: error.message,
      section: this.props.section,
      componentStack: errorInfo.componentStack,
      source: 'PageErrorBoundary',
    });

    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <PageErrorFallback
          error={this.state.error}
          onRetry={this.handleRetry}
          section={this.props.section}
        />
      );
    }

    return this.props.children;
  }
}
