import { useTranslation } from 'react-i18next';
import { ExternalLink } from 'lucide-react';

import { DecorativeDivider } from '@/components/primitives/DecorativeDivider';
import { MessagePanel } from '@/components/feedback/MessagePanel';
import { Button } from '@/components/common/shadcn/button';
import { PromoCodePanel } from './PromoCodePanel';
import {
  LF_SYSTEM_TICKET_URL,
  PROMO_CODE,
} from '@force-majeure/shared';

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
  const { t } = useTranslation('common');
  return (
    <MessagePanel
      title={t('scavenger.claimSuccess.title')}
      description=''
      action={
        <>
          <p className='text-m text-white mb-6'>
            {t('scavenger.claimSuccess.addedToGuestlist')} <br />
            <span className='text-fm-gold font-semibold'>
              LF SYSTEM @ Kingdom | Sat 10.18
            </span>{' '}
            <br />
            {t('scavenger.claimSuccess.seeYouThere')}
          </p>
          <DecorativeDivider />
          <p className='text-sm text-muted-foreground mb-6'>
            {t('scavenger.claimSuccess.checkInInstructions')}
          </p>
          <p className='text-sm text-white mb-6'>
            {' '}
            {t('scavenger.claimSuccess.nameListedAs')}{' '}
            <span className='text-fm-gold font-medium'>{userFullName}</span>.
          </p>
          <p className='text-sm text-muted-foreground mb-6'>
            {t('scavenger.claimSuccess.incorrectNameHelp')}{' '}
            <span className='text-fm-gold'>@force.majeure.events</span>{' '}
            {t('scavenger.claimSuccess.onInstagram')}
          </p>
          <DecorativeDivider />
          <p className='text-base text-white mb-6'>
            {t('scavenger.claimSuccess.needMoreTickets')}{' '}
            <span className='text-fm-gold font-bold'>{PROMO_CODE}</span>{' '}
            {t('scavenger.claimSuccess.discountOff')}
          </p>
          <Button
            size='lg'
            className='w-full max-w-xs mx-auto bg-gradient-gold hover:opacity-90 font-semibold text-black transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]'
            onClick={() => window.open(LF_SYSTEM_TICKET_URL, '_blank')}
          >
            <ExternalLink className='mr-2 h-4 w-4' />
            {t('buttons.buyTickets')}
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
  const { t } = useTranslation('common');
  return (
    <MessagePanel
      title=''
      description=''
      action={
        <>
          <h1 className='font-display text-5xl md:text-6xl mb-4'>
            {t('scavenger.checkpoint.welcomeTo')}{' '}
            <span className='text-fm-gold'>{locationName}</span>{' '}
            {t('scavenger.checkpoint.checkpoint')}
          </h1>
          <p className='text-base text-muted-foreground'>
            {t('scavenger.checkpoint.getOnGuestlist')}
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
                <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-fm-gold border-b-transparent' />
                {t('scavenger.checkpoint.addingToGuestlist')}
              </>
            ) : (
              t('scavenger.checkpoint.joinGuestlist')
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
  const { t } = useTranslation('common');
  return (
    <MessagePanel
      title=''
      description=''
      action={
        <>
          <h1 className='font-display text-5xl md:text-6xl mb-4'>
            {t('scavenger.checkpoint.welcomeTo')}{' '}
            <span className='text-fm-gold'>{locationName}</span>{' '}
            {t('scavenger.checkpoint.checkpoint')}
          </h1>
          <p className='text-base text-muted-foreground mb-4'>
            {t('scavenger.checkpoint.signUpPrompt')}
          </p>
          <DecorativeDivider />
          <Button
            size='lg'
            className='w-full max-w-xs mx-auto bg-gradient-gold hover:opacity-90 font-semibold text-black transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]'
            onClick={onJoinClick}
          >
            {t('scavenger.buttons.join')}
          </Button>
          <Button
            size='lg'
            className='w-full max-w-xs mx-auto mt-4 bg-transparent border-2 border-white text-white hover:bg-white hover:text-black font-semibold transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]'
            onClick={onSignInClick}
          >
            {t('auth.signIn')}
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
  const { t } = useTranslation('common');
  return (
    <MessagePanel
      title={t('scavenger.noCheckpoint.title')}
      description={t('scavenger.noCheckpoint.description')}
      action={
        <>
          <DecorativeDivider />
          <h2 className='font-display text-2xl md:text-3xl text-fm-gold'>
            {t('scavenger.noCheckpoint.registerTitle')}
          </h2>
          <p className='text-base text-muted-foreground'>
            {t('scavenger.noCheckpoint.registerDescription')}
          </p>
          <Button
            size='lg'
            className='w-full max-w-xs mx-auto bg-gradient-gold hover:opacity-90 font-semibold text-black transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]'
            onClick={onJoinClick}
          >
            {t('scavenger.buttons.join')}
          </Button>
          <Button
            size='lg'
            className='w-full max-w-xs mx-auto mt-4 bg-transparent border-2 border-white text-white hover:bg-white hover:text-black font-semibold transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]'
            onClick={onSignInClick}
          >
            {t('auth.signIn')}
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
