import { describe, it, expect, vi, beforeEach } from 'vitest';
import { stripeService } from './stripeService';

// Mock Supabase client
vi.mock('@/shared/api/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

import { supabase } from '@/shared';

describe('stripeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getOrCreateCustomer', () => {
    it('should create customer with email and userId', async () => {
      const mockCustomer = {
        customerId: 'cus_123',
        email: 'test@example.com',
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: mockCustomer,
        error: null,
      });

      const result = await stripeService.getOrCreateCustomer(
        'test@example.com',
        'user-123'
      );

      expect(supabase.functions.invoke).toHaveBeenCalledWith('get-stripe-customer', {
        body: { email: 'test@example.com', userId: 'user-123' },
      });
      expect(result).toEqual(mockCustomer);
    });

    it('should return existing customer data', async () => {
      const mockCustomer = {
        customerId: 'cus_existing',
        email: 'existing@example.com',
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: mockCustomer,
        error: null,
      });

      const result = await stripeService.getOrCreateCustomer(
        'existing@example.com',
        'user-456'
      );

      expect(result.customerId).toBe('cus_existing');
    });

    it('should throw on edge function error', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: null,
        error: { message: 'Customer creation failed' },
      });

      await expect(
        stripeService.getOrCreateCustomer('test@example.com', 'user-123')
      ).rejects.toThrow('Customer creation failed');
    });

    it('should throw with default message when error has no message', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: null,
        error: {},
      });

      await expect(
        stripeService.getOrCreateCustomer('test@example.com', 'user-123')
      ).rejects.toThrow('Failed to get Stripe customer');
    });
  });

  describe('createPaymentIntent', () => {
    it('should convert amount to cents correctly', async () => {
      const mockIntent = {
        id: 'pi_123',
        client_secret: 'pi_123_secret_abc',
        amount: 5000,
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: mockIntent,
        error: null,
      });

      await stripeService.createPaymentIntent(50.0, 'cus_123');

      expect(supabase.functions.invoke).toHaveBeenCalledWith('create-payment-intent', {
        body: {
          amount: 5000, // 50.00 * 100 = 5000 cents
          currency: 'usd',
          customerId: 'cus_123',
          paymentMethodId: undefined,
        },
      });
    });

    it('should round to nearest cent for fractional amounts', async () => {
      const mockIntent = {
        id: 'pi_123',
        client_secret: 'pi_123_secret_abc',
        amount: 4999,
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: mockIntent,
        error: null,
      });

      // 49.99 * 100 = 4999 cents
      await stripeService.createPaymentIntent(49.99, 'cus_123');

      expect(supabase.functions.invoke).toHaveBeenCalledWith('create-payment-intent', {
        body: {
          amount: 4999,
          currency: 'usd',
          customerId: 'cus_123',
          paymentMethodId: undefined,
        },
      });
    });

    it('should include customerId and paymentMethodId', async () => {
      const mockIntent = {
        id: 'pi_123',
        client_secret: 'pi_123_secret_abc',
        amount: 10000,
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: mockIntent,
        error: null,
      });

      await stripeService.createPaymentIntent(100.0, 'cus_456', 'pm_789');

      expect(supabase.functions.invoke).toHaveBeenCalledWith('create-payment-intent', {
        body: {
          amount: 10000,
          currency: 'usd',
          customerId: 'cus_456',
          paymentMethodId: 'pm_789',
        },
      });
    });

    it('should return payment intent data', async () => {
      const mockIntent = {
        id: 'pi_123',
        client_secret: 'pi_123_secret_abc',
        amount: 5000,
        status: 'requires_payment_method',
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: mockIntent,
        error: null,
      });

      const result = await stripeService.createPaymentIntent(50.0, 'cus_123');

      expect(result).toEqual(mockIntent);
    });

    it('should throw on error with correct message', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: null,
        error: { message: 'Insufficient funds' },
      });

      await expect(
        stripeService.createPaymentIntent(50.0, 'cus_123')
      ).rejects.toThrow('Insufficient funds');
    });

    it('should throw with default message when error has no message', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: null,
        error: {},
      });

      await expect(
        stripeService.createPaymentIntent(50.0, 'cus_123')
      ).rejects.toThrow('Failed to create payment intent');
    });
  });

  describe('listPaymentMethods', () => {
    it('should transform payment method data correctly', async () => {
      const mockResponse = {
        paymentMethods: [
          {
            id: 'pm_123',
            card: {
              brand: 'visa',
              last4: '4242',
              exp_month: 12,
              exp_year: 2025,
            },
          },
          {
            id: 'pm_456',
            card: {
              brand: 'mastercard',
              last4: '5555',
              exp_month: 6,
              exp_year: 2026,
            },
          },
        ],
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const result = await stripeService.listPaymentMethods('cus_123');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'pm_123',
        brand: 'visa',
        last4: '4242',
        exp_month: 12,
        exp_year: 2025,
      });
      expect(result[1]).toEqual({
        id: 'pm_456',
        brand: 'mastercard',
        last4: '5555',
        exp_month: 6,
        exp_year: 2026,
      });
    });

    it('should extract card brand, last4, expiry', async () => {
      const mockResponse = {
        paymentMethods: [
          {
            id: 'pm_amex',
            card: {
              brand: 'amex',
              last4: '0005',
              exp_month: 3,
              exp_year: 2027,
            },
          },
        ],
      };

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const result = await stripeService.listPaymentMethods('cus_123');

      expect(result[0].brand).toBe('amex');
      expect(result[0].last4).toBe('0005');
      expect(result[0].exp_month).toBe(3);
      expect(result[0].exp_year).toBe(2027);
    });

    it('should call with correct customerId', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { paymentMethods: [] },
        error: null,
      });

      await stripeService.listPaymentMethods('cus_specific');

      expect(supabase.functions.invoke).toHaveBeenCalledWith('list-payment-methods', {
        body: { customerId: 'cus_specific' },
      });
    });

    it('should throw on error', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: null,
        error: { message: 'Customer not found' },
      });

      await expect(
        stripeService.listPaymentMethods('cus_invalid')
      ).rejects.toThrow('Customer not found');
    });

    it('should return empty array for customer with no payment methods', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { paymentMethods: [] },
        error: null,
      });

      const result = await stripeService.listPaymentMethods('cus_new');

      expect(result).toEqual([]);
    });
  });

  describe('attachPaymentMethod', () => {
    it('should call with correct params', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { success: true },
        error: null,
      });

      await stripeService.attachPaymentMethod('pm_123', 'cus_456');

      expect(supabase.functions.invoke).toHaveBeenCalledWith('attach-payment-method', {
        body: { paymentMethodId: 'pm_123', customerId: 'cus_456' },
      });
    });

    it('should not throw on success', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { success: true },
        error: null,
      });

      await expect(
        stripeService.attachPaymentMethod('pm_123', 'cus_456')
      ).resolves.toBeUndefined();
    });

    it('should throw on error', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: null,
        error: { message: 'Payment method already attached' },
      });

      await expect(
        stripeService.attachPaymentMethod('pm_123', 'cus_456')
      ).rejects.toThrow('Payment method already attached');
    });

    it('should throw with default message when error has no message', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: null,
        error: {},
      });

      await expect(
        stripeService.attachPaymentMethod('pm_123', 'cus_456')
      ).rejects.toThrow('Failed to attach payment method');
    });
  });

  describe('detachPaymentMethod', () => {
    it('should call with correct params', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { success: true },
        error: null,
      });

      await stripeService.detachPaymentMethod('pm_123');

      expect(supabase.functions.invoke).toHaveBeenCalledWith('detach-payment-method', {
        body: { paymentMethodId: 'pm_123' },
      });
    });

    it('should not throw on success', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { success: true },
        error: null,
      });

      await expect(
        stripeService.detachPaymentMethod('pm_123')
      ).resolves.toBeUndefined();
    });

    it('should throw on error', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: null,
        error: { message: 'Payment method not found' },
      });

      await expect(
        stripeService.detachPaymentMethod('pm_invalid')
      ).rejects.toThrow('Payment method not found');
    });

    it('should throw with default message when error has no message', async () => {
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: null,
        error: {},
      });

      await expect(
        stripeService.detachPaymentMethod('pm_123')
      ).rejects.toThrow('Failed to detach payment method');
    });
  });
});
