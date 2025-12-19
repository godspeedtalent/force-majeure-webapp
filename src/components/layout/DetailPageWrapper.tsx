import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  /** Custom back button label (uses i18n default if not provided) */
  backButtonLabel?: string;
  /** Custom not found message (uses i18n default if not provided) */
  notFoundMessage?: string;
  /** Custom error message (uses i18n default if not provided) */
  errorMessage?: string;
  /** Whether to show the not found button (defaults to true) */
  showNotFoundButton?: boolean;
  /** Custom not found button label (uses i18n default if not provided) */
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
  backButtonLabel,
  notFoundMessage,
  errorMessage,
  showNotFoundButton = true,
  notFoundButtonLabel,
  onNotFoundAction,
  children,
  useLayout = true,
  layoutProps,
}: DetailPageWrapperProps<T>) {
  const navigate = useNavigate();
  const { t } = useTranslation('common');

  const resolvedBackButtonLabel = backButtonLabel || t('detailPageWrapper.goBack');
  const resolvedNotFoundButtonLabel = notFoundButtonLabel || t('detailPageWrapper.goHome');

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
          {errorMessage || t('detailPageWrapper.failedToLoad', { entity: entityName.toLowerCase() })}
        </p>
        <Button onClick={handleBack} variant='outline' className='border-white/20 hover:bg-white/10'>
          {resolvedBackButtonLabel}
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
          {notFoundMessage || t('detailPageWrapper.notFound', { entity: entityName })}
        </p>
        {showNotFoundButton && (
          <Button onClick={handleNotFound} variant='outline' className='border-white/20 hover:bg-white/10'>
            {resolvedNotFoundButtonLabel}
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
