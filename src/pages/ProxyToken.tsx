import { useEffect } from 'react';

import { ProcessingLoader } from '@/components/common/ProcessingLoader';
import { useProxyToken } from '@/shared/hooks/useProxyToken';

export default function ProxyToken() {
  const { processToken } = useProxyToken();

  useEffect(() => {
    processToken();
  }, [processToken]);

  return <ProcessingLoader message='Processing QR code...' />;
}
