import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFormState } from './useFormState';
const defaultInitialData = {
    name: '',
    email: '',
    age: 0,
};
describe('useFormState', () => {
    describe('initialization', () => {
        it('should initialize with provided initial data', () => {
            const initialData = { name: 'John', email: 'john@example.com', age: 30 };
            const { result } = renderHook(() => useFormState({ initialData }));
            expect(result.current.data).toEqual(initialData);
        });
        it('should initialize with empty errors', () => {
            const { result } = renderHook(() => useFormState({ initialData: defaultInitialData }));
            expect(result.current.errors).toEqual({});
        });
        it('should initialize isSubmitting as false', () => {
            const { result } = renderHook(() => useFormState({ initialData: defaultInitialData }));
            expect(result.current.isSubmitting).toBe(false);
        });
        it('should initialize isDirty as false', () => {
            const { result } = renderHook(() => useFormState({ initialData: defaultInitialData }));
            expect(result.current.isDirty).toBe(false);
        });
    });
    describe('handleChange', () => {
        it('should update field value', () => {
            const { result } = renderHook(() => useFormState({ initialData: defaultInitialData }));
            act(() => {
                result.current.handleChange('name', 'Jane');
            });
            expect(result.current.data.name).toBe('Jane');
        });
        it('should preserve other field values', () => {
            const initialData = { name: 'John', email: 'john@example.com', age: 30 };
            const { result } = renderHook(() => useFormState({ initialData }));
            act(() => {
                result.current.handleChange('name', 'Jane');
            });
            expect(result.current.data.email).toBe('john@example.com');
            expect(result.current.data.age).toBe(30);
        });
        it('should set isDirty to true after change', () => {
            const { result } = renderHook(() => useFormState({ initialData: defaultInitialData }));
            expect(result.current.isDirty).toBe(false);
            act(() => {
                result.current.handleChange('name', 'Jane');
            });
            expect(result.current.isDirty).toBe(true);
        });
        it('should set isDirty back to false if value reverts to initial', () => {
            const initialData = { name: 'John', email: '', age: 0 };
            const { result } = renderHook(() => useFormState({ initialData }));
            act(() => {
                result.current.handleChange('name', 'Jane'); // dirty
            });
            expect(result.current.isDirty).toBe(true);
            act(() => {
                result.current.handleChange('name', 'John'); // back to initial
            });
            expect(result.current.isDirty).toBe(false);
        });
        it('should clear error for changed field', () => {
            const { result } = renderHook(() => useFormState({ initialData: defaultInitialData }));
            // Set an error manually
            act(() => {
                result.current.setErrors({ name: 'Name is required' });
            });
            expect(result.current.errors.name).toBe('Name is required');
            // Change the field - error should clear
            act(() => {
                result.current.handleChange('name', 'Jane');
            });
            expect(result.current.errors.name).toBeUndefined();
        });
        it('should preserve errors for other fields', () => {
            const { result } = renderHook(() => useFormState({ initialData: defaultInitialData }));
            // Set multiple errors
            act(() => {
                result.current.setErrors({
                    name: 'Name is required',
                    email: 'Email is invalid',
                });
            });
            // Change only name field
            act(() => {
                result.current.handleChange('name', 'Jane');
            });
            expect(result.current.errors.name).toBeUndefined();
            expect(result.current.errors.email).toBe('Email is invalid');
        });
    });
    describe('isFieldDirty', () => {
        it('should return false for unchanged field', () => {
            const initialData = { name: 'John', email: '', age: 0 };
            const { result } = renderHook(() => useFormState({ initialData }));
            expect(result.current.isFieldDirty('name')).toBe(false);
        });
        it('should return true for changed field', () => {
            const initialData = { name: 'John', email: '', age: 0 };
            const { result } = renderHook(() => useFormState({ initialData }));
            act(() => {
                result.current.handleChange('name', 'Jane');
            });
            expect(result.current.isFieldDirty('name')).toBe(true);
            expect(result.current.isFieldDirty('email')).toBe(false);
        });
    });
    describe('validation', () => {
        it('should run validation on submit', async () => {
            const validate = vi.fn().mockReturnValue({ name: 'Name is required' });
            const { result } = renderHook(() => useFormState({
                initialData: defaultInitialData,
                validate,
            }));
            const onSubmit = vi.fn();
            await act(async () => {
                await result.current.handleSubmit(onSubmit);
            });
            expect(validate).toHaveBeenCalledWith(defaultInitialData);
            expect(result.current.errors.name).toBe('Name is required');
            expect(onSubmit).not.toHaveBeenCalled();
        });
        it('should not call onSubmit if validation fails', async () => {
            const validate = vi.fn().mockReturnValue({ email: 'Invalid email' });
            const { result } = renderHook(() => useFormState({
                initialData: defaultInitialData,
                validate,
            }));
            const onSubmit = vi.fn();
            await act(async () => {
                await result.current.handleSubmit(onSubmit);
            });
            expect(onSubmit).not.toHaveBeenCalled();
        });
        it('should call onSubmit if validation passes', async () => {
            const validate = vi.fn().mockReturnValue(null);
            const { result } = renderHook(() => useFormState({
                initialData: defaultInitialData,
                validate,
            }));
            const onSubmit = vi.fn();
            await act(async () => {
                await result.current.handleSubmit(onSubmit);
            });
            expect(onSubmit).toHaveBeenCalledWith(defaultInitialData);
        });
        it('should call onSubmit if validation returns empty object', async () => {
            const validate = vi.fn().mockReturnValue({});
            const { result } = renderHook(() => useFormState({
                initialData: defaultInitialData,
                validate,
            }));
            const onSubmit = vi.fn();
            await act(async () => {
                await result.current.handleSubmit(onSubmit);
            });
            expect(onSubmit).toHaveBeenCalled();
        });
    });
    describe('handleSubmit', () => {
        it('should set isSubmitting during submission', async () => {
            const { result } = renderHook(() => useFormState({ initialData: defaultInitialData }));
            let resolveSubmit;
            const submitPromise = new Promise(resolve => {
                resolveSubmit = resolve;
            });
            let submissionPromise;
            act(() => {
                submissionPromise = result.current.handleSubmit(() => submitPromise);
            });
            expect(result.current.isSubmitting).toBe(true);
            await act(async () => {
                resolveSubmit();
                await submissionPromise;
            });
            expect(result.current.isSubmitting).toBe(false);
        });
        it('should clear errors before submission', async () => {
            const { result } = renderHook(() => useFormState({ initialData: defaultInitialData }));
            // Set initial errors
            act(() => {
                result.current.setErrors({ name: 'Previous error' });
            });
            expect(result.current.errors.name).toBe('Previous error');
            await act(async () => {
                await result.current.handleSubmit(async () => { });
            });
            expect(result.current.errors).toEqual({});
        });
        it('should re-throw errors from onSubmit', async () => {
            const { result } = renderHook(() => useFormState({ initialData: defaultInitialData }));
            const testError = new Error('Submit failed');
            await expect(act(async () => {
                await result.current.handleSubmit(async () => {
                    throw testError;
                });
            })).rejects.toThrow('Submit failed');
        });
        it('should set isSubmitting to false after error', async () => {
            const { result } = renderHook(() => useFormState({ initialData: defaultInitialData }));
            try {
                await act(async () => {
                    await result.current.handleSubmit(async () => {
                        throw new Error('Failed');
                    });
                });
            }
            catch {
                // Expected
            }
            expect(result.current.isSubmitting).toBe(false);
        });
        it('should pass current data to onSubmit', async () => {
            const { result } = renderHook(() => useFormState({ initialData: defaultInitialData }));
            act(() => {
                result.current.handleChange('name', 'Updated Name');
                result.current.handleChange('email', 'updated@example.com');
            });
            const onSubmit = vi.fn();
            await act(async () => {
                await result.current.handleSubmit(onSubmit);
            });
            expect(onSubmit).toHaveBeenCalledWith({
                name: 'Updated Name',
                email: 'updated@example.com',
                age: 0,
            });
        });
    });
    describe('reset', () => {
        it('should reset data to initial values', () => {
            const initialData = { name: 'John', email: '', age: 0 };
            const { result } = renderHook(() => useFormState({ initialData }));
            act(() => {
                result.current.handleChange('name', 'Jane');
                result.current.handleChange('email', 'jane@example.com');
            });
            act(() => {
                result.current.reset();
            });
            expect(result.current.data).toEqual(initialData);
        });
        it('should clear errors', () => {
            const { result } = renderHook(() => useFormState({ initialData: defaultInitialData }));
            act(() => {
                result.current.setErrors({ name: 'Error' });
            });
            act(() => {
                result.current.reset();
            });
            expect(result.current.errors).toEqual({});
        });
        it('should set isDirty to false', () => {
            const { result } = renderHook(() => useFormState({ initialData: defaultInitialData }));
            act(() => {
                result.current.handleChange('name', 'Jane');
            });
            expect(result.current.isDirty).toBe(true);
            act(() => {
                result.current.reset();
            });
            expect(result.current.isDirty).toBe(false);
        });
        it('should set isSubmitting to false', async () => {
            const { result } = renderHook(() => useFormState({ initialData: defaultInitialData }));
            // Start submission but don't complete it
            let resolveSubmit;
            act(() => {
                result.current.handleSubmit(() => new Promise(resolve => {
                    resolveSubmit = resolve;
                }));
            });
            expect(result.current.isSubmitting).toBe(true);
            // Reset during submission
            act(() => {
                result.current.reset();
            });
            expect(result.current.isSubmitting).toBe(false);
            // Clean up
            await act(async () => {
                resolveSubmit();
            });
        });
    });
    describe('setErrors', () => {
        it('should set errors directly', () => {
            const { result } = renderHook(() => useFormState({ initialData: defaultInitialData }));
            act(() => {
                result.current.setErrors({
                    name: 'Name error',
                    email: 'Email error',
                });
            });
            expect(result.current.errors.name).toBe('Name error');
            expect(result.current.errors.email).toBe('Email error');
        });
        it('should replace existing errors', () => {
            const { result } = renderHook(() => useFormState({ initialData: defaultInitialData }));
            act(() => {
                result.current.setErrors({ name: 'First error' });
            });
            act(() => {
                result.current.setErrors({ email: 'Second error' });
            });
            expect(result.current.errors.name).toBeUndefined();
            expect(result.current.errors.email).toBe('Second error');
        });
    });
    describe('setData', () => {
        it('should set data directly with object', () => {
            const { result } = renderHook(() => useFormState({ initialData: defaultInitialData }));
            act(() => {
                result.current.setData({ name: 'Direct', email: 'direct@example.com', age: 25 });
            });
            expect(result.current.data).toEqual({
                name: 'Direct',
                email: 'direct@example.com',
                age: 25,
            });
        });
        it('should set data with updater function', () => {
            const initialData = { name: 'John', email: '', age: 30 };
            const { result } = renderHook(() => useFormState({ initialData }));
            act(() => {
                result.current.setData(prev => ({ ...prev, age: prev.age + 1 }));
            });
            expect(result.current.data.age).toBe(31);
            expect(result.current.data.name).toBe('John');
        });
    });
    describe('callback stability', () => {
        it('should maintain stable callback references', () => {
            const { result, rerender } = renderHook(() => useFormState({ initialData: defaultInitialData }));
            const initialHandleChange = result.current.handleChange;
            const initialReset = result.current.reset;
            const initialSetErrors = result.current.setErrors;
            // Trigger state change
            act(() => {
                result.current.handleChange('name', 'Test');
            });
            rerender();
            expect(result.current.handleChange).toBe(initialHandleChange);
            expect(result.current.reset).toBe(initialReset);
            expect(result.current.setErrors).toBe(initialSetErrors);
        });
    });
});
