import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Mail, AlertCircle } from 'lucide-react';
import {
  FmCommonCard,
  FmCommonCardContent,
  FmCommonCardDescription,
  FmCommonCardHeader,
  FmCommonCardTitle,
} from '@/components/common/display/FmCommonCard';
import { Button } from '@/components/common/shadcn/button';
import { FmGoldenGridLoader } from '@/components/common/feedback/FmGoldenGridLoader';
import { Layout } from '@/components/layout/Layout';
import { FmI18nCommon } from '@/components/common/i18n';
import { useAnalytics } from '@/features/analytics';
import { orderService } from '@/features/orders/services/orderService';
import { ticketEmailService } from '@/features/wallet/services/ticketEmailService';
import { logger } from '@/shared';

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');
  const { trackCheckoutComplete } = useAnalytics();
  const tracked = useRef(false);
  const emailSent = useRef(false);
  const [emailStatus, setEmailStatus] = useState<'pending' | 'sent' | 'failed'>('pending');
  const [orderId, setOrderId] = useState<string | null>(null);

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

  // Send ticket email with PDF attachment
  useEffect(() => {
    if (!sessionId || emailSent.current) return;

    const sendTicketEmail = async () => {
      emailSent.current = true;

      try {
        // Fetch order by checkout session ID
        const order = await orderService.getOrderByCheckoutSessionId(sessionId);

        if (!order) {
          logger.warn('Order not found for session, email not sent', {
            sessionId,
            source: 'CheckoutSuccess',
          });
          setEmailStatus('failed');
          return;
        }

        setOrderId(order.id);

        // Send ticket email with PDF attachment
        const result = await ticketEmailService.sendTicketEmail(order.id);

        if (result.success) {
          setEmailStatus('sent');
          logger.info('Ticket email sent successfully', {
            orderId: order.id,
            source: 'CheckoutSuccess',
          });
        } else {
          setEmailStatus('failed');
          logger.warn('Failed to send ticket email', {
            orderId: order.id,
            error: result.error,
            source: 'CheckoutSuccess',
          });
        }
      } catch (error) {
        setEmailStatus('failed');
        logger.error('Error sending ticket email', {
          sessionId,
          error: error instanceof Error ? error.message : 'Unknown',
          source: 'CheckoutSuccess',
        });
      }
    };

    sendTicketEmail();
  }, [sessionId]);

  if (!sessionId) {
    return (
      <Layout>
        <div className='min-h-[60vh] flex items-center justify-center'>
          <FmGoldenGridLoader size="md" />
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
            {/* Email status indicator */}
            <div className='flex items-center justify-center gap-2 text-sm'>
              {emailStatus === 'pending' && (
                <>
                  <FmGoldenGridLoader size="sm" />
                  <span className='text-muted-foreground'>
                    <FmI18nCommon i18nKey='checkoutResult.success.sendingEmail' />
                  </span>
                </>
              )}
              {emailStatus === 'sent' && (
                <>
                  <Mail className='h-4 w-4 text-success' />
                  <span className='text-success'>
                    <FmI18nCommon i18nKey='checkoutResult.success.emailSent' />
                  </span>
                </>
              )}
              {emailStatus === 'failed' && (
                <>
                  <AlertCircle className='h-4 w-4 text-muted-foreground' />
                  <span className='text-muted-foreground'>
                    <FmI18nCommon i18nKey='checkoutResult.success.emailFailed' />
                  </span>
                </>
              )}
            </div>

            <FmI18nCommon
              i18nKey='checkoutResult.success.emailNotice'
              as='p'
              className='text-sm text-muted-foreground text-center'
            />
            <div className='space-y-2'>
              <Button
                onClick={() =>
                  orderId
                    ? navigate(`/orders/${orderId}/tickets`)
                    : navigate('/wallet')
                }
                className='w-full'
              >
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
