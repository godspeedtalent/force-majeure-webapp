import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Percent,
  DollarSign,
  Sparkles,
  Ticket,
  Layers,
  Ban,
  ShoppingCart,
} from 'lucide-react';
import { FmCommonModal } from '@/components/common/modals/FmCommonModal';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonDatePicker } from '@/components/common/forms/FmCommonDatePicker';
import { FmCommonToggle } from '@/components/common/forms/FmCommonToggle';
import { Label } from '@/components/common/shadcn/label';
import { Checkbox } from '@/components/common/shadcn/checkbox';
import type {
  PromoCode,
  DiscountType,
  CreatePromoCodeInput,
  UpdatePromoCodeInput,
  PromoCodeScope,
  PromoCodeWithScope,
} from '@/shared/types/promoCode';
import { cn } from '@/shared';

interface TicketGroupOption {
  id: string;
  name: string;
  color: string;
}

interface TicketTierOption {
  id: string;
  name: string;
  groupName?: string;
}

interface PromoCodeFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreatePromoCodeInput | UpdatePromoCodeInput) => void;
  isSubmitting?: boolean;
  /** If provided, editing existing code */
  editingCode?: (PromoCode | PromoCodeWithScope) | null;
  /** Event ID for creating event-specific codes */
  eventId?: string;
  /** Available ticket groups for scope selection */
  ticketGroups?: TicketGroupOption[];
  /** Available ticket tiers for scope selection */
  ticketTiers?: TicketTierOption[];
}

/**
 * Generate a random promo code
 */
function generatePromoCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const SCOPE_OPTIONS: { value: PromoCodeScope; icon: typeof Ticket; labelKey: string }[] = [
  { value: 'all_tickets', icon: Ticket, labelKey: 'promoCodes.scope.allTickets' },
  { value: 'specific_groups', icon: Layers, labelKey: 'promoCodes.scope.specificGroups' },
  { value: 'specific_tiers', icon: Ticket, labelKey: 'promoCodes.scope.specificTiers' },
  { value: 'disabled', icon: Ban, labelKey: 'promoCodes.scope.disabled' },
];

