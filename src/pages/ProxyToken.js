import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FmCommonLoadingOverlay } from '@/components/common/feedback/FmCommonLoadingOverlay';
import { useProxyToken } from '@/shared/hooks/useProxyToken';
export default function ProxyToken() {
    const { t } = useTranslation('common');
    const { processToken } = useProxyToken();
    useEffect(() => {
        processToken();
    }, [processToken]);
    return _jsx(FmCommonLoadingOverlay, { message: t('status.processingQRCode') });
}
