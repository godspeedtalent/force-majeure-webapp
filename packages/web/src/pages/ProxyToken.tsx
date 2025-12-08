import { useEffect } from 'react';

import { FmCommonLoadingOverlay } from '@/components/common/feedback/FmCommonLoadingOverlay';
import { useProxyToken } from '@force-majeure/shared/hooks/useProxyToken';

export default function ProxyToken() {
  const { processToken } = useProxyToken();

  useEffect(() => {
    processToken();
  }, [processToken]);

  return <FmCommonLoadingOverlay message='Processing QR code...' />;
}
