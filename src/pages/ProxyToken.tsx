import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { FmCommonLoadingOverlay } from '@/components/common/feedback/FmCommonLoadingOverlay';
import { Layout } from '@/components/layout/Layout';
import { useProxyToken } from '@/shared/hooks/useProxyToken';

export default function ProxyToken() {
  const { t } = useTranslation('common');
  const { processToken } = useProxyToken();

  useEffect(() => {
    processToken();
  }, [processToken]);

  return (
    <Layout>
      <FmCommonLoadingOverlay message={t('status.processingQRCode')} />
    </Layout>
  );
}
