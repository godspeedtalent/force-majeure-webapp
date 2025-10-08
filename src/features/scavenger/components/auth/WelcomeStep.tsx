import { Loader2 } from 'lucide-react';

import { DecorativeDivider } from '@/components/DecorativeDivider';
import { MessagePanel } from '@/components/MessagePanel';
import { Button } from '@/components/ui/button';

// Simple component interfaces - no state management
interface ClaimSuccessPanelProps {
  userDisplayName?: string;
}

interface CheckpointClaimPanelProps {
  locationName: string;
  onClaimClick: () => void;
  isLoading: boolean;
}

interface CheckpointWelcomePanelProps {
  locationName: string;
  onJoinClick: () => void;
  onSignInClick: () => void;
}

interface NoCheckpointPanelProps {
  onJoinClick: () => void;
  onSignInClick: () => void;
}

// Dumb component: Success state for users who have already claimed
export function ClaimSuccessPanel({ userDisplayName }: ClaimSuccessPanelProps) {
  return (
    <MessagePanel
      title='Congratulations!'
      description=''
      action={
        <>
          <p className='text-lg text-white mb-6'>
            You&apos;ve been added to the{' '}
            <span className='text-fm-gold font-semibold'>LF SYSTEM</span>{' '}
            guestlist. See you there.
          </p>
          <p className='text-sm text-muted-foreground'>
            Your name will be listed as{' '}
            <span className='text-white font-medium'>{userDisplayName}</span> in
            the guestlist. If this is incorrect, please reach out to{' '}
            <span className='text-fm-gold'>@force.majeure.events</span> on
            Instagram to correct it.
          </p>
        </>
      }
    />
  );
}

// Dumb component: Claim button for authenticated users at a checkpoint
export function CheckpointClaimPanel({
  locationName,
  onClaimClick,
  isLoading,
}: CheckpointClaimPanelProps) {
  return (
    <MessagePanel
      title=''
      description=''
      action={
        <>
          <h1 className='font-display text-5xl md:text-6xl mb-4'>
            Welcome to the <span className='text-fm-gold'>{locationName}</span>{' '}
            Checkpoint
          </h1>
          <p className='text-base text-muted-foreground'>
            As promised, let&apos;s get your name on that guestlist for LF
            SYSTEM at Kingdom, Sat Oct 18th.
          </p>
          <DecorativeDivider />
          <Button
            size='lg'
            className='w-full max-w-xs mx-auto mb-6 bg-gradient-gold hover:opacity-90 font-semibold text-black transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none'
            onClick={onClaimClick}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Adding to Guestlist...
              </>
            ) : (
              'Join Guestlist'
            )}
          </Button>
        </>
      }
    />
  );
}

// Dumb component: Welcome screen for unauthenticated users at a checkpoint
export function CheckpointWelcomePanel({
  locationName,
  onJoinClick,
  onSignInClick,
}: CheckpointWelcomePanelProps) {
  return (
    <MessagePanel
      title=''
      description=''
      action={
        <>
          <h1 className='font-display text-5xl md:text-6xl mb-4'>
            Welcome to the <span className='text-fm-gold'>{locationName}</span>{' '}
            Checkpoint
          </h1>
          <p className='text-base text-muted-foreground mb-4'>
            Sign up for an account with us, and we&apos;ll get you on the
            guestlist for LF SYSTEM at Kingdom on Saturday, October 18th.
          </p>
          <DecorativeDivider />
          <Button
            size='lg'
            className='w-full max-w-xs mx-auto bg-gradient-gold hover:opacity-90 font-semibold text-black transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]'
            onClick={onJoinClick}
          >
            Join
          </Button>
          <Button
            size='lg'
            className='w-full max-w-xs mx-auto mt-4 bg-transparent border-2 border-white text-white hover:bg-white hover:text-black font-semibold transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]'
            onClick={onSignInClick}
          >
            Sign In
          </Button>
        </>
      }
    />
  );
}

// Dumb component: General welcome screen when no checkpoint is scanned
export function NoCheckpointPanel({
  onJoinClick,
  onSignInClick,
}: NoCheckpointPanelProps) {
  return (
    <MessagePanel
      title='No Checkpoint Scanned.'
      description='But the free tickets are still out there. Keep searching!'
      action={
        <>
          <DecorativeDivider />
          <h2 className='font-display text-2xl md:text-3xl text-fm-gold'>
            Register with Force Majeure
          </h2>
          <p className='text-base text-muted-foreground'>
            You&apos;ll need to register with us to join the guestlist once you
            find a checklist. You can take care of that now if you&apos;d like.
          </p>
          <Button
            size='lg'
            className='w-full max-w-xs mx-auto bg-gradient-gold hover:opacity-90 font-semibold text-black transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]'
            onClick={onJoinClick}
          >
            Join
          </Button>
          <Button
            size='lg'
            className='w-full max-w-xs mx-auto mt-4 bg-transparent border-2 border-white text-white hover:bg-white hover:text-black font-semibold transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]'
            onClick={onSignInClick}
          >
            Sign In
          </Button>
        </>
      }
    />
  );
}

// Legacy component that will be replaced by direct usage of the above components
interface CheckpointClaimStepProps {
  locationName?: string | null;
  onJoinClick: () => void;
  onSignInClick: () => void;
  onClaimCheckpoint?: () => void;
  userDisplayName?: string;
  isAuthenticated?: boolean;
  hasAlreadyClaimed?: boolean;
  isClaimLoading?: boolean;
}

export function WelcomeStep({
  locationName,
  onJoinClick,
  onSignInClick,
  onClaimCheckpoint,
  userDisplayName,
  isAuthenticated = false,
  hasAlreadyClaimed = false,
  isClaimLoading = false,
}: CheckpointClaimStepProps) {
  // Show success panel if user has already claimed
  if (hasAlreadyClaimed && isAuthenticated) {
    return <ClaimSuccessPanel userDisplayName={userDisplayName} />;
  }

  // Show claim interface for authenticated users with valid checkpoint
  if (locationName && isAuthenticated) {
    return (
      <CheckpointClaimPanel
        locationName={locationName}
        onClaimClick={onClaimCheckpoint || (() => {})}
        isLoading={isClaimLoading}
      />
    );
  }

  if (locationName) {
    // With location name (valid checkpoint) - unauthenticated user
    return (
      <CheckpointWelcomePanel
        locationName={locationName}
        onJoinClick={onJoinClick}
        onSignInClick={onSignInClick}
      />
    );
  }

  // Without location name (no code or early arrival)
  return (
    <NoCheckpointPanel
      onJoinClick={onJoinClick}
      onSignInClick={onSignInClick}
    />
  );
}
