import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import {
  FmCommonCard,
  FmCommonCardContent,
  FmCommonCardDescription,
  FmCommonCardHeader,
  FmCommonCardTitle,
} from '@/components/common/display/FmCommonCard';
import { Button } from '@/components/common/shadcn/button';
import { TopographicBackground } from '@/components/common/misc/TopographicBackground';
import { FmI18nCommon } from '@/components/common/i18n';
import { useAnalytics } from '@/features/analytics';

export default function CheckoutCancel() {
  const navigate = useNavigate();
  const { trackCheckoutAbandon } = useAnalytics();
  const tracked = useRef(false);

  // Track checkout abandonment (only once)
  useEffect(() => {
    if (!tracked.current) {
      tracked.current = true;
      // Note: In a real implementation, you'd get the event ID from session/cart
      trackCheckoutAbandon('unknown');
    }
  }, [trackCheckoutAbandon]);

  return (
    <div className='min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden'>
      <TopographicBackground opacity={0.25} />
      <div className='absolute inset-0 bg-gradient-monochrome opacity-10' />
      <FmCommonCard className='w-full max-w-md relative z-10'>
        <FmCommonCardHeader className='text-center'>
          <div className='mx-auto mb-4 w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center'>
            <XCircle className='h-8 w-8 text-destructive' />
          </div>
          <FmCommonCardTitle className='text-2xl'>
            <FmI18nCommon i18nKey='checkoutResult.cancelled.title' />
          </FmCommonCardTitle>
          <FmCommonCardDescription>
            <FmI18nCommon i18nKey='checkoutResult.cancelled.description' />
          </FmCommonCardDescription>
        </FmCommonCardHeader>
        <FmCommonCardContent className='space-y-4'>
          <FmI18nCommon
            i18nKey='checkoutResult.cancelled.noCharges'
            as='p'
            className='text-sm text-muted-foreground text-center'
          />
          <div className='space-y-2'>
            <Button onClick={() => navigate(-1)} className='w-full'>
              <FmI18nCommon i18nKey='checkoutResult.cancelled.tryAgain' />
            </Button>
            <Button
              onClick={() => navigate('/')}
              variant='outline'
              className='w-full'
            >
              <FmI18nCommon i18nKey='checkoutResult.backToHome' />
            </Button>
          </div>
        </FmCommonCardContent>
      </FmCommonCard>
    </div>
  );
}
