import { jsx as _jsx } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { MessagePanel } from '@/components/feedback/MessagePanel';
export function AllTokensClaimedView({ locationName, }) {
    const { t } = useTranslation('common');
    return (_jsx(MessagePanel, { title: t('scavenger.views.allClaimed'), description: t('scavenger.views.allClaimedDescription', { locationName }), className: 'mb-4' }));
}
