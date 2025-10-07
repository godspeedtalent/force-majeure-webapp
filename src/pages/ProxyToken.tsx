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
        navigate('/scavenger');
        return;
      }

      try {
        // Call the proxy-token edge function
        const { data, error } = await supabase.functions.invoke('proxy-token', {
          body: { token },
        });

        if (error) {
          console.error('Error calling proxy-token:', error);
          navigate('/scavenger');
          return;
        }

        // The edge function returns the encrypted code
        if (data?.code) {
          navigate(`/scavenger?code=${data.code}`);
        } else {
          // Fallback: construct the URL ourselves
          const response = await fetch(
            `https://orgxcrnnecblhuxjfruy.supabase.co/functions/v1/proxy-token?token=${token}`
          );
          
          if (response.redirected) {
            window.location.href = response.url;
          } else {
            navigate('/scavenger');
          }
        }
      } catch (err) {
        console.error('Error processing token:', err);
        navigate('/scavenger');
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
