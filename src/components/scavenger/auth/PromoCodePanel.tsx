import { useTranslation } from 'react-i18next';
import { ExternalLink } from 'lucide-react';

import { DecorativeDivider } from '@/components/primitives/DecorativeDivider';
import { AnimatedCounter } from '@/components/primitives/AnimatedCounter';
import { MessagePanel } from '@/components/feedback/MessagePanel';
import { Button } from '@/components/common/shadcn/button';
import {
  LF_SYSTEM_TICKET_URL,
  PROMO_CODE,
} from '@/shared';

interface PromoCodePanelProps {
  userDisplayName?: string;
  onJoinClick?: () => void;
  onSignInClick?: () => void;
  lowClaimLocationsCount?: number;
}

export function PromoCodePanel({
  userDisplayName,
  onJoinClick,
  onSignInClick,
  lowClaimLocationsCount,
}: PromoCodePanelProps) {
  const { t } = useTranslation('common');
  return (
    <MessagePanel
      title=''
      description=''
      action={
        <>
          <h1 className='font-display text-4xl md:text-5xl mb-4'>
            {t('scavenger.promoCode.spotsClaimed')}
          </h1>
          <p className='text-base text-muted-foreground mb-4'>
            {t('scavenger.promoCode.spotsClaimedDescription')}
          </p>
          <DecorativeDivider />
          {typeof lowClaimLocationsCount === 'number' && (
            <p className='text-sm text-muted-foreground mb-4'>
              {t('scavenger.promoCode.locationsAvailable')}{' '}
              <AnimatedCounter
                value={lowClaimLocationsCount}
                duration={1200}
                className='inline text-fm-gold font-bold text-xl align-baseline mx-2'
              />{' '}
              {t('scavenger.promoCode.checkInstagram')}{' '}
              <span className='text-fm-gold font-semibold'>
                @force.majeure.events
              </span>{' '}
              {t('scavenger.promoCode.forHints')}
            </p>
          )}
          <DecorativeDivider />

          {userDisplayName ? (
            <>
              <h2 className='font-display text-2xl md:text-3xl text-fm-gold mb-4'>
                {t('scavenger.promoCode.yourPromoCode')}
              </h2>
              <div className='bg-black/50 border-2 border-fm-gold p-4 rounded-lg mb-6'>
                <code className='font-mono text-lg md:text-xl text-fm-gold tracking-wider'>
                  {PROMO_CODE}
                </code>
              </div>
              <Button
                size='lg'
                className='w-full max-w-xs mx-auto bg-gradient-gold hover:opacity-90 font-semibold text-black transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]'
                onClick={() => window.open(LF_SYSTEM_TICKET_URL, '_blank')}
              >
                <ExternalLink className='mr-2 h-4 w-4' />
                {t('scavenger.promoCode.buyTicketsNow')}
              </Button>
            </>
          ) : (
            <>
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
          )}
        </>
      }
    />
  );
}
