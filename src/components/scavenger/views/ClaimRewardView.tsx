import { toast } from 'sonner';

import { MessagePanel } from '@/components/feedback/MessagePanel';
import { Button } from '@/components/ui/shadcn/button';

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
  const handleClaim = async () => {
    try {
      await onClaim();
      toast.success('Checkpoint discovered! You and a friend are on the list.');
      window.location.href = '/scavenger';
    } catch (_error) {
      toast.error('Failed to claim checkpoint');
    }
  };

  return (
    <>
      <MessagePanel
        title={`Welcome to the ${locationName} Checkpoint`}
        description='Discover this checkpoint to get you and a friend on the guestlist!'
        className='mb-6'
      />
      <div className='text-center'>
        <Button
          size='lg'
          className='bg-gradient-gold hover:opacity-90 font-screamer text-xl px-12 py-6 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(212,175,55,0.6)]'
          onClick={handleClaim}
          disabled={isLoading}
        >
          {isLoading ? 'Claiming...' : 'Claim Checkpoint'}
        </Button>
      </div>
    </>
  );
}
