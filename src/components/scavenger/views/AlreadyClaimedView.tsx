import { MessagePanel } from '@/components/MessagePanel';

interface AlreadyClaimedViewProps {
  locationName: string;
}

export function AlreadyClaimedView({ locationName }: AlreadyClaimedViewProps) {
  return (
    <>
      <MessagePanel
        title='Already Claimed!'
        description={`You've already claimed a reward from ${locationName}. You can only claim one reward per location!`}
        className='mb-4'
      />
      <div className='text-center'>
        <p className='text-foreground font-canela text-sm lg:text-lg'>
          But you can share this secret location with your friends! 🎉
        </p>
      </div>
    </>
  );
}
