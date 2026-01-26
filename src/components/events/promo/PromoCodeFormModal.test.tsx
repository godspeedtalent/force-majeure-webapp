/**
 * PromoCodeFormModal Tests
 *
 * Tests for the promo code form modal, including validation,
 * code generation, scope selection, and submission flows.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PromoCodeFormModal } from './PromoCodeFormModal';
import type { PromoCode } from '@/shared/types/promoCode';

// Mock dependencies
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

// Note: generatePromoCode is a local function in the component, not imported

const mockTicketGroups = [
  {
    id: 'group-1',
    name: 'General Admission',
    color: '#ffffff',
  },
  {
    id: 'group-2',
    name: 'VIP',
    color: '#ffd700',
  },
];

const mockTicketTiers = [
  {
    id: 'tier-1',
    name: 'Early Bird',
    groupName: 'General Admission',
  },
  {
    id: 'tier-2',
    name: 'Regular',
    groupName: 'General Admission',
  },
];

const mockPromoCode: PromoCode = {
  id: 'promo-1',
  code: 'EARLYBIRD',
  discount_type: 'percentage',
  discount_value: 1000, // 10% in cents
  is_active: true,
  expires_at: '2026-03-01T00:00:00Z',
  application_scope: 'all_tickets',
  applies_to_order: false,
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
};

// Helper function to get inputs by their position
const getFormInputs = () => {
  const textInputs = screen.getAllByRole('textbox');
  const numberInputs = screen.getAllByRole('spinbutton');

  return {
    codeInput: textInputs[0], // First textbox is the code input
    discountInput: numberInputs[0], // First spinbutton is the discount value
  };
};

describe('PromoCodeFormModal', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    onSubmit: vi.fn(),
    isSubmitting: false,
    eventId: 'event-1',
    ticketGroups: mockTicketGroups,
    ticketTiers: mockTicketTiers,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the modal with create mode title', () => {
      render(<PromoCodeFormModal {...defaultProps} />);

      expect(screen.getByText('promoCodes.createNew')).toBeInTheDocument();
    });

    it('renders the modal with edit mode title when editing', () => {
      render(<PromoCodeFormModal {...defaultProps} editingCode={mockPromoCode} />);

      expect(screen.getByText('promoCodes.editCode')).toBeInTheDocument();
    });

    it('renders all form fields', () => {
      render(<PromoCodeFormModal {...defaultProps} />);

      expect(screen.getByText('promoCodes.code')).toBeInTheDocument();
      expect(screen.getByText('promoCodes.type')).toBeInTheDocument();
      expect(screen.getByText('promoCodes.discount')).toBeInTheDocument();
      expect(screen.getByText('promoCodes.expiresAt')).toBeInTheDocument();
      expect(screen.getByText('promoCodes.applicationScope')).toBeInTheDocument();
    });

    it('renders generate code button', () => {
      render(<PromoCodeFormModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: /promoCodes.generate/ })).toBeInTheDocument();
    });

    it('does not render the modal when open is false', () => {
      render(<PromoCodeFormModal {...defaultProps} open={false} />);

      expect(screen.queryByText('promoCodes.createNew')).not.toBeInTheDocument();
    });
  });

  describe('Code Generation', () => {
    it('generates a promo code when generate button is clicked', async () => {
      const user = userEvent.setup();
      render(<PromoCodeFormModal {...defaultProps} />);

      const { codeInput } = getFormInputs();
      expect(codeInput).toHaveValue('');

      const generateButton = screen.getByRole('button', { name: /promoCodes.generate/ });
      await user.click(generateButton);

      // Verify a code was generated (should be 8 characters long based on implementation)
      await waitFor(() => {
        const value = (codeInput as HTMLInputElement).value;
        expect(value).toMatch(/^[A-Z0-9]{8}$/);
        expect(value).toHaveLength(8);
      });
    });

    it('allows manual code entry', async () => {
      const user = userEvent.setup();
      render(<PromoCodeFormModal {...defaultProps} />);

      const { codeInput } = getFormInputs();
      await user.type(codeInput, 'CUSTOM2026');

      expect(codeInput).toHaveValue('CUSTOM2026');
    });
  });

  describe('Discount Type Selection', () => {
    it('defaults to percentage discount', () => {
      render(<PromoCodeFormModal {...defaultProps} />);

      const percentageButton = screen.getByRole('button', { name: /promoCodes.percentage/ });
      expect(percentageButton).toHaveClass('border-fm-gold', 'bg-fm-gold/20', 'text-fm-gold');
    });

    it('allows selecting flat discount', async () => {
      const user = userEvent.setup();
      render(<PromoCodeFormModal {...defaultProps} />);

      const flatButton = screen.getByRole('button', { name: /promoCodes.flat/ });
      await user.click(flatButton);

      expect(flatButton).toHaveClass('border-fm-gold', 'bg-fm-gold/20', 'text-fm-gold');
    });

    it('allows switching between percentage and flat', async () => {
      const user = userEvent.setup();
      render(<PromoCodeFormModal {...defaultProps} />);

      const flatButton = screen.getByRole('button', { name: /promoCodes.flat/ });
      const percentageButton = screen.getByRole('button', { name: /promoCodes.percentage/ });

      // Initially percentage is selected
      expect(percentageButton).toHaveClass('border-fm-gold');

      // Click flat
      await user.click(flatButton);
      expect(flatButton).toHaveClass('border-fm-gold');

      // Click percentage again
      await user.click(percentageButton);
      expect(percentageButton).toHaveClass('border-fm-gold');
    });
  });

  describe('Discount Value Input', () => {
    it('allows entering discount value', async () => {
      const user = userEvent.setup();
      render(<PromoCodeFormModal {...defaultProps} />);

      const { discountInput } = getFormInputs();
      await user.type(discountInput, '15');

      expect(discountInput).toHaveValue(15);
    });

    it('converts flat discount value to cents on submission', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<PromoCodeFormModal {...defaultProps} onSubmit={onSubmit} />);

      // Fill required fields
      const { codeInput, discountInput } = getFormInputs();
      await user.type(codeInput, 'TEST2026');

      // Switch to flat discount
      const flatButton = screen.getByRole('button', { name: /promoCodes.flat/ });
      await user.click(flatButton);

      await user.type(discountInput, '10');

      const submitButton = screen.getByRole('button', { name: /buttons.create/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            discount_type: 'flat',
            discount_value: 1000, // 10 * 100
          })
        );
      });
    });
  });

  describe('Application Scope Selection', () => {
    it('defaults to all tickets scope', () => {
      render(<PromoCodeFormModal {...defaultProps} />);

      const allTicketsButton = screen.getByRole('button', { name: /promoCodes.scope.allTickets/ });
      expect(allTicketsButton).toHaveClass('border-fm-gold', 'bg-fm-gold/20', 'text-fm-gold');
    });

    it('allows selecting specific groups scope', async () => {
      const user = userEvent.setup();
      render(<PromoCodeFormModal {...defaultProps} />);

      const groupsButton = screen.getByRole('button', { name: /promoCodes.scope.specificGroups/ });
      await user.click(groupsButton);

      expect(groupsButton).toHaveClass('border-fm-gold', 'bg-fm-gold/20', 'text-fm-gold');
    });

    it('shows group selection when specific groups scope is selected', async () => {
      const user = userEvent.setup();
      render(<PromoCodeFormModal {...defaultProps} />);

      const groupsButton = screen.getByRole('button', { name: /promoCodes.scope.specificGroups/ });
      await user.click(groupsButton);

      await waitFor(() => {
        expect(screen.getByText('General Admission')).toBeInTheDocument();
        expect(screen.getByText('VIP')).toBeInTheDocument();
      });
    });

    it('shows tier selection when specific tiers scope is selected', async () => {
      const user = userEvent.setup();
      render(<PromoCodeFormModal {...defaultProps} />);

      const tiersButton = screen.getByRole('button', { name: /promoCodes.scope.specificTiers/ });
      await user.click(tiersButton);

      await waitFor(() => {
        expect(screen.getByText('Early Bird')).toBeInTheDocument();
        expect(screen.getByText('Regular')).toBeInTheDocument();
      });
    });
  });

  describe('Group/Tier Selection', () => {
    it('allows selecting multiple groups', async () => {
      const user = userEvent.setup();
      render(<PromoCodeFormModal {...defaultProps} />);

      // Change scope to specific groups
      const groupsButton = screen.getByRole('button', { name: /promoCodes.scope.specificGroups/ });
      await user.click(groupsButton);

      // Select groups
      await waitFor(() => {
        expect(screen.getByText('General Admission')).toBeInTheDocument();
      });

      const gaCheckbox = screen.getByRole('checkbox', { name: /General Admission/ });
      const vipCheckbox = screen.getByRole('checkbox', { name: /VIP/ });

      await user.click(gaCheckbox);
      await user.click(vipCheckbox);

      expect(gaCheckbox).toBeChecked();
      expect(vipCheckbox).toBeChecked();
    });

    it('allows selecting multiple tiers', async () => {
      const user = userEvent.setup();
      render(<PromoCodeFormModal {...defaultProps} />);

      // Change scope to specific tiers
      const tiersButton = screen.getByRole('button', { name: /promoCodes.scope.specificTiers/ });
      await user.click(tiersButton);

      // Select tiers
      await waitFor(() => {
        expect(screen.getByText('Early Bird')).toBeInTheDocument();
      });

      const earlyBirdCheckbox = screen.getByRole('checkbox', { name: /Early Bird/ });
      const regularCheckbox = screen.getByRole('checkbox', { name: /Regular/ });

      await user.click(earlyBirdCheckbox);
      await user.click(regularCheckbox);

      expect(earlyBirdCheckbox).toBeChecked();
      expect(regularCheckbox).toBeChecked();
    });
  });

  describe('Validation', () => {
    it('disables submit button when code is empty', () => {
      render(<PromoCodeFormModal {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /buttons.create/ });
      expect(submitButton).toBeDisabled();
    });

    it('disables submit button when discount value is zero', async () => {
      const user = userEvent.setup();
      render(<PromoCodeFormModal {...defaultProps} />);

      const { codeInput, discountInput } = getFormInputs();
      await user.type(codeInput, 'TEST2026');
      await user.clear(discountInput);
      await user.type(discountInput, '0');

      const submitButton = screen.getByRole('button', { name: /buttons.create/ });
      expect(submitButton).toBeDisabled();
    });

    it('disables submit button when specific groups scope selected but no groups chosen', async () => {
      const user = userEvent.setup();
      render(<PromoCodeFormModal {...defaultProps} />);

      const { codeInput, discountInput } = getFormInputs();
      await user.type(codeInput, 'TEST2026');
      await user.type(discountInput, '10');

      const groupsButton = screen.getByRole('button', { name: /promoCodes.scope.specificGroups/ });
      await user.click(groupsButton);

      const submitButton = screen.getByRole('button', { name: /buttons.create/ });
      expect(submitButton).toBeDisabled();
    });

    it('disables submit button when specific tiers scope selected but no tiers chosen', async () => {
      const user = userEvent.setup();
      render(<PromoCodeFormModal {...defaultProps} />);

      const { codeInput, discountInput } = getFormInputs();
      await user.type(codeInput, 'TEST2026');
      await user.type(discountInput, '10');

      const tiersButton = screen.getByRole('button', { name: /promoCodes.scope.specificTiers/ });
      await user.click(tiersButton);

      const submitButton = screen.getByRole('button', { name: /buttons.create/ });
      expect(submitButton).toBeDisabled();
    });

    it('enables submit button when all required fields are valid', async () => {
      const user = userEvent.setup();
      render(<PromoCodeFormModal {...defaultProps} />);

      const { codeInput, discountInput } = getFormInputs();
      await user.type(codeInput, 'TEST2026');
      await user.type(discountInput, '10');

      const submitButton = screen.getByRole('button', { name: /buttons.create/ });

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe('Submission', () => {
    it('calls onSubmit with correct data in create mode', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<PromoCodeFormModal {...defaultProps} onSubmit={onSubmit} />);

      const { codeInput, discountInput } = getFormInputs();
      await user.type(codeInput, 'TEST2026');
      await user.type(discountInput, '15');

      const submitButton = screen.getByRole('button', { name: /buttons.create/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            code: 'TEST2026',
            discount_type: 'percentage',
            discount_value: 15, // Percentage is not converted to cents
            event_id: 'event-1',
            application_scope: 'all_tickets',
            applies_to_order: false,
            group_ids: [],
            tier_ids: [],
          })
        );
      });
    });

    it('calls onSubmit with correct data in edit mode', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(
        <PromoCodeFormModal
          {...defaultProps}
          editingCode={mockPromoCode}
          onSubmit={onSubmit}
        />
      );

      const { discountInput } = getFormInputs();
      await user.clear(discountInput);
      await user.type(discountInput, '20');

      const submitButton = screen.getByRole('button', { name: /buttons.save/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'promo-1',
            discount_value: 20, // Percentage is not converted
          })
        );
      });
    });

    it('disables submit button when isSubmitting is true', () => {
      render(<PromoCodeFormModal {...defaultProps} isSubmitting={true} />);

      const submitButton = screen.getByRole('button', { name: /buttons.create/ });
      expect(submitButton).toBeDisabled();
    });

    it('includes selected group IDs when specific groups scope is used', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<PromoCodeFormModal {...defaultProps} onSubmit={onSubmit} />);

      const { codeInput, discountInput } = getFormInputs();
      await user.type(codeInput, 'TEST2026');
      await user.type(discountInput, '10');

      const groupsButton = screen.getByRole('button', { name: /promoCodes.scope.specificGroups/ });
      await user.click(groupsButton);

      await waitFor(() => {
        expect(screen.getByText('General Admission')).toBeInTheDocument();
      });

      const gaCheckbox = screen.getByRole('checkbox', { name: /General Admission/ });
      await user.click(gaCheckbox);

      const submitButton = screen.getByRole('button', { name: /buttons.create/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            application_scope: 'specific_groups',
            group_ids: ['group-1'],
            tier_ids: [],
          })
        );
      });
    });

    it('includes selected tier IDs when specific tiers scope is used', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<PromoCodeFormModal {...defaultProps} onSubmit={onSubmit} />);

      const { codeInput, discountInput } = getFormInputs();
      await user.type(codeInput, 'TEST2026');
      await user.type(discountInput, '10');

      const tiersButton = screen.getByRole('button', { name: /promoCodes.scope.specificTiers/ });
      await user.click(tiersButton);

      await waitFor(() => {
        expect(screen.getByText('Early Bird')).toBeInTheDocument();
      });

      const earlyBirdCheckbox = screen.getByRole('checkbox', { name: /Early Bird/ });
      await user.click(earlyBirdCheckbox);

      const submitButton = screen.getByRole('button', { name: /buttons.create/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            application_scope: 'specific_tiers',
            group_ids: [],
            tier_ids: ['tier-1'],
          })
        );
      });
    });
  });

  describe('Edit Mode', () => {
    it('populates form with existing promo code data', () => {
      render(<PromoCodeFormModal {...defaultProps} editingCode={mockPromoCode} />);

      const { codeInput, discountInput } = getFormInputs();
      expect(codeInput).toHaveValue('EARLYBIRD');
      expect(discountInput).toHaveValue(1000); // Percentage is stored as-is, not in cents
    });

    it('converts discount value from cents to dollars for display', () => {
      const promoWithFlatDiscount: PromoCode = {
        ...mockPromoCode,
        discount_type: 'flat',
        discount_value: 500, // $5 in cents
      };

      render(<PromoCodeFormModal {...defaultProps} editingCode={promoWithFlatDiscount} />);

      const { discountInput } = getFormInputs();
      expect(discountInput).toHaveValue(5);
    });

    it('shows selected groups in edit mode', async () => {
      const promoWithGroups: any = {
        ...mockPromoCode,
        application_scope: 'specific_groups',
        groups: [{ ticket_group_id: 'group-1', promo_code_id: 'promo-1' }],
      };

      render(<PromoCodeFormModal {...defaultProps} editingCode={promoWithGroups} />);

      await waitFor(() => {
        const gaCheckbox = screen.getByRole('checkbox', { name: /General Admission/ });
        expect(gaCheckbox).toBeChecked();
      });
    });

    it('shows selected tiers in edit mode', async () => {
      const promoWithTiers: any = {
        ...mockPromoCode,
        application_scope: 'specific_tiers',
        tiers: [{ ticket_tier_id: 'tier-1', promo_code_id: 'promo-1' }],
      };

      render(<PromoCodeFormModal {...defaultProps} editingCode={promoWithTiers} />);

      await waitFor(() => {
        const earlyBirdCheckbox = screen.getByRole('checkbox', { name: /Early Bird/ });
        expect(earlyBirdCheckbox).toBeChecked();
      });
    });
  });

  describe('Edge Cases', () => {
    it('shows message when no ticket groups available', async () => {
      const user = userEvent.setup();
      render(<PromoCodeFormModal {...defaultProps} ticketGroups={[]} />);

      // Switch to specific groups scope to trigger the message
      const groupsButton = screen.getByRole('button', { name: /promoCodes.scope.specificGroups/ });
      await user.click(groupsButton);

      await waitFor(() => {
        expect(screen.getByText('promoCodes.noGroupsAvailable')).toBeInTheDocument();
      });
    });

    it('shows message when no ticket tiers available', async () => {
      const user = userEvent.setup();
      render(<PromoCodeFormModal {...defaultProps} ticketTiers={[]} />);

      // Switch to specific tiers scope to trigger the message
      const tiersButton = screen.getByRole('button', { name: /promoCodes.scope.specificTiers/ });
      await user.click(tiersButton);

      await waitFor(() => {
        expect(screen.getByText('promoCodes.noTiersAvailable')).toBeInTheDocument();
      });
    });

    it('calls onOpenChange when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      render(<PromoCodeFormModal {...defaultProps} onOpenChange={onOpenChange} />);

      const cancelButton = screen.getByRole('button', { name: /buttons.cancel/ });
      await user.click(cancelButton);

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('resets form when modal is closed and reopened', async () => {
      const { rerender } = render(<PromoCodeFormModal {...defaultProps} open={true} />);

      const user = userEvent.setup();
      const { codeInput } = getFormInputs();
      await user.type(codeInput, 'TEST2026');

      // Close modal
      rerender(<PromoCodeFormModal {...defaultProps} open={false} />);

      // Reopen modal
      rerender(<PromoCodeFormModal {...defaultProps} open={true} />);

      const reopenedInputs = getFormInputs();
      expect(reopenedInputs.codeInput).toHaveValue('');
    });
  });
});
