export interface SavedCard {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  is_default?: boolean;
}

export interface PaymentIntent {
  clientSecret: string;
  paymentIntentId: string;
}

export interface PaymentResult {
  success: boolean;
  paymentMethodId?: string;
  error?: string;
}

export interface StripeCustomer {
  customerId: string;
  email: string;
}

export interface PaymentMethodAttachment {
  success: boolean;
  paymentMethodId: string;
}
