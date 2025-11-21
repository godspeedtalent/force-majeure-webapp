import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { useState, useCallback } from 'react';
import { logger } from '@/shared/services/logger';
import { useAuth } from '@/features/auth/services/AuthContext';
import { supabase } from '@/shared/api/supabase/client';
import { stripeService } from '../services/stripeService';
import type { SavedCard, PaymentResult } from '../types';

/**
 * useStripePayment - Main hook for Stripe payment operations
 *
 * Provides methods for:
 * - Processing payments with new or saved cards
 * - Loading and managing saved payment methods
 * - Creating and managing Stripe customers
 *
 * @example
 * ```tsx
 * const { processPayment, loadSavedCards, savedCards, loading } = useStripePayment();
 *
 * // Load saved cards
 * useEffect(() => {
 *   if (user) loadSavedCards();
 * }, [user]);
 *
 * // Process payment
 * const result = await processPayment(99.99, true, selectedCardId);
 * ```
 */
export const useStripePayment = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);

  /**
   * Get or create Stripe customer ID for current user
   */
  const getOrCreateCustomer = useCallback(async (): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    // Check if user has stripe_customer_id in metadata
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      throw userError;
    }

    if (userData?.stripe_customer_id) {
      return userData.stripe_customer_id;
    }

    // Create new customer
    const customer = await stripeService.getOrCreateCustomer(
      user.email!,
      user.id
    );

    // Save customer ID to user profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ stripe_customer_id: customer.customerId })
      .eq('user_id', user.id);

    if (updateError) {
      logger.error('Failed to save stripe customer ID:', {
        error: updateError.message,
        source: 'useStripePayment.getOrCreateCustomer'
      });
    }

    return customer.customerId;
  }, [user]);

  /**
   * Load all saved payment methods for current user
   */
  const loadSavedCards = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const customerId = await getOrCreateCustomer();
      const cards = await stripeService.listPaymentMethods(customerId);
      setSavedCards(cards);
    } catch (error) {
      logger.error('Failed to load saved cards:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'useStripePayment.loadSavedCards'
      });
      setSavedCards([]);
    } finally {
      setLoading(false);
    }
  }, [user, getOrCreateCustomer]);

  /**
   * Process a payment with Stripe
   *
   * @param amount - Amount in dollars (will be converted to cents)
   * @param saveCard - Whether to save the card for future use
   * @param savedCardId - ID of saved card to use (if using existing card)
   * @returns Payment result with success status
   */
  const processPayment = useCallback(
    async (
      amount: number,
      saveCard: boolean = false,
      savedCardId?: string
    ): Promise<PaymentResult> => {
      if (!stripe || !elements) {
        throw new Error('Stripe not loaded');
      }

      if (!user) {
        throw new Error('User not authenticated');
      }

      setLoading(true);
      try {
        const customerId = await getOrCreateCustomer();
        let paymentMethodId = savedCardId;

        // If using new card, create payment method
        if (!savedCardId) {
          const cardElement = elements.getElement(CardElement);
          if (!cardElement) {
            throw new Error('Card element not found');
          }

          const { error: methodError, paymentMethod } =
            await stripe.createPaymentMethod({
              type: 'card',
              card: cardElement,
            });

          if (methodError) {
            throw new Error(
              methodError.message || 'Failed to create payment method'
            );
          }

          paymentMethodId = paymentMethod!.id;

          // Attach to customer if saving
          if (saveCard) {
            await stripeService.attachPaymentMethod(
              paymentMethodId,
              customerId
            );
          }
        }

        // Create payment intent
        const paymentIntent = await stripeService.createPaymentIntent(
          amount,
          customerId,
          paymentMethodId
        );

        // Confirm payment
        const { error: confirmError } = await stripe.confirmCardPayment(
          paymentIntent.clientSecret,
          savedCardId ? undefined : { payment_method: paymentMethodId }
        );

        if (confirmError) {
          throw new Error(
            confirmError.message || 'Payment confirmation failed'
          );
        }

        // Reload saved cards if we saved a new one
        if (saveCard && !savedCardId) {
          await loadSavedCards();
        }

        return { success: true, paymentMethodId };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Payment failed';
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [stripe, elements, user, getOrCreateCustomer, loadSavedCards]
  );

  /**
   * Remove a saved payment method
   */
  const removeSavedCard = useCallback(
    async (paymentMethodId: string) => {
      try {
        setLoading(true);
        await stripeService.detachPaymentMethod(paymentMethodId);
        await loadSavedCards();
    } catch (error) {
      logger.error('Failed to remove card:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'useStripePayment.removeSavedCard'
      });
      throw error;
      } finally {
        setLoading(false);
      }
    },
    [loadSavedCards]
  );

  return {
    processPayment,
    loadSavedCards,
    removeSavedCard,
    savedCards,
    loading,
    ready: !!stripe && !!elements,
  };
};
