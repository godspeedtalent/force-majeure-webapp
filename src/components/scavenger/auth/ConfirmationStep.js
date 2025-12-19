import { jsx as _jsx } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { MessagePanel } from '@/components/feedback/MessagePanel';
export function ConfirmationStep({ email }) {
    const { t } = useTranslation('common');
    return (_jsx(MessagePanel, { title: t('scavenger.confirmation.title'), description: t('scavenger.confirmation.description', { email }) }));
}
