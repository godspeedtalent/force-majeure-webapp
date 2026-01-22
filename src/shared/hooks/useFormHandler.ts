import { useState, useCallback, useMemo } from 'react';

/**
 * Configuration options for the form handler
 */
export interface UseFormHandlerOptions<T> {
  /** Initial form data values */
  initialData: T;
  /** Whether to track which fields have been touched */
  trackTouched?: boolean;
  /** Callback when form data changes */
  onChange?: (data: T, field: keyof T) => void;
}

/**
 * Return type for the form handler hook
 */
export interface UseFormHandlerReturn<T> {
  /** Current form data */
  formData: T;
  /** Set form data directly */
  setFormData: React.Dispatch<React.SetStateAction<T>>;
  /** Current form errors */
  errors: Partial<Record<keyof T, string>>;
  /** Set errors directly */
  setErrors: React.Dispatch<React.SetStateAction<Partial<Record<keyof T, string>>>>;
  /** Which fields have been touched */
  touchedFields: Partial<Record<keyof T, boolean>>;
  /** Update a single field value (clears error and marks as touched) */
  handleChange: <K extends keyof T>(field: K, value: T[K]) => void;
  /** Mark a field as touched */
  markTouched: (field: keyof T) => void;
  /** Mark all fields as touched */
  markAllTouched: () => void;
  /** Check if a field should show an error (touched + has error) */
  shouldShowError: (field: keyof T) => boolean;
  /** Get error message for a field (only if should show) */
  getError: (field: keyof T) => string | undefined;
  /** Set a single field error */
  setFieldError: (field: keyof T, message: string) => void;
  /** Clear a single field error */
  clearFieldError: (field: keyof T) => void;
  /** Clear all errors */
  clearAllErrors: () => void;
  /** Reset form to initial state */
  reset: () => void;
  /** Check if form has any errors */
  hasErrors: boolean;
  /** Check if form data has changed from initial */
  isDirty: boolean;
}

/**
 * Generic form handler hook that provides type-safe form state management.
 *
 * Features:
 * - Type-safe field updates
 * - Error tracking with per-field clearing
 * - Touch tracking for showing errors only after interaction
 * - Dirty detection for unsaved changes warnings
 *
 * @example
 * ```tsx
 * interface LoginForm {
 *   email: string;
 *   password: string;
 * }
 *
 * const {
 *   formData,
 *   errors,
 *   handleChange,
 *   shouldShowError,
 *   getError,
 * } = useFormHandler<LoginForm>({
 *   initialData: { email: '', password: '' },
 *   trackTouched: true,
 * });
 *
 * <Input
 *   value={formData.email}
 *   onChange={(e) => handleChange('email', e.target.value)}
 *   error={shouldShowError('email')}
 *   helperText={getError('email')}
 * />
 * ```
 */
export function useFormHandler<T extends Record<string, unknown>>({
  initialData,
  trackTouched = true,
  onChange,
}: UseFormHandlerOptions<T>): UseFormHandlerReturn<T> {
  const [formData, setFormData] = useState<T>(initialData);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touchedFields, setTouchedFields] = useState<Partial<Record<keyof T, boolean>>>({});

  const handleChange = useCallback(
    <K extends keyof T>(field: K, value: T[K]) => {
      setFormData(prev => {
        const next = { ...prev, [field]: value };
        onChange?.(next, field);
        return next;
      });
      // Clear error when field is changed
      setErrors(prev => {
        if (prev[field]) {
          const next = { ...prev };
          delete next[field];
          return next;
        }
        return prev;
      });
      // Mark as touched
      if (trackTouched) {
        setTouchedFields(prev => {
          if (!prev[field]) {
            return { ...prev, [field]: true };
          }
          return prev;
        });
      }
    },
    [onChange, trackTouched]
  );

  const markTouched = useCallback((field: keyof T) => {
    setTouchedFields(prev => {
      if (!prev[field]) {
        return { ...prev, [field]: true };
      }
      return prev;
    });
  }, []);

  const markAllTouched = useCallback(() => {
    const allTouched = Object.keys(initialData).reduce(
      (acc, key) => ({ ...acc, [key]: true }),
      {} as Partial<Record<keyof T, boolean>>
    );
    setTouchedFields(allTouched);
  }, [initialData]);

  const shouldShowError = useCallback(
    (field: keyof T): boolean => {
      return Boolean(touchedFields[field] && errors[field]);
    },
    [touchedFields, errors]
  );

  const getError = useCallback(
    (field: keyof T): string | undefined => {
      if (shouldShowError(field)) {
        return errors[field];
      }
      return undefined;
    },
    [shouldShowError, errors]
  );

  const setFieldError = useCallback((field: keyof T, message: string) => {
    setErrors(prev => ({ ...prev, [field]: message }));
  }, []);

  const clearFieldError = useCallback((field: keyof T) => {
    setErrors(prev => {
      if (prev[field]) {
        const next = { ...prev };
        delete next[field];
        return next;
      }
      return prev;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  const reset = useCallback(() => {
    setFormData(initialData);
    setErrors({});
    setTouchedFields({});
  }, [initialData]);

  const hasErrors = useMemo(() => {
    return Object.keys(errors).length > 0;
  }, [errors]);

  const isDirty = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(initialData);
  }, [formData, initialData]);

  return {
    formData,
    setFormData,
    errors,
    setErrors,
    touchedFields,
    handleChange,
    markTouched,
    markAllTouched,
    shouldShowError,
    getError,
    setFieldError,
    clearFieldError,
    clearAllErrors,
    reset,
    hasErrors,
    isDirty,
  };
}
