import { useTranslation } from 'react-i18next';
import { MessagePanel } from '@/components/feedback/MessagePanel';
import { FmI18nCommon } from '@/components/common/i18n';

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
        <FmI18nCommon i18nKey='scavenger.views.shareWithFriends' as='p' className='text-foreground font-canela text-sm lg:text-lg' />
      </div>
    </>
  );
}
