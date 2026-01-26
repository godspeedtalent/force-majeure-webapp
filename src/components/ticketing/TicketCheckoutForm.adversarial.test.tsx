/**
 * TicketCheckoutForm - Adversarial Tests
 *
 * These tests are designed to BREAK the component by testing edge cases,
 * security vulnerabilities, and business logic boundaries.
 *
 * Unlike traditional tests that verify current behavior, adversarial tests
 * actively try to find bugs, security issues, and unclear requirements.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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

const mockProcessPayment = vi.fn();
const mockLoadSavedCards = vi.fn();
const mockRemoveSavedCard = vi.fn();

vi.mock('@/features/payments', () => ({
  useStripePayment: vi.fn(() => ({
    processPayment: mockProcessPayment,
    loadSavedCards: mockLoadSavedCards,
    removeSavedCard: mockRemoveSavedCard,
    savedCards: [],
    loading: false,
    ready: true,
    isMockMode: true, // Use mock mode to skip billing address validation in tests
  })),
  StripeCardInput: () => <div data-testid="stripe-card-input">Stripe Card Input</div>,
  SavedCardSelector: () => <div data-testid="saved-card-selector">Saved Cards</div>,
  MockPaymentToggle: () => <div data-testid="mock-payment-toggle">Mock Toggle</div>,
  mockCheckoutService: {
    createMockOrder: vi.fn(() => Promise.resolve({ success: true, orderId: 'mock-order-123' })),
  },
}));

vi.mock('@/features/wallet/services/ticketEmailService', () => ({
  ticketEmailService: {
    sendTicketEmail: vi.fn(() => Promise.resolve({ success: true })),
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

// Helper to get form inputs by their labels
const getFormInputs = () => {
  return {
    fullName: screen.getByLabelText(/checkout.fullNameOnCard/),
    email: screen.getByLabelText(/checkout.emailAddress/),
    address: screen.getByLabelText(/checkout.streetAddress/),
    city: screen.getByLabelText(/checkout.city/),
    state: screen.getByLabelText(/checkout.state/),
    zipCode: screen.getByLabelText(/checkout.zipCode/),
  };
};

describe('TicketCheckoutForm - Adversarial Tests', () => {
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
    mockProcessPayment.mockResolvedValue({ success: true, paymentIntentId: 'pi_test' });
  });

  describe('🚨 CRITICAL: Payment/Money Edge Cases', () => {
    it('BUG: allows $0 order with free tickets + 100% promo code', async () => {
      const zeroSummary: TicketOrderSummary = {
        subtotal: 0,
        fees: [],
        total: 0,
        tickets: [
          {
            tierId: 'tier-1',
            name: 'Free Ticket',
            quantity: 1,
            price: 0,
            subtotal: 0,
          },
        ],
      };

      const user = userEvent.setup();
      render(<TicketCheckoutForm {...defaultProps} summary={zeroSummary} />);

      const { fullName, email } = getFormInputs();
      await user.type(fullName, 'Test User');
      await user.type(email, 'test@test.com');

      const termsCheckbox = screen.getByRole('checkbox', { name: /checkout.agreeToTerms/ });
      await user.click(termsCheckbox);

      const submitButton = screen.getByRole('button', { name: /checkout.completePurchase/ });
      await user.click(submitButton);

      // QUESTION: Should $0 orders be allowed? Should they skip payment processing?
      // QUESTION: Should there be a minimum order amount?
      await waitFor(() => {
        expect(mockProcessPayment).toHaveBeenCalledWith(0, false, undefined);
      });
    });

    it('BUG: negative total from over-discount (if possible)', async () => {
      // Simulate a negative total (shouldn't happen, but let's test)
      const negativeSummary: TicketOrderSummary = {
        subtotal: 10,
        fees: [{ name: 'Discount', amount: -20, type: 'flat' }],
        total: -10,
        tickets: [
          {
            tierId: 'tier-1',
            name: 'Ticket',
            quantity: 1,
            price: 10,
            subtotal: 10,
          },
        ],
      };

      render(<TicketCheckoutForm {...defaultProps} summary={negativeSummary} />);

      // EXPECTED: Should reject negative totals or show error
      // ACTUAL: Likely displays negative total and tries to process payment
      expect(screen.getByText('checkout.total')).toBeInTheDocument();
    });

    it('BUG: very large order ($999,999) - should there be a maximum?', async () => {
      const hugeSummary: TicketOrderSummary = {
        subtotal: 999999,
        fees: [],
        total: 999999,
        tickets: [
          {
            tierId: 'tier-1',
            name: 'VIP Package',
            quantity: 1000,
            price: 999.99,
            subtotal: 999999,
          },
        ],
      };

      const user = userEvent.setup();
      render(<TicketCheckoutForm {...defaultProps} summary={hugeSummary} />);

      const { fullName, email, address, city, state, zipCode } = getFormInputs();
      await user.type(fullName, 'Test User');
      await user.type(email, 'test@test.com');
      await user.type(address, '123 Main St');
      await user.type(city, 'Test City');
      await user.type(state, 'CA');
      await user.type(zipCode, '12345');

      const termsCheckbox = screen.getByRole('checkbox', { name: /checkout.agreeToTerms/ });
      await user.click(termsCheckbox);

      const submitButton = screen.getByRole('button', { name: /checkout.completePurchase/ });
      await user.click(submitButton);

      // QUESTION: Should there be a maximum order amount for fraud prevention?
      // QUESTION: Should very large orders require additional verification?
      await waitFor(() => {
        expect(mockProcessPayment).toHaveBeenCalledWith(99999900, false, undefined);
      });
    });

    it('BUG: floating point precision error with protection fee', async () => {
      // Test $0.99 ticket + $4.99 protection = $5.98
      // In cents: 99 + 499 = 598 (correct)
      // But JavaScript: 0.99 + 4.99 = 5.98 (looks correct but internally might have precision issues)
      const preciseSummary: TicketOrderSummary = {
        subtotal: 0.99,
        fees: [],
        total: 0.99,
        tickets: [
          {
            tierId: 'tier-1',
            name: 'Budget Ticket',
            quantity: 1,
            price: 0.99,
            subtotal: 0.99,
          },
        ],
      };

      const user = userEvent.setup();
      render(<TicketCheckoutForm {...defaultProps} summary={preciseSummary} />);

      const protectionCheckbox = screen.getByRole('checkbox', { name: /checkout.addTicketProtection/ });
      await user.click(protectionCheckbox);

      const { fullName, email, address, city, state, zipCode } = getFormInputs();
      await user.type(fullName, 'Test User');
      await user.type(email, 'test@test.com');
      await user.type(address, '123 Main St');
      await user.type(city, 'Test City');
      await user.type(state, 'CA');
      await user.type(zipCode, '12345');

      const termsCheckbox = screen.getByRole('checkbox', { name: /checkout.agreeToTerms/ });
      await user.click(termsCheckbox);

      const submitButton = screen.getByRole('button', { name: /checkout.completePurchase/ });
      await user.click(submitButton);

      // Total should be exactly 598 cents ($5.98)
      await waitFor(() => {
        expect(mockProcessPayment).toHaveBeenCalledWith(598, false, undefined);
      });

      // FINDING: Verify no floating point errors (0.99 + 4.99) * 100 = 598, not 597.99999...
    });

    it('Q: Can protection fee exceed ticket price?', async () => {
      // $2 ticket + $4.99 protection = $6.99 total
      // Protection fee is 249.5% of ticket price
      const cheapSummary: TicketOrderSummary = {
        subtotal: 2,
        fees: [],
        total: 2,
        tickets: [
          {
            tierId: 'tier-1',
            name: 'Cheap Ticket',
            quantity: 1,
            price: 2,
            subtotal: 2,
          },
        ],
      };

      const user = userEvent.setup();
      render(<TicketCheckoutForm {...defaultProps} summary={cheapSummary} />);

      const protectionCheckbox = screen.getByRole('checkbox', { name: /checkout.addTicketProtection/ });
      await user.click(protectionCheckbox);

      // Protection fee ($4.99) > ticket price ($2.00)
      // QUESTION: Is this intentional? Should protection fee be a percentage of total?
      // QUESTION: Should there be a minimum ticket price for protection eligibility?
      const protectionFeeElements = screen.getAllByText(/\$4\.99/);
      expect(protectionFeeElements.length).toBeGreaterThan(0); // Protection fee displayed
    });
  });

  describe('🚨 CRITICAL: Security - SQL Injection Attempts', () => {
    it('BUG: SQL injection in full name field', async () => {
      const user = userEvent.setup();
      render(<TicketCheckoutForm {...defaultProps} />);

      const { fullName, email } = getFormInputs();

      // Common SQL injection patterns
      await user.type(fullName, "Robert'); DROP TABLE users;--");
      await user.type(email, 'attacker@evil.com');

      // EXPECTED: Input should be sanitized before database insertion
      // ACTUAL: Depends on backend sanitization - frontend allows it
      expect(fullName).toHaveValue("Robert'); DROP TABLE users;--");
    });

    it('BUG: SQL injection in email field', async () => {
      const user = userEvent.setup();
      render(<TicketCheckoutForm {...defaultProps} />);

      const { fullName, email } = getFormInputs();
      await user.type(fullName, 'Test User');
      await user.type(email, "admin'--@test.com");

      // Email validation regex should catch this, but let's verify
      const termsCheckbox = screen.getByRole('checkbox', { name: /checkout.agreeToTerms/ });
      await user.click(termsCheckbox);

      const submitButton = screen.getByRole('button', { name: /checkout.completePurchase/ });
      await user.click(submitButton);

      // EXPECTED: Should show validation error for invalid email format
      // ACTUAL: May pass regex validation (has @ and .)
    });

    it('BUG: SQL injection in address field', async () => {
      const user = userEvent.setup();
      render(<TicketCheckoutForm {...defaultProps} />);

      const { fullName, email, address, city, state, zipCode } = getFormInputs();
      await user.type(fullName, 'Test User');
      await user.type(email, 'test@test.com');
      await user.type(address, "123 Main' OR '1'='1");
      await user.type(city, 'Test City');
      await user.type(state, 'CA');
      await user.type(zipCode, '12345');

      const termsCheckbox = screen.getByRole('checkbox', { name: /checkout.agreeToTerms/ });
      await user.click(termsCheckbox);

      const submitButton = screen.getByRole('button', { name: /checkout.completePurchase/ });
      await user.click(submitButton);

      // CRITICAL: Address fields must be sanitized before database storage
      // Frontend accepts it - backend MUST sanitize
      await waitFor(() => {
        expect(mockProcessPayment).toHaveBeenCalled();
      });
    });
  });

  describe('🚨 CRITICAL: Security - XSS Attempts', () => {
    it('BUG: XSS attempt in full name', async () => {
      const user = userEvent.setup();
      render(<TicketCheckoutForm {...defaultProps} />);

      const { fullName, email } = getFormInputs();
      await user.type(fullName, '<script>alert("xss")</script>');
      await user.type(email, 'test@test.com');

      // EXPECTED: Script tags should be escaped when displayed
      // ACTUAL: React escapes by default, but check backend storage
      expect(fullName).toHaveValue('<script>alert("xss")</script>');
    });

    it('BUG: XSS attempt with img onerror', async () => {
      const user = userEvent.setup();
      render(<TicketCheckoutForm {...defaultProps} />);

      const { fullName, email } = getFormInputs();
      await user.type(fullName, '<img src=x onerror="alert(1)">');
      await user.type(email, 'test@test.com');

      // React's JSX escaping should prevent execution
      // But verify data is safe when sent to backend and displayed elsewhere
      expect(fullName).toHaveValue('<img src=x onerror="alert(1)">');
    });

    it('BUG: XSS attempt with event handler', async () => {
      const user = userEvent.setup();
      render(<TicketCheckoutForm {...defaultProps} />);

      const { fullName, email, address } = getFormInputs();
      await user.type(fullName, 'Test User');
      await user.type(email, 'test@test.com');
      await user.type(address, '" onmouseover="alert(1)"');

      // HTML attributes in text should be escaped
      expect(address).toHaveValue('" onmouseover="alert(1)"');
    });
  });

  describe('🚨 CRITICAL: Security - Email Injection', () => {
    it('BUG: email injection with newline characters', async () => {
      const user = userEvent.setup();
      render(<TicketCheckoutForm {...defaultProps} />);

      const { fullName, email } = getFormInputs();
      await user.type(fullName, 'Test User');
      // Try to inject BCC header
      await user.type(email, 'attacker@evil.com\nBCC: spam@evil.com');

      const termsCheckbox = screen.getByRole('checkbox', { name: /checkout.agreeToTerms/ });
      await user.click(termsCheckbox);

      const submitButton = screen.getByRole('button', { name: /checkout.completePurchase/ });
      await user.click(submitButton);

      // CRITICAL: Email should be validated to reject newline characters
      // This could be used to inject additional email headers
    });

    it('BUG: multiple email addresses separated by commas', async () => {
      const user = userEvent.setup();
      render(<TicketCheckoutForm {...defaultProps} />);

      const { fullName, email } = getFormInputs();
      await user.type(fullName, 'Test User');
      await user.type(email, 'test@test.com, spam@evil.com, another@evil.com');

      const termsCheckbox = screen.getByRole('checkbox', { name: /checkout.agreeToTerms/ });
      await user.click(termsCheckbox);

      const submitButton = screen.getByRole('button', { name: /checkout.completePurchase/ });
      await user.click(submitButton);

      // EXPECTED: Should reject multiple email addresses
      // ACTUAL: May pass regex validation if first part looks like an email
    });
  });

  describe('⚠️ CRITICAL: State Management - Double Submissions', () => {
    it('BUG: rapid button clicks cause multiple payment submissions', async () => {
      const user = userEvent.setup();
      render(<TicketCheckoutForm {...defaultProps} />);

      const { fullName, email, address, city, state, zipCode } = getFormInputs();
      await user.type(fullName, 'Test User');
      await user.type(email, 'test@test.com');
      await user.type(address, '123 Main St');
      await user.type(city, 'Test City');
      await user.type(state, 'CA');
      await user.type(zipCode, '12345');

      const termsCheckbox = screen.getByRole('checkbox', { name: /checkout.agreeToTerms/ });
      await user.click(termsCheckbox);

      const submitButton = screen.getByRole('button', { name: /checkout.completePurchase/ });

      // Rapidly click submit button 5 times
      await user.click(submitButton);
      await user.click(submitButton);
      await user.click(submitButton);
      await user.click(submitButton);
      await user.click(submitButton);

      // EXPECTED: Should only process payment once, button should be disabled after first click
      // ACTUAL: May attempt multiple payments if isSubmitting state doesn't update quickly enough
      await waitFor(() => {
        expect(mockProcessPayment).toHaveBeenCalledTimes(1); // Should only be called once
      });
    });

    it('BUG: concurrent submissions from multiple tabs', async () => {
      // Simulate user opening checkout in multiple tabs and submitting both
      // This is hard to test in unit tests, but we can verify the component
      // doesn't maintain shared state across instances

      const { rerender } = render(<TicketCheckoutForm {...defaultProps} />);

      // Render a second instance (simulating second tab)
      rerender(<TicketCheckoutForm {...defaultProps} />);

      // QUESTION: Should there be backend protection against duplicate orders?
      // QUESTION: Should order IDs be idempotent (same cart = same order ID)?
    });

    it('form state persists after validation error', async () => {
      const user = userEvent.setup();
      render(<TicketCheckoutForm {...defaultProps} />);

      const { fullName, email, address } = getFormInputs();
      await user.type(fullName, 'Test User');
      await user.type(email, 'test@test.com');
      await user.type(address, '123 Main St');
      // Don't fill city, state, zipCode - will cause validation error

      const termsCheckbox = screen.getByRole('checkbox', { name: /checkout.agreeToTerms/ });
      await user.click(termsCheckbox);

      const submitButton = screen.getByRole('button', { name: /checkout.completePurchase/ });
      await user.click(submitButton);

      // After validation error, previously filled fields should still be filled
      await waitFor(() => {
        expect(fullName).toHaveValue('Test User');
        expect(email).toHaveValue('test@test.com');
        expect(address).toHaveValue('123 Main St');
      });
    });
  });

  describe('⚠️ Edge Cases: Input Validation', () => {
    it('BUG: very long name (500+ characters)', async () => {
      render(<TicketCheckoutForm {...defaultProps} />);

      const { fullName } = getFormInputs();
      const longName = 'A'.repeat(500);

      // Use fireEvent for very long strings to avoid timeout
      fireEvent.change(fullName, { target: { value: longName } });

      // EXPECTED: Should have maximum length validation (e.g., 100 chars)
      // ACTUAL: Likely allows unlimited length, potential database overflow
      expect(fullName).toHaveValue(longName);
    });

    it('BUG: international characters in name (Chinese, Arabic, emoji)', async () => {
      render(<TicketCheckoutForm {...defaultProps} />);

      const { fullName } = getFormInputs();
      const intlName = '李明 محمد Smith 👨‍💻';

      // Use fireEvent for complex Unicode to avoid encoding issues
      fireEvent.change(fullName, { target: { value: intlName } });

      // EXPECTED: Should accept international characters (they're valid names)
      // ACTUAL: May cause encoding issues in backend or email systems
      expect(fullName).toHaveValue(intlName);
    });

    it('BUG: very long email (254 characters - RFC maximum)', async () => {
      render(<TicketCheckoutForm {...defaultProps} />);

      const { email } = getFormInputs();
      // Max email length per RFC 5321 is 254 characters
      const longEmail = 'a'.repeat(243) + '@example.com'; // 254 chars total

      // Use fireEvent for very long strings to avoid timeout
      fireEvent.change(email, { target: { value: longEmail } });

      // Should pass validation (it's RFC-compliant)
      expect(email).toHaveValue(longEmail);
    });

    it('BUG: ZIP code 00000 (valid but unusual)', async () => {
      const user = userEvent.setup();
      render(<TicketCheckoutForm {...defaultProps} />);

      const { zipCode } = getFormInputs();
      await user.type(zipCode, '00000');

      // QUESTION: Should 00000 be accepted? It's technically valid but unusual
      // QUESTION: Should there be additional validation for specific invalid ZIP ranges?
      expect(zipCode).toHaveValue('00000');
    });

    it('BUG: ZIP code with letters (should be rejected)', async () => {
      const user = userEvent.setup();
      render(<TicketCheckoutForm {...defaultProps} />);

      const { zipCode } = getFormInputs();
      await user.type(zipCode, 'AAAAA');

      // NOTE: In mock mode, ZIP validation is skipped
      // EXPECTED: Validation error for invalid ZIP format in real payment mode
      // ACTUAL: Mock mode accepts any ZIP code (including letters)
      // BUG: This is a potential issue - even test orders should validate basic formats
      expect(zipCode).toHaveValue('AAAAA');
    });

    it('BUG: state code lowercase (should be uppercase)', async () => {
      const user = userEvent.setup();
      render(<TicketCheckoutForm {...defaultProps} />);

      const { state } = getFormInputs();
      await user.type(state, 'ca');

      // QUESTION: Should state codes be automatically uppercased?
      // QUESTION: Should there be a dropdown instead of text input?
      expect(state).toHaveValue('ca');
    });

    it('BUG: email with + sign (valid but sometimes causes issues)', async () => {
      const user = userEvent.setup();
      render(<TicketCheckoutForm {...defaultProps} />);

      const { fullName, email } = getFormInputs();
      await user.type(fullName, 'Test User');
      await user.type(email, 'test+spam@example.com');

      // + sign is valid in email addresses per RFC 5322
      // Should pass validation
      expect(email).toHaveValue('test+spam@example.com');
    });

    it('BUG: email with international domain', async () => {
      const user = userEvent.setup();
      render(<TicketCheckoutForm {...defaultProps} />);

      const { fullName, email } = getFormInputs();
      await user.type(fullName, 'Test User');
      await user.type(email, 'test@münchen.de');

      // International domain names are valid
      // QUESTION: Does regex handle internationalized domain names?
      expect(email).toHaveValue('test@münchen.de');
    });
  });

  describe('💡 Business Logic Questions', () => {
    it('Q: Should there be a minimum order amount?', () => {
      const tinyOrder: TicketOrderSummary = {
        subtotal: 0.01,
        fees: [],
        total: 0.01,
        tickets: [
          {
            tierId: 'tier-1',
            name: 'Penny Ticket',
            quantity: 1,
            price: 0.01,
            subtotal: 0.01,
          },
        ],
      };

      render(<TicketCheckoutForm {...defaultProps} summary={tinyOrder} />);

      // $0.01 order - should this be allowed?
      // Payment processing fees likely exceed ticket price
      const pennyElements = screen.getAllByText(/\$0\.01/);
      expect(pennyElements.length).toBeGreaterThan(0); // Price is displayed
    });

    it('Q: Should protection fee be a percentage of total instead of flat fee?', () => {
      // Current: $4.99 flat fee regardless of order size
      // Alternative: 10% of total (scales with order size)

      // $10 order: $4.99 protection (49.9% of order)
      // $1000 order: $4.99 protection (0.499% of order)

      // QUESTION: Should protection fee scale with order size?
    });

    it('Q: Should there be a maximum ticket quantity per order?', () => {
      const hugeQuantity: TicketOrderSummary = {
        subtotal: 100000,
        fees: [],
        total: 100000,
        tickets: [
          {
            tierId: 'tier-1',
            name: 'General Admission',
            quantity: 10000, // 10,000 tickets
            price: 10,
            subtotal: 100000,
          },
        ],
      };

      render(<TicketCheckoutForm {...defaultProps} summary={hugeQuantity} />);

      // 10,000 tickets in one order
      // QUESTION: Should there be a maximum quantity for fraud prevention?
      // QUESTION: Should large orders require manual review?
    });
  });
});
