import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface DebugLogger {
  log: (message: string, data?: any) => void;
}

export function useDebugLogger(isEnabled: boolean, prefix: string): DebugLogger {
  return {
    log: (message: string, data?: any) => {
      if (isEnabled) {
        console.log(`[${prefix}] ${message}`, data || '');
      }
    }
  };
}

export function useProxyToken() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { data: userRole } = useUserRole();

  const isAdmin = userRole === 'admin';
  const debugMode = searchParams.get('debug') === 'true';
  const debug = useDebugLogger(isAdmin && debugMode, 'PROXY-TOKEN');

  const processToken = async () => {
    const token = searchParams.get('token');
    const startTime = Date.now();

    debug.log('Processing started', {
      timestamp: new Date().toISOString(),
      token: token ? `${token.substring(0, 8)}...` : null,
      url: window.location.href
    });

    if (!token) {
      debug.log('Missing token, redirecting to error');
      navigate('/scavenger?error=invalid_token');
      return;
    }

    try {
      // Validate token using the existing validate-location function
      debug.log('Validating token with Supabase function', {
        tokenMasked: token.substring(0, 8) + '...'
      });

      const { data, error } = await supabase.functions.invoke('validate-location', {
        body: { token }
      });

      debug.log('Function validation result', {
        data,
        error: error?.message,
        processingTime: `${Date.now() - startTime}ms`
      });

      if (error || !data?.success) {
        debug.log('Token is invalid', {
          error: error?.message || data?.error,
          token: token.substring(0, 8) + '...'
        });
        navigate('/scavenger?error=invalid_token');
        return;
      }

      const locationId = data.location_id;
      const locationName = data.location_name;

      debug.log('Token is valid, redirecting to scavenger', {
        locationId,
        locationName
      });

      // Pass the validated locationId to scavenger
      navigate(`/scavenger?locationId=${encodeURIComponent(locationId)}${debugMode ? '&debug=true' : ''}`);

    } catch (err) {
      console.error('Error processing token:', err);
      debug.log('Error occurred during validation', {
        error: err instanceof Error ? err.message : String(err),
        processingTime: `${Date.now() - startTime}ms`
      });
      navigate('/scavenger?error=invalid_token');
    }
  };

  return { processToken };
}