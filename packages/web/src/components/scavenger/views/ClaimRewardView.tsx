import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { MessagePanel } from '@/components/feedback/MessagePanel';
import { Button } from '@/components/common/shadcn/button';

interface ClaimRewardViewProps {
  locationName: string;
  onClaim: () => Promise<void>;
  isLoading: boolean;
}

export function ClaimRewardView({
  locationName,
  onClaim,
  isLoading,
}: ClaimRewardViewProps) {
  const { t } = useTranslation('common');

  const handleClaim = async () => {
    try {
      await onClaim();
      toast.success(t('scavenger.claimReward.successMessage'));
      window.location.href = '/scavenger';
    } catch (_error) {
      toast.error(t('scavenger.claimReward.errorMessage'));
    }
  };

  return (
    <>
      <MessagePanel
        title={t('scavenger.claimReward.title', { locationName })}
        description={t('scavenger.claimReward.description')}
        className='mb-6'
      />
      <div className='text-center'>
        <Button
          size='lg'
          className='bg-gradient-gold hover:opacity-90 font-screamer text-xl px-12 py-6 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(212,175,55,0.6)]'
          onClick={handleClaim}
          disabled={isLoading}
        >
          {isLoading ? t('scavenger.claimReward.claiming') : t('scavenger.claimReward.claimButton')}
        </Button>
      </div>
    </>
  );
}
