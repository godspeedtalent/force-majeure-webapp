import { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { getTrackingLinkEdgeFunctionUrl } from '@/shared/utils/trackingLinkUtils';

/**
 * Handles short tracking link redirects.
 * Routes like /t/my-code will redirect to the Supabase edge function
 * which tracks the click and redirects to the final destination.
 */
export default function TrackingLinkRedirect() {
  const { code } = useParams<{ code: string }>();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (code) {
      // Build the edge function URL with the tracking code
      const edgeFunctionUrl = getTrackingLinkEdgeFunctionUrl(code);

      // Preserve any additional query params (though typically there won't be any)
      const additionalParams = searchParams.toString();
      const finalUrl = additionalParams
        ? `${edgeFunctionUrl}&${additionalParams}`
        : edgeFunctionUrl;

      // Redirect to the edge function
      window.location.href = finalUrl;
    }
  }, [code, searchParams]);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
      <FmCommonLoadingSpinner size="lg" />
      <p className="text-muted-foreground text-sm">Redirecting...</p>
    </div>
  );
}
