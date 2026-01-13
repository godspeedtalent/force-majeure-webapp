import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Mail } from 'lucide-react';
import { FmCommonTextField } from './FmCommonTextField';
import { cn } from '@/shared';

/**
 * Email validation regex
 * Matches standard email format: local@domain.tld
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FmCommonEmailFieldProps {
  /** Current email value */
  value: string;
  /** Called when email value changes */
  onChange: (value: string) => void;
  /** Called when email is blurred with validation result */
  onBlur?: (isValid: boolean) => void;
  /** Label text */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Additional description text */
  description?: string;
  /** External error message (overrides internal validation) */
  error?: string;
  /** Whether to show validation error on blur (default: true) */
  validateOnBlur?: boolean;
  /** Whether to show validation in real-time as user types (default: false) */
  validateOnChange?: boolean;
  /** Custom validation error message */
  invalidEmailMessage?: string;
  /** Whether to show the mail icon (default: true) */
  showIcon?: boolean;
  /** Additional class name for the container */
  className?: string;
  /** ID for the input element */
  id?: string;
}

/**
 * FmCommonEmailField - Email input with built-in validation
 *
 * Features:
 * - Real-time or on-blur email validation
 * - Visual feedback with mail icon
 * - Consistent styling with FmCommonTextField
 * - i18n support for error messages
 *
 * @example
 * ```tsx
 * <FmCommonEmailField
 *   value={email}
 *   onChange={setEmail}
 *   label="Email Address"
 *   required
 * />
 * ```
 */
export function FmCommonEmailField({
  value,
  onChange,
  onBlur,
  label,
  placeholder,
  required = false,
  disabled = false,
  description,
  error: externalError,
  validateOnBlur = true,
  validateOnChange = false,
  invalidEmailMessage,
  showIcon = true,
  className,
  id,
}: FmCommonEmailFieldProps) {
  const { t } = useTranslation('validation');
  const [internalError, setInternalError] = React.useState<string | null>(null);
  const [touched, setTouched] = React.useState(false);

  const defaultPlaceholder = placeholder || 'email@example.com';
  const defaultInvalidMessage = invalidEmailMessage || t('email.invalid');

  /**
   * Validate email address
   */
  const validateEmail = React.useCallback((email: string): boolean => {
    if (!email && !required) return true;
    if (!email && required) return false;
    return EMAIL_REGEX.test(email);
  }, [required]);

  /**
   * Handle value change
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    if (validateOnChange && touched) {
      const isValid = validateEmail(newValue);
      setInternalError(isValid ? null : defaultInvalidMessage);
    }
  };

  /**
   * Handle blur event
   */
  const handleBlur = () => {
    setTouched(true);

    if (validateOnBlur) {
      const isValid = validateEmail(value);
      setInternalError(isValid ? null : defaultInvalidMessage);
      onBlur?.(isValid);
    } else {
      onBlur?.(validateEmail(value));
    }
  };

  // Display external error if provided, otherwise internal validation error
  const displayError = externalError || (touched ? internalError : null);

  return (
    <div className={cn('relative', className)}>
      {showIcon && (
        <div className='absolute left-3 top-2.5 z-10 pointer-events-none'>
          <Mail className={cn(
            'h-4 w-4 transition-colors',
            displayError ? 'text-destructive' : 'text-muted-foreground'
          )} />
        </div>
      )}
      <FmCommonTextField
        id={id}
        type='email'
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        label={label}
        placeholder={defaultPlaceholder}
        required={required}
        disabled={disabled}
        description={description}
        error={displayError || undefined}
        className={cn(showIcon && 'pl-10')}
        autoComplete='email'
      />
    </div>
  );
}

/**
 * Utility function to validate email format
 * Can be used outside the component for form validation
 */
export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}
