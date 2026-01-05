import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import {
  FmCommonCard,
  FmCommonCardContent,
  FmCommonCardDescription,
  FmCommonCardHeader,
  FmCommonCardTitle,
} from '@/components/common/display/FmCommonCard';
import { Button } from '@/components/common/shadcn/button';
import { Layout } from '@/components/layout/Layout';
import { FmI18nCommon } from '@/components/common/i18n';
import { useAnalytics } from '@/features/analytics';

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');
  const { trackCheckoutComplete } = useAnalytics();
  const tracked = useRef(false);

  useEffect(() => {
    if (!sessionId) {
      navigate('/', { replace: true });
      return;
    }

    // Track checkout completion (only once)
    if (!tracked.current) {
      tracked.current = true;
      // Note: In a real implementation, you'd fetch the order details
      // to get the event ID and order value. For now, we track with session ID.
      trackCheckoutComplete('unknown', sessionId, 0);
    }
  }, [sessionId, navigate, trackCheckoutComplete]);

  if (!sessionId) {
    return (
      <Layout>
        <div className='min-h-[60vh] flex items-center justify-center'>
          <div className='h-8 w-8 animate-spin rounded-full border-[3px] border-fm-gold border-b-transparent' />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className='min-h-[60vh] flex items-center justify-center p-4'>
        <FmCommonCard className='w-full max-w-md'>
          <FmCommonCardHeader className='text-center'>
            <div className='mx-auto mb-4 w-16 h-16 rounded-none bg-success/10 flex items-center justify-center'>
              <CheckCircle2 className='h-8 w-8 text-success' />
            </div>
            <FmCommonCardTitle className='text-2xl'>
              <FmI18nCommon i18nKey='checkoutResult.success.title' />
            </FmCommonCardTitle>
            <FmCommonCardDescription>
              <FmI18nCommon i18nKey='checkoutResult.success.description' />
            </FmCommonCardDescription>
          </FmCommonCardHeader>
          <FmCommonCardContent className='space-y-4'>
            <FmI18nCommon
              i18nKey='checkoutResult.success.emailNotice'
              as='p'
              className='text-sm text-muted-foreground text-center'
            />
            <div className='space-y-2'>
              <Button onClick={() => navigate('/profile')} className='w-full'>
                <FmI18nCommon i18nKey='checkoutResult.success.viewTickets' />
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
    </Layout>
  );
}
