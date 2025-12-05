import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/common/shadcn/button';
import { Layout } from '@/components/layout/Layout';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';

/**
 * DetailPageWrapper
 *
 * Standardizes loading, error, and not-found states across detail pages.
 * Eliminates 40-50 lines of boilerplate per detail page.
 *
 * @example
 * ```tsx
 * <DetailPageWrapper
 *   data={venue}
 *   isLoading={isLoading}
 *   error={error}
 *   entityName="Venue"
 *   onBack={() => navigate(-1)}
 * >
 *   {(venue) => (
 *     <div className='container mx-auto py-8'>
 *       <h1>{venue.name}</h1>
 *     </div>
 *   )}
 * </DetailPageWrapper>
 * ```
 */

export interface DetailPageWrapperProps<T> {
  /** The data to display, null/undefined triggers not-found state */
  data: T | null | undefined;
  /** Loading state from query */
  isLoading: boolean;
  /** Error from query (optional - triggers error state if present) */
  error?: Error | null;
  /** Entity name for messages (e.g., "Venue", "Artist", "Event") */
  entityName: string;
  /** Callback for back navigation */
  onBack?: () => void;
  /** Custom back button label (defaults to "Go Back") */
  backButtonLabel?: string;
  /** Custom not found message (defaults to "{entityName} not found.") */
  notFoundMessage?: string;
  /** Custom error message (defaults to "Failed to load {entityName}") */
  errorMessage?: string;
  /** Whether to show the not found button (defaults to true) */
  showNotFoundButton?: boolean;
  /** Custom not found button label (defaults to "Go Home") */
  notFoundButtonLabel?: string;
  /** Custom not found button action (defaults to navigate home) */
  onNotFoundAction?: () => void;
  /** Render function that receives the non-null data */
  children: (data: T) => ReactNode;
  /** Use Layout wrapper (defaults to true) */
  useLayout?: boolean;
  /** Pass-through Layout props */
  layoutProps?: {
    showBackButton?: boolean;
    onBack?: () => void;
    backButtonLabel?: string;
  };
}

export function DetailPageWrapper<T>({
  data,
  isLoading,
  error,
  entityName,
  onBack,
  backButtonLabel = 'Go Back',
  notFoundMessage,
  errorMessage,
  showNotFoundButton = true,
  notFoundButtonLabel = 'Go Home',
  onNotFoundAction,
  children,
  useLayout = true,
  layoutProps,
}: DetailPageWrapperProps<T>) {
  const navigate = useNavigate();

  const handleBack = onBack || (() => navigate(-1));
  const handleNotFound = onNotFoundAction || (() => navigate('/'));

  // Loading State
  if (isLoading) {
    const loadingContent = (
      <div className='flex items-center justify-center min-h-[400px]'>
        <FmCommonLoadingSpinner size='lg' />
      </div>
    );

    return useLayout ? <Layout {...layoutProps}>{loadingContent}</Layout> : loadingContent;
  }

  // Error State
  if (error) {
    const errorContent = (
      <div className='text-center py-12'>
        <p className='text-muted-foreground mb-4'>
          {errorMessage || `Failed to load ${entityName.toLowerCase()}`}
        </p>
        <Button onClick={handleBack} variant='outline' className='border-white/20 hover:bg-white/10'>
          {backButtonLabel}
        </Button>
      </div>
    );

    return useLayout ? <Layout {...layoutProps}>{errorContent}</Layout> : errorContent;
  }

  // Not Found State
  if (!data) {
    const notFoundContent = (
      <div className='text-center py-12'>
        <p className='text-muted-foreground mb-4'>
          {notFoundMessage || `${entityName} not found.`}
        </p>
        {showNotFoundButton && (
          <Button onClick={handleNotFound} variant='outline' className='border-white/20 hover:bg-white/10'>
            {notFoundButtonLabel}
          </Button>
        )}
      </div>
    );

    return useLayout ? <Layout {...layoutProps}>{notFoundContent}</Layout> : notFoundContent;
  }

  // Success State - render children with data
  const content = children(data);
  return useLayout ? <Layout {...layoutProps}>{content}</Layout> : <>{content}</>;
}

/**
 * Simplified version for pages that don't need Layout wrapper
 * (e.g., components within tabs or modals)
 */
export function DetailContentWrapper<T>(
  props: Omit<DetailPageWrapperProps<T>, 'useLayout' | 'layoutProps'>
) {
  return <DetailPageWrapper {...props} useLayout={false} />;
}
