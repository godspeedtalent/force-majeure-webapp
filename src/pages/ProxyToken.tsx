import { useEffect } from 'react';
import { useProxyToken } from '@/hooks/useProxyToken';
import { ProcessingLoader } from '@/components/ProcessingLoader';

export default function ProxyToken() {
  const { processToken } = useProxyToken();

  useEffect(() => {
    processToken();
  }, [processToken]);

  return <ProcessingLoader message="Processing QR code..." />;
}
