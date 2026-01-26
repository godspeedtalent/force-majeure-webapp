import { useEffect } from 'react';

import { FmCommonLoadingOverlay } from '@/components/common/feedback/FmCommonLoadingOverlay';
import { Layout } from '@/components/layout/Layout';
import { useProxyToken } from '@/shared/hooks/useProxyToken';

export default function ProxyToken() {
  const { processToken } = useProxyToken();

  useEffect(() => {
    processToken();
  }, [processToken]);

  return (
    <Layout>
      <FmCommonLoadingOverlay />
    </Layout>
  );
}
