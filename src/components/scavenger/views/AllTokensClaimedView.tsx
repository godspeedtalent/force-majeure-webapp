import { useTranslation } from 'react-i18next';
import { MessagePanel } from '@/components/feedback/MessagePanel';

interface AllTokensClaimedViewProps {
  locationName: string;
}

export function AllTokensClaimedView({
  locationName,
}: AllTokensClaimedViewProps) {
  const { t } = useTranslation('common');

  return (
    <MessagePanel
      title={t('scavenger.views.allClaimed')}
      description={t('scavenger.views.allClaimedDescription', { locationName })}
      className='mb-4'
    />
  );
}
