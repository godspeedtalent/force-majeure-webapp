import { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * Profile form data structure
 */
export interface ProfileFormData {
  firstName: string;
  lastName: string;
  displayName: string;
  gender: string;
  ageRange: string;
  billingAddress: string;
  billingCity: string;
  billingState: string;
  billingZip: string;
}

/**
 * Default values for profile form
 */
export const DEFAULT_PROFILE_FORM_DATA: ProfileFormData = {
  firstName: '',
  lastName: '',
  displayName: '',
  gender: 'unspecified',
  ageRange: 'unspecified',
  billingAddress: '',
  billingCity: '',
  billingState: '',
  billingZip: '',
};

/**
 * Profile data from database (snake_case)
 */
export interface ProfileDbData {
  full_name?: string | null;
  display_name?: string | null;
  gender?: string | null;
  age_range?: string | null;
  billing_address_line_1?: string | null;
  billing_city?: string | null;
  billing_state?: string | null;
  billing_zip_code?: string | null;
}

/**
 * Options for the profile form state hook
 */
export interface UseProfileFormStateOptions {
  /** Initial profile data from database */
  initialProfile?: ProfileDbData | null;
  /** Custom initial values (overrides profile data) */
  initialValues?: Partial<ProfileFormData>;
}

/**
 * Return type for the profile form state hook
 */
export interface UseProfileFormStateReturn {
  /** Current form data */
  formData: ProfileFormData;
  /** Update a single field */
  handleChange: <K extends keyof ProfileFormData>(field: K, value: ProfileFormData[K]) => void;
  /** Set multiple fields at once */
  setFormData: React.Dispatch<React.SetStateAction<ProfileFormData>>;
  /** Reset form to initial state */
  reset: () => void;
  /** Get profile info updates (for profile section) */
  getProfileInfoUpdates: () => Partial<ProfileDbData>;
  /** Get billing address updates (for billing section) */
  getBillingUpdates: () => Partial<ProfileDbData>;
  /** Get all updates combined */
  getAllUpdates: () => Partial<ProfileDbData>;
  /** Check if form has unsaved changes */
  hasChanges: boolean;
  /** Get full name combined from first and last */
  fullName: string;
}

/**
 * Parse full_name into first and last name parts
 */
function parseFullName(fullName: string | null | undefined): { firstName: string; lastName: string } {
  const nameParts = (fullName || '').trim().split(' ');
  return {
    firstName: nameParts[0] || '',
    lastName: nameParts.slice(1).join(' ') || '',
  };
}

/**
 * Hook for managing profile form state
 *
 * Provides centralized form state management for profile editing,
 * handling the conversion between camelCase form fields and snake_case database fields.
 *
 * @example
 * ```tsx
 * const {
 *   formData,
 *   handleChange,
 *   getProfileInfoUpdates,
 *   getBillingUpdates,
 * } = useProfileFormState({
 *   initialProfile: profile,
 * });
 *
 * // In form
 * <Input
 *   value={formData.firstName}
 *   onChange={(e) => handleChange('firstName', e.target.value)}
 * />
 *
 * // On submit
 * await updateProfile(getProfileInfoUpdates());
 * ```
 */
export function useProfileFormState({
  initialProfile = null,
  initialValues = {},
}: UseProfileFormStateOptions = {}): UseProfileFormStateReturn {
  // Compute initial form data from profile
  const computeInitialData = useCallback((): ProfileFormData => {
    const { firstName, lastName } = parseFullName(initialProfile?.full_name);

    return {
      ...DEFAULT_PROFILE_FORM_DATA,
      firstName,
      lastName,
      displayName: initialProfile?.display_name || '',
      gender: initialProfile?.gender || 'unspecified',
      ageRange: initialProfile?.age_range || 'unspecified',
      billingAddress: initialProfile?.billing_address_line_1 || '',
      billingCity: initialProfile?.billing_city || '',
      billingState: initialProfile?.billing_state || '',
      billingZip: initialProfile?.billing_zip_code || '',
      ...initialValues,
    };
  }, [initialProfile, initialValues]);

  const [formData, setFormData] = useState<ProfileFormData>(computeInitialData);
  const [originalData, setOriginalData] = useState<ProfileFormData>(computeInitialData);

  // Update form data when profile changes
  useEffect(() => {
    const newData = computeInitialData();
    setFormData(newData);
    setOriginalData(newData);
  }, [computeInitialData]);

  const handleChange = useCallback(<K extends keyof ProfileFormData>(
    field: K,
    value: ProfileFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const reset = useCallback(() => {
    const initialData = computeInitialData();
    setFormData(initialData);
  }, [computeInitialData]);

  // Combine first and last name
  const fullName = useMemo(() => {
    return [formData.firstName, formData.lastName].filter(Boolean).join(' ').trim();
  }, [formData.firstName, formData.lastName]);

  // Get profile info updates (for profile section form)
  const getProfileInfoUpdates = useCallback((): Partial<ProfileDbData> => {
    return {
      full_name: fullName || null,
      display_name: formData.displayName || null,
      gender: formData.gender === 'unspecified' ? null : formData.gender || null,
      age_range: formData.ageRange === 'unspecified' ? null : formData.ageRange || null,
    };
  }, [fullName, formData.displayName, formData.gender, formData.ageRange]);

  // Get billing address updates (for billing section form)
  const getBillingUpdates = useCallback((): Partial<ProfileDbData> => {
    return {
      billing_address_line_1: formData.billingAddress || null,
      billing_city: formData.billingCity || null,
      billing_state: formData.billingState || null,
      billing_zip_code: formData.billingZip || null,
    };
  }, [formData.billingAddress, formData.billingCity, formData.billingState, formData.billingZip]);

  // Get all updates combined
  const getAllUpdates = useCallback((): Partial<ProfileDbData> => {
    return {
      ...getProfileInfoUpdates(),
      ...getBillingUpdates(),
    };
  }, [getProfileInfoUpdates, getBillingUpdates]);

  // Check if form has unsaved changes
  const hasChanges = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(originalData);
  }, [formData, originalData]);

  return {
    formData,
    handleChange,
    setFormData,
    reset,
    getProfileInfoUpdates,
    getBillingUpdates,
    getAllUpdates,
    hasChanges,
    fullName,
  };
}
