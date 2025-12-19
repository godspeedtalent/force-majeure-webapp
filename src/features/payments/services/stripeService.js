import { supabase } from '@/shared';
/**
 * Stripe Service - Handles all Stripe API interactions through Supabase Edge Functions
 */
export const stripeService = {
    /**
     * Get or create a Stripe customer for the current user
     */
    async getOrCreateCustomer(email, userId) {
        const { data, error } = await supabase.functions.invoke('get-stripe-customer', {
            body: { email, userId },
        });
        if (error)
            throw new Error(error.message || 'Failed to get Stripe customer');
        return data;
    },
    /**
     * Create a payment intent for processing payment
     */
    async createPaymentIntent(amount, customerId, paymentMethodId) {
        const { data, error } = await supabase.functions.invoke('create-payment-intent', {
            body: {
                amount: Math.round(amount * 100), // Convert to cents
                currency: 'usd',
                customerId,
                paymentMethodId,
            },
        });
        if (error)
            throw new Error(error.message || 'Failed to create payment intent');
        return data;
    },
    /**
     * List all saved payment methods for a customer
     */
    async listPaymentMethods(customerId) {
        const { data, error } = await supabase.functions.invoke('list-payment-methods', {
            body: { customerId },
        });
        if (error)
            throw new Error(error.message || 'Failed to list payment methods');
        return data.paymentMethods.map((pm) => ({
            id: pm.id,
            brand: pm.card.brand,
            last4: pm.card.last4,
            exp_month: pm.card.exp_month,
            exp_year: pm.card.exp_year,
        }));
    },
    /**
     * Attach a payment method to a customer
     */
    async attachPaymentMethod(paymentMethodId, customerId) {
        const { error } = await supabase.functions.invoke('attach-payment-method', {
            body: { paymentMethodId, customerId },
        });
        if (error)
            throw new Error(error.message || 'Failed to attach payment method');
    },
    /**
     * Detach a payment method from a customer
     */
    async detachPaymentMethod(paymentMethodId) {
        const { error } = await supabase.functions.invoke('detach-payment-method', {
            body: { paymentMethodId },
        });
        if (error)
            throw new Error(error.message || 'Failed to detach payment method');
    },
};
