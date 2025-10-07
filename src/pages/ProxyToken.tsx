import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export default function ProxyToken() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const processToken = async () => {
      const token = searchParams.get('token');

      if (!token) {
        console.error('Missing token parameter');
        navigate('/scavenger?error=invalid_token');
        return;
      }

      try {
        // Call the proxy-token edge function directly via HTTP
        const response = await fetch(
          `https://orgxcrnnecblhuxjfruy.supabase.co/functions/v1/proxy-token?token=${token}`,
          {
            redirect: 'manual' // Don't follow redirects automatically
          }
        );

        // The edge function returns a 302 redirect with Location header
        if (response.status === 302 || response.type === 'opaqueredirect') {
          const location = response.headers.get('Location');
          if (location) {
            // Extract the code from the redirect URL
            const url = new URL(location, window.location.origin);
            const code = url.searchParams.get('code');
            if (code) {
              navigate(`/scavenger?code=${code}`);
              return;
            }
          }
        }

        // If no redirect, try to parse as JSON (fallback)
        const data = await response.json();
        if (data?.code) {
          navigate(`/scavenger?code=${data.code}`);
        } else {
          navigate('/scavenger?error=proxy_error');
        }
      } catch (err) {
        console.error('Error processing token:', err);
        navigate('/scavenger?error=proxy_error');
      }
    };

    processToken();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-fm-gold" />
    </div>
  );
}
