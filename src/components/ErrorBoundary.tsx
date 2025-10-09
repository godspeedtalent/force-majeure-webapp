import { Button } from '@/components/ui/button';
import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary component that catches React rendering errors
 * and displays a fallback UI instead of crashing the entire app.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // In production, you could send this to an error tracking service:
    // trackError({ error, errorInfo, componentStack: errorInfo.componentStack });
  }

  private handleReset = () => {
    // Reset error state and reload the page
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Render custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className='min-h-screen flex items-center justify-center bg-background p-4'>
          <div className='max-w-md w-full text-center space-y-6'>
            <div className='space-y-2'>
              <h1 className='text-3xl font-bold text-foreground'>
                Something went wrong
              </h1>
              <p className='text-muted-foreground'>
                Sorry, but something unexpected happened. The errorhas been
                logged.
              </p>
            </div>

            {this.state.error && (
              <div className='p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-left'>
                <p className='text-sm font-mono text-destructive break-words'>
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className='flex flex-col sm:flex-row gap-3 justify-center'>
              <Button onClick={this.handleReset} variant='default'>
                Reload Page
              </Button>
              <Button onClick={() => window.history.back()} variant='outline'>
                Go Back
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
