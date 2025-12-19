import { useTranslation } from 'react-i18next';
import { MessagePanel } from '@/components/feedback/MessagePanel';

interface AlreadyClaimedViewProps {
  locationName: string;
}

export function AlreadyClaimedView({ locationName }: AlreadyClaimedViewProps) {
  const { t } = useTranslation('common');

  return (
    <>
      <MessagePanel
        title={t('scavenger.views.alreadyClaimed')}
        description={t('scavenger.views.alreadyClaimedDescription', { locationName })}
        className='mb-4'
      />
      <div className='text-center'>
        <p className='text-foreground font-canela text-sm lg:text-lg'>
          {t('scavenger.views.shareWithFriends')}
        </p>
      </div>
    </>
  );
}
