import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { Loader2 } from 'lucide-react';

export default function ProxyToken() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { data: userRole } = useUserRole();
  const isAdmin = userRole === 'admin';
  const debugMode = searchParams.get('debug') === 'true';

  useEffect(() => {
    const processToken = async () => {
      const token = searchParams.get('token');
      const startTime = Date.now();

      if (isAdmin && debugMode) {
        console.log('[PROXY-TOKEN-PAGE DEBUG] Processing started:', {
          timestamp: new Date().toISOString(),
          token: token ? `${token.substring(0, 8)}...` : null,
          url: window.location.href
        });
      }

      if (!token) {
        console.error('Missing token parameter');
        if (isAdmin && debugMode) {
          console.log('[PROXY-TOKEN-PAGE DEBUG] Missing token, redirecting to error');
        }
        navigate('/scavenger?error=invalid_token');
        return;
      }

      try {
        if (isAdmin && debugMode) {
          console.log('[PROXY-TOKEN-PAGE DEBUG] Calling edge function:', {
            url: `https://orgxcrnnecblhuxjfruy.supabase.co/functions/v1/proxy-token?token=${token}&debug=true`
          });
        }

        // Call the proxy-token edge function directly via HTTP
        const functionUrl = `https://orgxcrnnecblhuxjfruy.supabase.co/functions/v1/proxy-token?token=${token}${debugMode ? '&debug=true' : ''}`;
        const response = await fetch(functionUrl, {
            redirect: 'manual' // Don't follow redirects automatically
          }
        );

        if (isAdmin && debugMode) {
          console.log('[PROXY-TOKEN-PAGE DEBUG] Edge function response:', {
            status: response.status,
            type: response.type,
            headers: Object.fromEntries(response.headers.entries()),
            processingTime: `${Date.now() - startTime}ms`
          });
        }

        // The edge function returns a 302 redirect with Location header
        if (response.status === 302 || response.type === 'opaqueredirect') {
          const location = response.headers.get('Location');
          if (isAdmin && debugMode) {
            console.log('[PROXY-TOKEN-PAGE DEBUG] Redirect detected:', { location });
          }
          
          if (location) {
            // Extract the code from the redirect URL
            const url = new URL(location, window.location.origin);
            const code = url.searchParams.get('code');
            const error = url.searchParams.get('error');
            
            if (isAdmin && debugMode) {
              console.log('[PROXY-TOKEN-PAGE DEBUG] Parsed redirect URL:', {
                code: code ? `${code.substring(0, 20)}...` : null,
                error,
                fullUrl: location
              });
            }
            
            if (code) {
              const navigateUrl = `/scavenger?code=${code}${debugMode ? '&debug=true' : ''}`;
              if (isAdmin && debugMode) {
                console.log('[PROXY-TOKEN-PAGE DEBUG] Navigating with code:', navigateUrl);
              }
              navigate(navigateUrl);
              return;
            } else if (error) {
              if (isAdmin && debugMode) {
                console.log('[PROXY-TOKEN-PAGE DEBUG] Navigating with error:', error);
              }
              navigate(`/scavenger?error=${error}${debugMode ? '&debug=true' : ''}`);
              return;
            }
          }
        }

        // If no redirect, try to parse as JSON (fallback)
        const data = await response.json();
        if (isAdmin && debugMode) {
          console.log('[PROXY-TOKEN-PAGE DEBUG] JSON response:', data);
        }
        
        if (data?.code) {
          navigate(`/scavenger?code=${data.code}${debugMode ? '&debug=true' : ''}`);
        } else {
          navigate(`/scavenger?error=proxy_error${debugMode ? '&debug=true' : ''}`);
        }
      } catch (err) {
        console.error('Error processing token:', err);
        if (isAdmin && debugMode) {
          console.log('[PROXY-TOKEN-PAGE DEBUG] Error occurred:', {
            error: err instanceof Error ? err.message : String(err),
            stack: err instanceof Error ? err.stack : undefined,
            processingTime: `${Date.now() - startTime}ms`
          });
        }
        navigate(`/scavenger?error=proxy_error${debugMode ? '&debug=true' : ''}`);
      }
    };

    processToken();
  }, [searchParams, navigate, isAdmin, debugMode]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-fm-gold" />
    </div>
  );
}
