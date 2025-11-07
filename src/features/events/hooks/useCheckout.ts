import { useState } from 'react';
import { supabase } from '@/shared/api/supabase/client';
import { toast } from '@/components/common/feedback/FmCommonToast';

export interface TicketSelection {
  tier_id: string;
  quantity: number;
}

export const useCheckout = () => {
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
      console.error('Checkout error:', error);
      toast.error('Checkout Failed', {
        description:
          error instanceof Error
            ? error.message
            : 'Failed to create checkout session',
      });
      setIsLoading(false);
    }
  };

  return {
    initiateCheckout,
    isLoading,
  };
};
