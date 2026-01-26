/**
 * TicketCheckoutForm Tests
 *
 * Tests for the ticket checkout form component, including validation,
 * payment processing, and order creation flows.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TicketCheckoutForm, type TicketOrderSummary } from './TicketCheckoutForm';

// Mock dependencies
vi.mock('@/features/auth/services/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: null,
    updateProfile: vi.fn(),
  })),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(() => vi.fn()),
}));

vi.mock('@/features/payments', () => ({
  useStripePayment: vi.fn(() => ({
    processPayment: vi.fn(),
    loadSavedCards: vi.fn(),
    removeSavedCard: vi.fn(),
    savedCards: [],
    loading: false,
    ready: true,
    isMockMode: false,
  })),
  StripeCardInput: () => <div data-testid="stripe-card-input">Stripe Card Input</div>,
  SavedCardSelector: () => <div data-testid="saved-card-selector">Saved Cards</div>,
  MockPaymentToggle: () => <div data-testid="mock-payment-toggle">Mock Toggle</div>,
  mockCheckoutService: {
    createMockOrder: vi.fn(),
  },
}));

vi.mock('@/features/wallet/services/ticketEmailService', () => ({
  ticketEmailService: {
    sendTicketEmail: vi.fn(),
  },
}));

vi.mock('./TermsAndConditionsModal', () => ({
  TermsAndConditionsModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="terms-modal">Terms Modal</div> : null,
}));

vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-i18next')>();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
      i18n: {
        language: 'en',
        changeLanguage: vi.fn(),
      },
    }),
  };
});

const mockSummary: TicketOrderSummary = {
  subtotal: 100,
  fees: [
    { name: 'Service Fee', amount: 10, type: 'percentage' as const, value: 10 },
  ],
  total: 110,
  tickets: [
    {
      tierId: 'tier-1',
      name: 'General Admission',
      quantity: 2,
      price: 50,
      subtotal: 100,
    },
  ],
};

describe('TicketCheckoutForm', () => {
  const defaultProps = {
    eventId: 'event-123',
    eventName: 'Test Event',
    eventDate: '2026-02-01',
    summary: mockSummary,
    onBack: vi.fn(),
    onComplete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the checkout form with event details', () => {
      render(<TicketCheckoutForm {...defaultProps} />);

      expect(screen.getByText('Test Event')).toBeInTheDocument();
      expect(screen.getByText('2026-02-01')).toBeInTheDocument();
      expect(screen.getByText('checkout.paymentDetails')).toBeInTheDocument();
      expect(screen.getByText('checkout.billingAddress')).toBeInTheDocument();
    });

    it('renders the secure checkout header by default', () => {
      render(<TicketCheckoutForm {...defaultProps} />);
      expect(screen.getByText('checkout.secureCheckout')).toBeInTheDocument();
    });

    it('hides the secure checkout header when prop is false', () => {
      render(<TicketCheckoutForm {...defaultProps} showSecureCheckoutHeader={false} />);
      expect(screen.queryByText('checkout.secureCheckout')).not.toBeInTheDocument();
    });

    it('displays order summary with ticket details', () => {
      render(<TicketCheckoutForm {...defaultProps} />);

      expect(screen.getByText('General Admission')).toBeInTheDocument();
      expect(screen.getByText('2 × $50.00')).toBeInTheDocument();
      expect(screen.getByText('Service Fee')).toBeInTheDocument();
    });

    it('shows sign-in CTA for non-authenticated users', () => {
      render(<TicketCheckoutForm {...defaultProps} />);
      expect(screen.getByText('checkout.signInForFasterCheckout')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('validates required full name field', async () => {
      const user = userEvent.setup();
      render(<TicketCheckoutForm {...defaultProps} />);

      // Accept terms to enable submit button - get by ID
      const termsCheckbox = document.getElementById('agreeToTerms');
      if (termsCheckbox) await user.click(termsCheckbox);

      const submitButton = screen.getByRole('button', { name: /checkout.completePurchase/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('checkout.validation.fullNameRequired')).toBeInTheDocument();
      });
    });

    it('validates required email field', async () => {
      const user = userEvent.setup();
      render(<TicketCheckoutForm {...defaultProps} />);

      // Fill in all fields except email to test email is required
      await user.type(screen.getByLabelText('checkout.fullNameOnCard'), 'John Doe');
      // Intentionally skip email
      await user.type(screen.getByLabelText('checkout.streetAddress'), '123 Main St');
      await user.type(screen.getByLabelText('checkout.city'), 'New York');
      await user.type(screen.getByLabelText('checkout.state'), 'NY');
      await user.type(screen.getByLabelText('checkout.zipCode'), '10001');

      // Accept terms to enable submit button
      const termsCheckbox = document.getElementById('agreeToTerms');
      if (termsCheckbox) await user.click(termsCheckbox);

      const submitButton = screen.getByRole('button', { name: /checkout.completePurchase/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('checkout.validation.validEmailRequired')).toBeInTheDocument();
      });
    });

    it('validates ZIP code format', async () => {
      const user = userEvent.setup();
      render(<TicketCheckoutForm {...defaultProps} />);

      const fullNameInput = screen.getByLabelText('checkout.fullNameOnCard');
      await user.type(fullNameInput, 'John Doe');

      const emailInput = screen.getByLabelText('checkout.emailAddress');
      await user.type(emailInput, 'john@example.com');

      const zipInput = screen.getByLabelText('checkout.zipCode');
      await user.type(zipInput, 'invalid');

      // Accept terms to enable submit button
      const termsCheckbox = document.getElementById('agreeToTerms');
      if (termsCheckbox) await user.click(termsCheckbox);

      const submitButton = screen.getByRole('button', { name: /checkout.completePurchase/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('checkout.validation.validZipRequired')).toBeInTheDocument();
      });
    });

    it('requires terms acceptance before submission', () => {
      render(<TicketCheckoutForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /checkout.completePurchase/ });

      // Button should be disabled when terms not accepted
      expect(submitButton).toBeDisabled();
    });

    it('clears error when user corrects field', async () => {
      const user = userEvent.setup();
      render(<TicketCheckoutForm {...defaultProps} />);

      // Accept terms to enable submit button
      const termsCheckbox = document.getElementById('agreeToTerms');
      if (termsCheckbox) await user.click(termsCheckbox);

      // Trigger validation
      const submitButton = screen.getByRole('button', { name: /checkout.completePurchase/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('checkout.validation.fullNameRequired')).toBeInTheDocument();
      });

      // Correct the field
      const fullNameInput = screen.getByLabelText('checkout.fullNameOnCard');
      await user.type(fullNameInput, 'John Doe');

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText('checkout.validation.fullNameRequired')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Interactions', () => {
    it('allows user to fill out all fields', async () => {
      const user = userEvent.setup();
      render(<TicketCheckoutForm {...defaultProps} />);

      await user.type(screen.getByLabelText('checkout.fullNameOnCard'), 'John Doe');
      await user.type(screen.getByLabelText('checkout.emailAddress'), 'john@example.com');
      await user.type(screen.getByLabelText('checkout.streetAddress'), '123 Main St');
      await user.type(screen.getByLabelText('checkout.city'), 'New York');
      await user.type(screen.getByLabelText('checkout.state'), 'NY');
      await user.type(screen.getByLabelText('checkout.zipCode'), '10001');

      expect(screen.getByLabelText('checkout.fullNameOnCard')).toHaveValue('John Doe');
      expect(screen.getByLabelText('checkout.emailAddress')).toHaveValue('john@example.com');
      expect(screen.getByLabelText('checkout.streetAddress')).toHaveValue('123 Main St');
      expect(screen.getByLabelText('checkout.city')).toHaveValue('New York');
      expect(screen.getByLabelText('checkout.state')).toHaveValue('NY');
      expect(screen.getByLabelText('checkout.zipCode')).toHaveValue('10001');
    });

    it('toggles ticket protection and updates total', async () => {
      const user = userEvent.setup();
      render(<TicketCheckoutForm {...defaultProps} />);

      const protectionCheckbox = screen.getByLabelText('checkout.addTicketProtection');
      await user.click(protectionCheckbox);

      expect(protectionCheckbox).toBeChecked();
      // Total should now include protection fee (110 + 4.99 = 114.99)
      await waitFor(() => {
        const total = screen.getByText('checkout.total').parentElement;
        expect(total).toHaveTextContent('$114.99');
      });
    });

    it('toggles SMS notifications checkbox', async () => {
      const user = userEvent.setup();
      render(<TicketCheckoutForm {...defaultProps} />);

      const smsCheckbox = screen.getByLabelText('checkout.smsNotifications');
      await user.click(smsCheckbox);

      expect(smsCheckbox).toBeChecked();
    });

    it('opens terms modal when terms link is clicked', async () => {
      const user = userEvent.setup();
      render(<TicketCheckoutForm {...defaultProps} />);

      const termsLink = screen.getByText('checkout.termsAndConditions');
      await user.click(termsLink);

      await waitFor(() => {
        expect(screen.getByTestId('terms-modal')).toBeInTheDocument();
      });
    });
  });

  describe('Back Navigation', () => {
    it('calls onBack when back button is clicked', async () => {
      const user = userEvent.setup();
      const onBack = vi.fn();
      render(<TicketCheckoutForm {...defaultProps} onBack={onBack} />);

      const backButton = screen.getByRole('button', { name: /checkout.backToTickets/ });
      await user.click(backButton);

      expect(onBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('Ticket Protection', () => {
    it('displays ticket protection option with fee', () => {
      render(<TicketCheckoutForm {...defaultProps} />);

      // Check for ticket protection section header
      const protectionHeaders = screen.getAllByText('checkout.ticketProtection');
      expect(protectionHeaders.length).toBeGreaterThan(0);

      expect(screen.getByText('+$4.99')).toBeInTheDocument();
      expect(screen.getByText('checkout.ticketProtectionDescription')).toBeInTheDocument();
    });

    it('includes protection fee in total when selected', async () => {
      const user = userEvent.setup();
      render(<TicketCheckoutForm {...defaultProps} />);

      // Initial total - verify checkout.total section shows $110.00
      const initialTotal = screen.getByText('checkout.total').parentElement;
      expect(initialTotal).toHaveTextContent('$110.00');

      // Enable protection
      const protectionCheckbox = screen.getByLabelText('checkout.addTicketProtection');
      await user.click(protectionCheckbox);

      // Total should update to include protection fee
      await waitFor(() => {
        const updatedTotal = screen.getByText('checkout.total').parentElement;
        expect(updatedTotal).toHaveTextContent('$114.99');
      });
    });
  });

  describe('State Limiting', () => {
    it('limits state input to 2 characters', async () => {
      render(<TicketCheckoutForm {...defaultProps} />);

      const stateInput = screen.getByLabelText('checkout.state') as HTMLInputElement;

      // Should only accept first 2 characters
      expect(stateInput.maxLength).toBe(2);
    });

    it('limits ZIP code input to 10 characters', async () => {
      render(<TicketCheckoutForm {...defaultProps} />);

      const zipInput = screen.getByLabelText('checkout.zipCode') as HTMLInputElement;

      expect(zipInput.maxLength).toBe(10);
    });
  });

  describe('Order Summary Display', () => {
    it('displays all ticket types with quantities and prices', () => {
      render(<TicketCheckoutForm {...defaultProps} />);

      expect(screen.getByText('General Admission')).toBeInTheDocument();
      expect(screen.getByText('2 × $50.00')).toBeInTheDocument();
      // $100.00 appears multiple times (subtotal and ticket total), so we just check it exists
      const amounts = screen.getAllByText('$100.00');
      expect(amounts.length).toBeGreaterThan(0);
    });

    it('displays all fees', () => {
      render(<TicketCheckoutForm {...defaultProps} />);

      expect(screen.getByText('Service Fee')).toBeInTheDocument();
      // Verify fee amount is displayed
      const feeAmounts = screen.getAllByText('$10.00');
      expect(feeAmounts.length).toBeGreaterThan(0);
    });

    it('displays subtotal and total', () => {
      render(<TicketCheckoutForm {...defaultProps} />);

      expect(screen.getByText('checkout.subtotal')).toBeInTheDocument();
      expect(screen.getByText('checkout.total')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('associates labels with form inputs', () => {
      render(<TicketCheckoutForm {...defaultProps} />);

      expect(screen.getByLabelText('checkout.fullNameOnCard')).toBeInTheDocument();
      expect(screen.getByLabelText('checkout.emailAddress')).toBeInTheDocument();
      expect(screen.getByLabelText('checkout.streetAddress')).toBeInTheDocument();
      expect(screen.getByLabelText('checkout.city')).toBeInTheDocument();
      expect(screen.getByLabelText('checkout.state')).toBeInTheDocument();
      expect(screen.getByLabelText('checkout.zipCode')).toBeInTheDocument();
    });

    it('disables submit button when terms not accepted', () => {
      render(<TicketCheckoutForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', {
        name: /checkout.completePurchase/,
      }) as HTMLButtonElement;

      // Button should be disabled when terms are not accepted
      expect(submitButton.disabled).toBe(true);
    });

    it('enables submit button when terms are accepted', async () => {
      const user = userEvent.setup();
      render(<TicketCheckoutForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', {
        name: /checkout.completePurchase/,
      }) as HTMLButtonElement;

      // Initially disabled
      expect(submitButton.disabled).toBe(true);

      // Accept terms
      const termsCheckbox = document.getElementById('agreeToTerms');
      if (termsCheckbox) await user.click(termsCheckbox);

      // Should now be enabled
      await waitFor(() => {
        expect(submitButton.disabled).toBe(false);
      });
    });
  });

  describe('Stripe Integration', () => {
    it('renders Stripe card input', () => {
      render(<TicketCheckoutForm {...defaultProps} />);

      expect(screen.getByTestId('stripe-card-input')).toBeInTheDocument();
    });

    it('renders mock payment toggle', () => {
      render(<TicketCheckoutForm {...defaultProps} />);

      expect(screen.getByTestId('mock-payment-toggle')).toBeInTheDocument();
    });
  });
});
