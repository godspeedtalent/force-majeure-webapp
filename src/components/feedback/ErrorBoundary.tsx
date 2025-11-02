import React from 'react';
import { FmErrorDisplay } from '@/components/ui/feedback/FmErrorDisplay';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | undefined;
}

/**
 * ErrorBoundary component that catches React rendering errors
 * and displays a fallback UI instead of crashing the entire app.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: undefined };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Store errorInfo for stacktrace display
    this.setState({ errorInfo });

    // Log error details to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // In production, you could send this to an error tracking service:
    // trackError({ error, errorInfo, componentStack: errorInfo.componentStack });
  }

  private handleReset = () => {
    // Reset error state before reload to prevent infinite loop
    this.setState({ hasError: false, error: null, errorInfo: undefined }, () => {
      window.location.reload();
    });
  };

  private handleGoBack = () => {
    // Reset error state before navigation to prevent infinite loop
    this.setState({ hasError: false, error: null, errorInfo: undefined }, () => {
      window.history.back();
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Render custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI using FmErrorDisplay
      return (
        <FmErrorDisplay
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
          onGoBack={this.handleGoBack}
        />
      );
    }

    return this.props.children;
  }
}
