import { useTranslation } from 'react-i18next';
import { MessagePanel } from '@/components/feedback/MessagePanel';

interface ConfirmationStepProps {
  email: string;
}

export function ConfirmationStep({ email }: ConfirmationStepProps) {
  const { t } = useTranslation('common');
  return (
    <MessagePanel
      title={t('scavenger.confirmation.title')}
      description={t('scavenger.confirmation.description', { email })}
    />
  );
}
