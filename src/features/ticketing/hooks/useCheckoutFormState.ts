import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/services/AuthContext';

/**
 * Checkout form data structure
 */
export interface CheckoutFormData {
  fullName: string;
  email: string;
  phone?: string;
  address: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  ticketProtection: boolean;
  smsNotifications: boolean;
  agreeToTerms: boolean;
  saveAddress: boolean;
}

/**
 * Default values for checkout form
 */
export const DEFAULT_CHECKOUT_FORM_DATA: CheckoutFormData = {
  fullName: '',
  email: '',
  phone: '',
  address: '',
  address2: '',
  city: '',
  state: '',
  zipCode: '',
  ticketProtection: false,
  smsNotifications: false,
  agreeToTerms: false,
  saveAddress: false,
};

/**
 * Validation result for checkout form
 */
export interface CheckoutValidationResult {
  isValid: boolean;
  errors: Partial<Record<keyof CheckoutFormData, string>>;
}

/**
 * Options for the checkout form state hook
 */
export interface UseCheckoutFormStateOptions {
  /** Whether to auto-fill from user profile */
  autoFillFromProfile?: boolean;
  /** Whether payment is in mock mode (skips billing validation) */
  isMockPayment?: boolean;
  /** Custom initial values */
  initialValues?: Partial<CheckoutFormData>;
}

/**
 * Return type for the checkout form state hook
 */
export interface UseCheckoutFormStateReturn {
  /** Current form data */
  formData: CheckoutFormData;
  /** Form validation errors */
  errors: Partial<Record<keyof CheckoutFormData, string>>;
  /** Update a single field */
  handleChange: <K extends keyof CheckoutFormData>(field: K, value: CheckoutFormData[K]) => void;
  /** Validate the entire form */
  validate: () => CheckoutValidationResult;
  /** Check if a specific field has an error */
  hasError: (field: keyof CheckoutFormData) => boolean;
  /** Get error message for a field */
  getError: (field: keyof CheckoutFormData) => string | undefined;
  /** Set multiple errors at once */
  setErrors: (errors: Partial<Record<keyof CheckoutFormData, string>>) => void;
  /** Clear all errors */
  clearErrors: () => void;
  /** Reset form to initial state */
  reset: () => void;
  /** Check if form is complete (all required fields filled) */
  isComplete: boolean;
}

/**
 * Email validation regex
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * US ZIP code validation regex (5 digits or 5+4 format)
 */
const ZIP_REGEX = /^\d{5}(-\d{4})?$/;

/**
 * Hook for managing checkout form state
 *
 * Provides centralized form state management, validation, and auto-fill
 * for ticket checkout forms.
 *
 * @example
 * ```tsx
 * const {
 *   formData,
 *   handleChange,
 *   validate,
 *   hasError,
 *   getError,
 * } = useCheckoutFormState({
 *   autoFillFromProfile: true,
 *   isMockPayment: false,
 * });
 *
 * // In form
 * <Input
 *   value={formData.email}
 *   onChange={(e) => handleChange('email', e.target.value)}
 *   error={hasError('email')}
 * />
 * ```
 */
export function useCheckoutFormState({
  autoFillFromProfile = true,
  isMockPayment = false,
  initialValues = {},
}: UseCheckoutFormStateOptions = {}): UseCheckoutFormStateReturn {
  const { t } = useTranslation('pages');
  const { user } = useAuth();

  const [formData, setFormData] = useState<CheckoutFormData>({
    ...DEFAULT_CHECKOUT_FORM_DATA,
    ...initialValues,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutFormData, string>>>({});

  // Auto-fill from user profile
  useEffect(() => {
    if (autoFillFromProfile && user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.user_metadata?.full_name || prev.fullName,
        email: user.email || prev.email,
        phone: user.user_metadata?.phone || prev.phone,
        // Address fields from billing info if available
        address: user.user_metadata?.billing_address || prev.address,
        city: user.user_metadata?.billing_city || prev.city,
        state: user.user_metadata?.billing_state || prev.state,
        zipCode: user.user_metadata?.billing_zip || prev.zipCode,
      }));
    }
  }, [autoFillFromProfile, user]);

  const handleChange = useCallback(<K extends keyof CheckoutFormData>(
    field: K,
    value: CheckoutFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is changed
    setErrors(prev => {
      if (prev[field]) {
        const next = { ...prev };
        delete next[field];
        return next;
      }
      return prev;
    });
  }, []);

  const validate = useCallback((): CheckoutValidationResult => {
    const nextErrors: Partial<Record<keyof CheckoutFormData, string>> = {};

    // Required: name and email
    if (!formData.fullName.trim()) {
      nextErrors.fullName = t('checkout.validation.fullNameRequired');
    }

    if (!formData.email.trim() || !EMAIL_REGEX.test(formData.email)) {
      nextErrors.email = t('checkout.validation.validEmailRequired');
    }

    // Billing address only required for real payments
    if (!isMockPayment) {
      if (!formData.address.trim()) {
        nextErrors.address = t('checkout.validation.addressRequired');
      }

      if (!formData.city.trim()) {
        nextErrors.city = t('checkout.validation.cityRequired');
      }

      if (!formData.state.trim()) {
        nextErrors.state = t('checkout.validation.stateRequired');
      }

      if (!formData.zipCode.trim() || !ZIP_REGEX.test(formData.zipCode)) {
        nextErrors.zipCode = t('checkout.validation.validZipRequired');
      }
    }

    // Always required: agree to terms
    if (!formData.agreeToTerms) {
      nextErrors.agreeToTerms = t('checkout.validation.mustAcceptTerms');
    }

    setErrors(nextErrors);

    return {
      isValid: Object.keys(nextErrors).length === 0,
      errors: nextErrors,
    };
  }, [formData, isMockPayment, t]);

  const hasError = useCallback(
    (field: keyof CheckoutFormData): boolean => {
      return Boolean(errors[field]);
    },
    [errors]
  );

  const getError = useCallback(
    (field: keyof CheckoutFormData): string | undefined => {
      return errors[field];
    },
    [errors]
  );

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const reset = useCallback(() => {
    setFormData({ ...DEFAULT_CHECKOUT_FORM_DATA, ...initialValues });
    setErrors({});
  }, [initialValues]);

  const isComplete = useMemo(() => {
    const requiredFields: (keyof CheckoutFormData)[] = isMockPayment
      ? ['fullName', 'email', 'agreeToTerms']
      : ['fullName', 'email', 'address', 'city', 'state', 'zipCode', 'agreeToTerms'];

    return requiredFields.every(field => {
      const value = formData[field];
      if (typeof value === 'boolean') return value;
      return Boolean(value && String(value).trim());
    });
  }, [formData, isMockPayment]);

  return {
    formData,
    errors,
    handleChange,
    validate,
    hasError,
    getError,
    setErrors,
    clearErrors,
    reset,
    isComplete,
  };
}
