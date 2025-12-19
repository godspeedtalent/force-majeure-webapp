import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { logger } from '@force-majeure/shared';
import { supabase } from '@force-majeure/shared';
import { toast } from 'sonner';

export interface TicketSelection {
  tier_id: string;
  quantity: number;
}

export const useCheckout = () => {
  const { t } = useTranslation('toasts');
  const [isLoading, setIsLoading] = useState(false);

  const initiateCheckout = async (
    eventId: string,
    tickets: TicketSelection[]
  ) => {
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        'create-checkout-session',
        {
          body: {
            event_id: eventId,
            tickets: tickets,
          },
        }
      );

      if (error) throw error;

      if (!data?.url) {
        throw new Error('No checkout URL received');
      }

      // Redirect to Stripe checkout
      window.location.href = data.url;
    } catch (error) {
      logger.error('Checkout error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'useCheckout.initiateCheckout'
      });
      toast.error(t('checkout.checkoutFailed'), {
        description:
          error instanceof Error
            ? error.message
            : t('checkout.paymentError'),
      });
      setIsLoading(false);
    }
  };

  return {
    initiateCheckout,
    isLoading,
  };
};
