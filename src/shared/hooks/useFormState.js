import { useState, useCallback, useRef, useMemo } from 'react';
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
export function useFormState({ initialData, validate, }) {
    const [data, setData] = useState(initialData);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Store initial data ref for dirty checking and reset
    const initialDataRef = useRef(initialData);
    // Calculate isDirty by comparing current data with initial
    const isDirty = useMemo(() => {
        const keys = Object.keys(initialDataRef.current);
        return keys.some(key => data[key] !== initialDataRef.current[key]);
    }, [data]);
    // Check if a specific field is dirty
    const isFieldDirty = useCallback((field) => {
        return data[field] !== initialDataRef.current[field];
    }, [data]);
    // Handle single field change
    const handleChange = useCallback((field, value) => {
        setData(prev => ({ ...prev, [field]: value }));
        // Clear error for this field when it changes
        setErrors(prev => {
            if (prev[field]) {
                const { [field]: _, ...rest } = prev;
                return rest;
            }
            return prev;
        });
    }, []);
    // Handle form submission
    const handleSubmit = useCallback(async (onSubmit) => {
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
        }
        catch (error) {
            // Re-throw to allow caller to handle
            throw error;
        }
        finally {
            setIsSubmitting(false);
        }
    }, [data, validate]);
    // Reset form to initial values
    const reset = useCallback(() => {
        setData(initialDataRef.current);
        setErrors({});
        setIsSubmitting(false);
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
