import { ExternalLink, Loader2 } from 'lucide-react';

import { DecorativeDivider } from '@/components/DecorativeDivider';
import { MessagePanel } from '@/components/MessagePanel';
import { Button } from '@/components/ui/button';
import { PromoCodePanel } from './PromoCodePanel';

const TICKET_URL =
  'https://www.etix.com/ticket/p/45040939/lf-system-austin-kingdom-nightclub?partner_id=100&_gl=1*fq6012*_gcl_au*MzU4MzE0NzgxLjE3NTk5Njg1MjM.*_ga*MTkwMzY4MjE5LjE3NTk5Njg1MjM.*_ga_FE6TSQF71T*czE3NTk5Njg1MjMkbzEkZzAkdDE3NTk5Njg1MjMkajYwJGwwJGgxNTA3MTgzNjUw';

// Simple component interfaces - no state management
interface ClaimSuccessPanelProps {
  userFullName?: string;
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
export function ClaimSuccessPanel({ userFullName }: ClaimSuccessPanelProps) {
  return (
    <MessagePanel
      title='Congratulations!'
      description=''
      action={
        <>
          <p className='text-m text-white mb-6'>
            You&apos;ve been added to the <br />
            <span className='text-fm-gold font-semibold'>LF SYSTEM @ Kingdom | Sat 10.18</span> <br />
            guestlist. See you there.
          </p>
          <DecorativeDivider />
          <p className='text-sm text-muted-foreground mb-6'>
            Check into the host stand as usual and give them your full name.
          </p>
          <p className='text-sm text-white mb-6'>  Your name will be listed as{' '}
            <span className='text-fm-gold font-medium'>{userFullName}</span>.
          </p>
          <p className='text-sm text-muted-foreground mb-6'>
           in
            the guestlist. If this is incorrect, please reach out to{' '}
            <span className='text-fm-gold'>@force.majeure.events</span> on
            Instagram to correct it.
          </p>
          <DecorativeDivider />
          <p className='text-base text-white mb-6'>
            Need more tickets for friends? Use code{' '}
            <span className='text-fm-gold font-bold'>FM-RAVE-FAM</span> for 20%
            off!
          </p>
          <Button
            size='lg'
            className='w-full max-w-xs mx-auto bg-gradient-gold hover:opacity-90 font-semibold text-black transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]'
            onClick={() => window.open(TICKET_URL, '_blank')}
          >
            <ExternalLink className='mr-2 h-4 w-4' />
            Buy Tickets
          </Button>
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
  userFullName?: string;
  isAuthenticated?: boolean;
  hasAlreadyClaimed?: boolean;
  isClaimLoading?: boolean;
  claimCount?: number;
  lowClaimLocationsCount?: number;
}

export function WelcomeStep({
  locationName,
  onJoinClick,
  onSignInClick,
  onClaimCheckpoint,
  userFullName,
  isAuthenticated = false,
  hasAlreadyClaimed = false,
  isClaimLoading = false,
  claimCount = 0,
  lowClaimLocationsCount,
}: CheckpointClaimStepProps) {
  // Show success panel if user has already claimed
  if (hasAlreadyClaimed && isAuthenticated) {
    return <ClaimSuccessPanel userFullName={userFullName} />;
  }

  // Check if claim limit reached (2 claims per checkpoint)
  if (locationName && claimCount >= 2) {
    return (
      <PromoCodePanel
        userDisplayName={userFullName}
        onJoinClick={onJoinClick}
        onSignInClick={onSignInClick}
        lowClaimLocationsCount={lowClaimLocationsCount}
      />
    );
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
