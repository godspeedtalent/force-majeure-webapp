import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect } from 'react';
import { FmCommonLoadingOverlay } from '@/components/common/feedback/FmCommonLoadingOverlay';
import { useProxyToken } from '@/shared/hooks/useProxyToken';
export default function ProxyToken() {
    const { processToken } = useProxyToken();
    useEffect(() => {
        processToken();
    }, [processToken]);
    return _jsx(FmCommonLoadingOverlay, { message: 'Processing QR code...' });
}
