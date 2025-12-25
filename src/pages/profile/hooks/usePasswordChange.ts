import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export interface PasswordRequirement {
  key: string;
  label: string;
  test: (password: string) => boolean;
}

export interface UsePasswordChangeReturn {
  currentPassword: string;
  setCurrentPassword: (value: string) => void;
  newPassword: string;
  setNewPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  passwordError: string;
  setPasswordError: (value: string) => void;
  passwordRequirements: PasswordRequirement[];
  allRequirementsMet: boolean;
  passwordsMatch: boolean;
  canSubmit: boolean;
  resetForm: () => void;
  clearError: () => void;
}

/**
 * Hook for managing password change form state and validation
 */
export function usePasswordChange(): UsePasswordChangeReturn {
  const { t } = useTranslation('pages');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const passwordRequirements: PasswordRequirement[] = useMemo(
    () => [
      {
        key: 'minLength',
        label: t('auth.passwordRequirements.minLength'),
        test: (password: string) => password.length >= 8,
      },
      {
        key: 'uppercase',
        label: t('auth.passwordRequirements.uppercase'),
        test: (password: string) => /[A-Z]/.test(password),
      },
      {
        key: 'lowercase',
        label: t('auth.passwordRequirements.lowercase'),
        test: (password: string) => /[a-z]/.test(password),
      },
      {
        key: 'number',
        label: t('auth.passwordRequirements.number'),
        test: (password: string) => /\d/.test(password),
      },
    ],
    [t]
  );

  const allRequirementsMet = useMemo(
    () => passwordRequirements.every(req => req.test(newPassword)),
    [passwordRequirements, newPassword]
  );

  const passwordsMatch = newPassword === confirmPassword;

  const canSubmit =
    currentPassword.length > 0 &&
    allRequirementsMet &&
    passwordsMatch &&
    newPassword.length > 0;

  const resetForm = useCallback(() => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
  }, []);

  const clearError = useCallback(() => {
    if (passwordError) setPasswordError('');
  }, [passwordError]);

  return {
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    passwordError,
    setPasswordError,
    passwordRequirements,
    allRequirementsMet,
    passwordsMatch,
    canSubmit,
    resetForm,
    clearError,
  };
}
