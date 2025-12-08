import { useState, useCallback, useRef, useMemo } from 'react';

/**
 * Options for useFormState hook
 */
export interface UseFormStateOptions<T extends Record<string, unknown>> {
  /** Initial form data */
  initialData: T;
  /** Optional validation function that returns errors for invalid fields */
  validate?: (data: T) => Partial<Record<keyof T, string>> | null;
}

/**
 * Return type for useFormState hook
 */
export interface UseFormStateReturn<T extends Record<string, unknown>> {
  /** Current form data */
  data: T;
  /** Validation errors by field name */
  errors: Partial<Record<keyof T, string>>;
  /** Whether the form is currently submitting */
  isSubmitting: boolean;
  /** Whether any field has been modified from initial values */
  isDirty: boolean;
  /** Update a single field value (also clears that field's error) */
  handleChange: <K extends keyof T>(field: K, value: T[K]) => void;
  /** Submit the form with the provided handler */
  handleSubmit: (onSubmit: (data: T) => Promise<void>) => Promise<void>;
  /** Reset form to initial values */
  reset: () => void;
  /** Set validation errors manually */
  setErrors: (errors: Partial<Record<keyof T, string>>) => void;
  /** Set form data directly */
  setData: (data: T | ((prev: T) => T)) => void;
  /** Check if a specific field has been modified */
  isFieldDirty: (field: keyof T) => boolean;
}

/**
 * Hook for managing form state with validation, dirty tracking, and submission
 *
 * Provides a comprehensive interface for form state management including
 * field-level change tracking, validation, and submission handling.
 *
 * @param options - Form configuration options
 * @returns Form state and control functions
 *
 * @example
 * ```tsx
 * interface LoginForm {
 *   email: string;
 *   password: string;
 * }
 *
 * const form = useFormState<LoginForm>({
 *   initialData: { email: '', password: '' },
 *   validate: (data) => {
 *     const errors: Partial<Record<keyof LoginForm, string>> = {};
 *     if (!data.email) errors.email = 'Email is required';
 *     if (!data.password) errors.password = 'Password is required';
 *     return Object.keys(errors).length ? errors : null;
 *   },
 * });
 *
 * const handleLogin = async () => {
 *   await form.handleSubmit(async (data) => {
 *     await api.login(data.email, data.password);
 *   });
 * };
 *
 * return (
 *   <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
 *     <input
 *       value={form.data.email}
 *       onChange={(e) => form.handleChange('email', e.target.value)}
 *     />
 *     {form.errors.email && <span>{form.errors.email}</span>}
 *     <button type="submit" disabled={form.isSubmitting}>
 *       {form.isSubmitting ? 'Logging in...' : 'Login'}
 *     </button>
 *   </form>
 * );
 * ```
 */
export function useFormState<T extends Record<string, unknown>>({
  initialData,
  validate,
}: UseFormStateOptions<T>): UseFormStateReturn<T> {
  const [data, setData] = useState<T>(initialData);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Store initial data ref for dirty checking and reset
  const initialDataRef = useRef<T>(initialData);

  // Calculate isDirty by comparing current data with initial
  const isDirty = useMemo(() => {
    const keys = Object.keys(initialDataRef.current) as Array<keyof T>;
    return keys.some(key => data[key] !== initialDataRef.current[key]);
  }, [data]);

  // Check if a specific field is dirty
  const isFieldDirty = useCallback(
    (field: keyof T): boolean => {
      return data[field] !== initialDataRef.current[field];
    },
    [data]
  );

  // Handle single field change
  const handleChange = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when it changes
    setErrors(prev => {
      if (prev[field]) {
        const { [field]: _, ...rest } = prev;
        return rest as Partial<Record<keyof T, string>>;
      }
      return prev;
    });
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(
    async (onSubmit: (data: T) => Promise<void>): Promise<void> => {
      // Run validation if provided
      if (validate) {
        const validationErrors = validate(data);
        if (validationErrors && Object.keys(validationErrors).length > 0) {
          setErrors(validationErrors);
          return;
        }
      }

      setIsSubmitting(true);
      setErrors({});

      try {
        await onSubmit(data);
      } catch (error) {
        // Re-throw to allow caller to handle
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [data, validate]
  );

  // Reset form to initial values
  const reset = useCallback(() => {
    setData(initialDataRef.current);
    setErrors({});
    setIsSubmitting(false);
  }, []);

  // Update initial data ref when initialData prop changes
  // This allows for controlled form resets with new data
  const _updateInitialData = useCallback((newInitialData: T) => {
    initialDataRef.current = newInitialData;
    setData(newInitialData);
    setErrors({});
  }, []);

  return {
    data,
    errors,
    isSubmitting,
    isDirty,
    handleChange,
    handleSubmit,
    reset,
    setErrors,
    setData,
    isFieldDirty,
  };
}
