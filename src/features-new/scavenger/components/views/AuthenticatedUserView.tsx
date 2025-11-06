import { AnimatedCounter } from '@/components/primitives/AnimatedCounter';
import { MessagePanel } from '@/components/feedback/MessagePanel';
import { Button } from '@/components/common/shadcn/button';
import { LF_SYSTEM_TICKET_URL } from '@/shared/constants/ticketLinks';

interface AuthenticatedUserViewProps {
  displayName?: string;
  totalUndiscoveredCheckpoints: number;
  isLoading?: boolean;
}

export function AuthenticatedUserView({
  displayName,
  totalUndiscoveredCheckpoints,
  isLoading,
}: AuthenticatedUserViewProps) {
  return (
    <MessagePanel
      isLoading={isLoading}
      title={`Welcome back, ${displayName || 'Raver'}!`}
      description={
        totalUndiscoveredCheckpoints > 0
          ? 'Each checkpoint you discover gets you and a friend on the guestlist! Head out and scan the QR codes.'
          : undefined
      }
      action={
        <>
          <div className='text-center mb-8'>
            {totalUndiscoveredCheckpoints > 0 ? (
              <>
                <p className='text-lg text-muted-foreground mb-4'>
                  Undiscovered Checkpoints
                </p>
                <AnimatedCounter
                  value={totalUndiscoveredCheckpoints}
                  className='text-6xl md:text-8xl'
                />
              </>
            ) : (
              <>
                <p className='text-xl text-muted-foreground mb-6'>
                  All checkpoints have been discovered! Tickets are still
                  available below:
                </p>
                <Button
                  size='lg'
                  className='bg-gradient-gold hover:opacity-90 font-semibold text-black transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]'
                  asChild
                >
                  <a
                    href={LF_SYSTEM_TICKET_URL}
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    Get Tickets
                  </a>
                </Button>
              </>
            )}
          </div>
        </>
      }
    />
  );
}
