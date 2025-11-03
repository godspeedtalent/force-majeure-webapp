import { LoadingState } from './LoadingState';

interface ProcessingLoaderProps {
  message?: string;
}

/**
 * ProcessingLoader
 * 
 * Full-screen loading overlay for processing states.
 * Uses LoadingState component internally.
 * 
 * @deprecated Consider using LoadingState with centered prop or FmCommonLoadingOverlay instead
 */
export function ProcessingLoader({
  message = 'Processing...',
}: ProcessingLoaderProps) {
  return (
    <div className='min-h-screen flex items-center justify-center bg-background'>
      <LoadingState message={message} size="md" centered={false} />
    </div>
  );
}