export const PromoCodeFormModal = ({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  editingCode,
  eventId,
  ticketGroups = [],
  ticketTiers = [],
}: PromoCodeFormModalProps) => {
  const { t } = useTranslation('common');
  const { t: tValidation } = useTranslation('validation');

  // Form state
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [expiresAt, setExpiresAt] = useState<Date | undefined>();
  const [applicationScope, setApplicationScope] = useState<PromoCodeScope>('all_tickets');
  const [appliesToOrder, setAppliesToOrder] = useState(false);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [selectedTierIds, setSelectedTierIds] = useState<string[]>([]);

  // Validation error messages
  const [validationErrors, setValidationErrors] = useState<{
    code?: string;
    discountValue?: string;
    expiresAt?: string;
    groups?: string;
    tiers?: string;
  }>({});

  // Reset form when modal opens/closes or editing code changes
  useEffect(() => {
    if (open) {
      if (editingCode) {
        setCode(editingCode.code);
        setDiscountType(editingCode.discount_type as DiscountType);
        setDiscountValue(
          editingCode.discount_type === 'percentage'
            ? editingCode.discount_value.toString()
            : (editingCode.discount_value / 100).toString()
        );
        setExpiresAt(editingCode.expires_at ? new Date(editingCode.expires_at) : undefined);
        setApplicationScope(editingCode.application_scope || 'all_tickets');
        setAppliesToOrder(editingCode.applies_to_order || false);

        // Set selected groups/tiers from editingCode if it has scope data
        const codeWithScope = editingCode as PromoCodeWithScope;
        if (codeWithScope.groups) {
          setSelectedGroupIds(codeWithScope.groups.map(g => g.ticket_group_id));
        } else {
          setSelectedGroupIds([]);
        }
        if (codeWithScope.tiers) {
          setSelectedTierIds(codeWithScope.tiers.map(t => t.ticket_tier_id));
        } else {
          setSelectedTierIds([]);
        }
      } else {
        setCode('');
        setDiscountType('percentage');
        setDiscountValue('');
        setExpiresAt(undefined);
        setApplicationScope('all_tickets');
        setAppliesToOrder(false);
        setSelectedGroupIds([]);
        setSelectedTierIds([]);
      }
    }
  }, [open, editingCode]);

  const handleGenerateCode = () => {
    setCode(generatePromoCode());
  };

  const toggleGroup = (groupId: string) => {
    setSelectedGroupIds(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const toggleTier = (tierId: string) => {
    setSelectedTierIds(prev =>
      prev.includes(tierId)
        ? prev.filter(id => id !== tierId)
        : [...prev, tierId]
    );
  };

  // Validation logic
  const validateForm = (): boolean => {
    const errors: typeof validationErrors = {};

    // Code validation
    if (!code.trim()) {
      errors.code = tValidation('promoCodeRequired');
    } else if (!/^[A-Z0-9]+$/.test(code.trim())) {
      // Business rule: Alphanumeric only (no special characters)
      errors.code = tValidation('promoCodeAlphanumeric');
    }

    // Discount value validation
    const numericValue = parseFloat(discountValue);
    if (!discountValue) {
      errors.discountValue = tValidation('discountRequired');
    } else if (isNaN(numericValue) || numericValue <= 0) {
      errors.discountValue = tValidation('discountPositive');
    } else if (discountType === 'percentage') {
      // Business rule: Min 1%, Max 100%
      if (numericValue < 1) {
        errors.discountValue = tValidation('percentageMin');
      } else if (numericValue > 100) {
        errors.discountValue = tValidation('percentageMax');
      }
    } else if (discountType === 'flat') {
      // Business rule: Min $1, Max $10,000
      const minFlatDiscount = 1;
      const maxFlatDiscount = 10_000;
      if (numericValue < minFlatDiscount) {
        errors.discountValue = tValidation('flatDiscountMin', { min: minFlatDiscount });
      } else if (numericValue > maxFlatDiscount) {
        errors.discountValue = tValidation('flatDiscountMax', { max: maxFlatDiscount });
      }
    }

    // Expiration date validation
    if (expiresAt) {
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Start of today
      const expiresAtStartOfDay = new Date(expiresAt);
      expiresAtStartOfDay.setHours(0, 0, 0, 0);

      if (expiresAtStartOfDay < now) {
        errors.expiresAt = tValidation('expirationPast');
      }
    }

    // Scope validation
    if (applicationScope === 'specific_groups' && selectedGroupIds.length === 0) {
      errors.groups = tValidation('selectAtLeastOneGroup');
    }
    if (applicationScope === 'specific_tiers' && selectedTierIds.length === 0) {
      errors.tiers = tValidation('selectAtLeastOneTier');
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const numericValue = parseFloat(discountValue);
    // Convert flat amount to cents
    const finalValue = discountType === 'flat' ? Math.round(numericValue * 100) : numericValue;

    if (editingCode) {
      // Update existing code
      const updateData: UpdatePromoCodeInput = {
        id: editingCode.id,
        code: code.trim().toUpperCase(),
        discount_type: discountType,
        discount_value: finalValue,
        expires_at: expiresAt?.toISOString() || null,
        application_scope: applicationScope,
        applies_to_order: appliesToOrder,
        group_ids: applicationScope === 'specific_groups' ? selectedGroupIds : [],
        tier_ids: applicationScope === 'specific_tiers' ? selectedTierIds : [],
      };
      onSubmit(updateData);
    } else {
      // Create new code
      const createData: CreatePromoCodeInput = {
        code: code.trim().toUpperCase(),
        discount_type: discountType,
        discount_value: finalValue,
        expires_at: expiresAt?.toISOString() || null,
        event_id: eventId,
        application_scope: applicationScope,
        applies_to_order: appliesToOrder,
        group_ids: applicationScope === 'specific_groups' ? selectedGroupIds : [],
        tier_ids: applicationScope === 'specific_tiers' ? selectedTierIds : [],
      };
      onSubmit(createData);
    }
  };

  // Clear validation errors when fields change
  useEffect(() => {
    if (code) setValidationErrors(prev => ({ ...prev, code: undefined }));
  }, [code]);

  useEffect(() => {
    if (discountValue) setValidationErrors(prev => ({ ...prev, discountValue: undefined }));
  }, [discountValue]);

  useEffect(() => {
    if (expiresAt) setValidationErrors(prev => ({ ...prev, expiresAt: undefined }));
  }, [expiresAt]);

  useEffect(() => {
    if (selectedGroupIds.length > 0) setValidationErrors(prev => ({ ...prev, groups: undefined }));
  }, [selectedGroupIds]);

  useEffect(() => {
    if (selectedTierIds.length > 0) setValidationErrors(prev => ({ ...prev, tiers: undefined }));
  }, [selectedTierIds]);

  // Validation for button state using business rules
  const isValid = (() => {
    // Code validation
    if (!code.trim()) return false;
    if (!/^[A-Z0-9]+$/.test(code.trim())) return false; // Alphanumeric only

    // Discount value validation
    const numericValue = parseFloat(discountValue);
    if (!discountValue || isNaN(numericValue) || numericValue <= 0) return false;

    // Business rules for minimum/maximum thresholds
    if (discountType === 'percentage') {
      if (numericValue < 1 || numericValue > 100) return false; // Min 1%, Max 100%
    } else if (discountType === 'flat') {
      if (numericValue < 1 || numericValue > 10_000) return false; // Min $1, Max $10,000
    }

    // Expiration date validation (no past dates)
    if (expiresAt) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const expiresAtStartOfDay = new Date(expiresAt);
      expiresAtStartOfDay.setHours(0, 0, 0, 0);
      if (expiresAtStartOfDay < now) return false;
    }

    // Scope validation
    if (applicationScope === 'specific_groups' && selectedGroupIds.length === 0) return false;
    if (applicationScope === 'specific_tiers' && selectedTierIds.length === 0) return false;

    return true;
  })();

  return (
    <FmCommonModal
      open={open}
      onOpenChange={onOpenChange}
      title={editingCode ? t('promoCodes.editCode') : t('promoCodes.createNew')}
      description={editingCode ? t('promoCodes.editDescription') : t('promoCodes.createDescription')}
    >
      <div className='space-y-6 max-h-[70vh] overflow-y-auto pr-2'>
        {/* Code Input */}
        <div className='space-y-2'>
          <div className='flex items-center justify-between'>
            <Label className='text-xs uppercase text-muted-foreground'>
              {t('promoCodes.code')}
            </Label>
            {!editingCode && (
              <FmCommonButton
                variant='secondary'
                size='sm'
                icon={Sparkles}
                onClick={handleGenerateCode}
              >
                {t('promoCodes.generate')}
              </FmCommonButton>
            )}
          </div>
          <FmCommonTextField
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder='SUMMER2025'
            maxLength={20}
          />
          {validationErrors.code && (
            <p className='text-xs text-fm-danger mt-1'>{validationErrors.code}</p>
          )}
        </div>

        {/* Discount Type Selector */}
        <div className='space-y-2'>
          <Label className='text-xs uppercase text-muted-foreground'>
            {t('promoCodes.type')}
          </Label>
          <div className='flex gap-2'>
            <button
              type='button'
              onClick={() => setDiscountType('percentage')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 p-3 border transition-all',
                discountType === 'percentage'
                  ? 'border-fm-gold bg-fm-gold/20 text-fm-gold'
                  : 'border-white/20 hover:border-white/40'
              )}
            >
              <Percent className='h-4 w-4' />
              <span>{t('promoCodes.percentage')}</span>
            </button>
            <button
              type='button'
              onClick={() => setDiscountType('flat')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 p-3 border transition-all',
                discountType === 'flat'
                  ? 'border-fm-gold bg-fm-gold/20 text-fm-gold'
                  : 'border-white/20 hover:border-white/40'
              )}
            >
              <DollarSign className='h-4 w-4' />
              <span>{t('promoCodes.flat')}</span>
            </button>
          </div>
        </div>

        {/* Discount Value */}
        <div className='space-y-2'>
          <Label className='text-xs uppercase text-muted-foreground'>
            {t('promoCodes.discount')}
          </Label>
          <FmCommonTextField
            type='number'
            value={discountValue}
            onChange={e => setDiscountValue(e.target.value)}
            placeholder={discountType === 'percentage' ? '10' : '5.00'}
            min={0}
            max={discountType === 'percentage' ? 100 : 10_000}
            step={discountType === 'percentage' ? 1 : 0.01}
          />
          {validationErrors.discountValue ? (
            <p className='text-xs text-fm-danger mt-1'>{validationErrors.discountValue}</p>
          ) : (
            <p className='text-xs text-muted-foreground'>
              {discountType === 'percentage'
                ? t('promoCodes.percentageHint')
                : t('promoCodes.flatHint')}
            </p>
          )}
        </div>

        {/* Application Scope Selector */}
        <div className='space-y-2'>
          <Label className='text-xs uppercase text-muted-foreground'>
            {t('promoCodes.applicationScope')}
          </Label>
          <div className='grid grid-cols-2 gap-2'>
            {SCOPE_OPTIONS.map(option => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  type='button'
                  onClick={() => setApplicationScope(option.value)}
                  className={cn(
                    'flex items-center justify-center gap-2 p-3 border transition-all',
                    applicationScope === option.value
                      ? option.value === 'disabled'
                        ? 'border-fm-danger bg-fm-danger/20 text-fm-danger'
                        : 'border-fm-gold bg-fm-gold/20 text-fm-gold'
                      : 'border-white/20 hover:border-white/40'
                  )}
                >
                  <Icon className='h-4 w-4' />
                  <span className='text-sm'>{t(option.labelKey)}</span>
                </button>
              );
            })}
          </div>
          <p className='text-xs text-muted-foreground'>
            {t(`promoCodes.scope.${applicationScope}Hint`)}
          </p>
        </div>

        {/* Group Selection (when specific_groups scope) */}
        {applicationScope === 'specific_groups' && ticketGroups.length > 0 && (
          <div className='space-y-2'>
            <Label className='text-xs uppercase text-muted-foreground'>
              {t('promoCodes.selectGroups')}
            </Label>
            <div className='space-y-2 max-h-40 overflow-y-auto border border-white/10 p-3'>
              {ticketGroups.map(group => (
                <label
                  key={group.id}
                  className='flex items-center gap-3 cursor-pointer hover:bg-white/5 p-2 -m-2 transition-colors'
                >
                  <Checkbox
                    checked={selectedGroupIds.includes(group.id)}
                    onCheckedChange={() => toggleGroup(group.id)}
                  />
                  <div
                    className='w-3 h-3 rounded-full'
                    style={{ backgroundColor: group.color }}
                  />
                  <span className='text-sm'>{group.name}</span>
                </label>
              ))}
            </div>
            {validationErrors.groups && (
              <p className='text-xs text-fm-danger mt-1'>{validationErrors.groups}</p>
            )}
          </div>
        )}

        {/* Tier Selection (when specific_tiers scope) */}
        {applicationScope === 'specific_tiers' && ticketTiers.length > 0 && (
          <div className='space-y-2'>
            <Label className='text-xs uppercase text-muted-foreground'>
              {t('promoCodes.selectTiers')}
            </Label>
            <div className='space-y-2 max-h-40 overflow-y-auto border border-white/10 p-3'>
              {ticketTiers.map(tier => (
                <label
                  key={tier.id}
                  className='flex items-center gap-3 cursor-pointer hover:bg-white/5 p-2 -m-2 transition-colors'
                >
                  <Checkbox
                    checked={selectedTierIds.includes(tier.id)}
                    onCheckedChange={() => toggleTier(tier.id)}
                  />
                  <span className='text-sm'>
                    {tier.name}
                    {tier.groupName && (
                      <span className='text-muted-foreground ml-2'>({tier.groupName})</span>
                    )}
                  </span>
                </label>
              ))}
            </div>
            {validationErrors.tiers && (
              <p className='text-xs text-fm-danger mt-1'>{validationErrors.tiers}</p>
            )}
          </div>
        )}

        {/* No groups/tiers warning */}
        {applicationScope === 'specific_groups' && ticketGroups.length === 0 && (
          <div className='p-3 border border-white/10 bg-white/5 text-sm text-muted-foreground'>
            {t('promoCodes.noGroupsAvailable')}
          </div>
        )}
        {applicationScope === 'specific_tiers' && ticketTiers.length === 0 && (
          <div className='p-3 border border-white/10 bg-white/5 text-sm text-muted-foreground'>
            {t('promoCodes.noTiersAvailable')}
          </div>
        )}

        {/* Applies to Order Toggle */}
        <div className='space-y-2'>
          <div className='flex items-center justify-between p-3 border border-white/10'>
            <div className='flex items-center gap-3'>
              <ShoppingCart className='h-5 w-5 text-muted-foreground' />
              <div>
                <p className='text-sm font-medium'>{t('promoCodes.appliesToOrder')}</p>
                <p className='text-xs text-muted-foreground'>
                  {t('promoCodes.appliesToOrderHint')}
                </p>
              </div>
            </div>
            <FmCommonToggle
              id="applies-to-order"
              label={t('promoCodes.appliesToOrder')}
              hideLabel
              checked={appliesToOrder}
              onCheckedChange={setAppliesToOrder}
            />
          </div>
        </div>

        {/* Expiration Date */}
        <div className='space-y-2'>
          <Label className='text-xs uppercase text-muted-foreground'>
            {t('promoCodes.expiresAt')}
          </Label>
          <FmCommonDatePicker
            value={expiresAt}
            onChange={setExpiresAt}
            placeholder={t('promoCodes.noExpiration')}
          />
          {validationErrors.expiresAt ? (
            <p className='text-xs text-fm-danger mt-1'>{validationErrors.expiresAt}</p>
          ) : (
            <p className='text-xs text-muted-foreground'>
              {t('promoCodes.expirationHint')}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className='flex justify-end gap-3 pt-4 border-t border-white/10'>
          <FmCommonButton
            variant='secondary'
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {t('buttons.cancel')}
          </FmCommonButton>
          <FmCommonButton
            variant='gold'
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            loading={isSubmitting}
          >
            {editingCode ? t('buttons.save') : t('buttons.create')}
          </FmCommonButton>
        </div>
      </div>
    </FmCommonModal>
  );
};
