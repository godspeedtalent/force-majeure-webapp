/**
 * FmCommonFormActions
 *
 * Standardized form action buttons (submit, cancel, reset)
 * Provides consistent layout and states for form actions
 */

import { Button } from '@/components/common/shadcn/button';
import { cn } from '@force-majeure/shared';

interface FmCommonFormActionsProps {
  /** Submit button text */
  submitText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Show cancel button */
  showCancel?: boolean;
  /** Cancel button handler */
  onCancel?: () => void;
  /** Show reset button */
  showReset?: boolean;
  /** Reset button handler */
  onReset?: () => void;
  /** Submitting state */
  isSubmitting?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Layout alignment */
  align?: 'left' | 'center' | 'right' | 'between';
  /** Additional CSS classes */
  className?: string;
}

const alignClasses = {
  left: 'justify-start',
  center: 'justify-center',
  right: 'justify-end',
  between: 'justify-between',
};

/**
 * Standardized form action buttons
 *
 * @example
 * ```tsx
 * <FmCommonFormActions
 *   submitText="Save Changes"
 *   cancelText="Cancel"
 *   showCancel
 *   onCancel={() => navigate(-1)}
 *   isSubmitting={form.formState.isSubmitting}
 *   align="right"
 * />
 *
 * <FmCommonFormActions
 *   submitText="Create Event"
 *   showReset
 *   onReset={() => form.reset()}
 *   isSubmitting={isCreating}
 * />
 * ```
 */
export const FmCommonFormActions = ({
  submitText = 'Submit',
  cancelText = 'Cancel',
  showCancel = false,
  onCancel,
  showReset = false,
  onReset,
  isSubmitting = false,
  disabled = false,
  align = 'right',
  className,
}: FmCommonFormActionsProps) => {
  return (
    <div
      className={cn('flex items-center gap-3', alignClasses[align], className)}
    >
      {showReset && onReset && (
        <Button
          type='button'
          variant='outline'
          onClick={onReset}
          disabled={isSubmitting || disabled}
        >
          Reset
        </Button>
      )}

      {showCancel && onCancel && (
        <Button
          type='button'
          variant='outline'
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {cancelText}
        </Button>
      )}

      <Button type='submit' disabled={isSubmitting || disabled}>
        {isSubmitting && <div className='w-4 h-4 mr-2 animate-spin rounded-full border-2 border-fm-gold border-b-transparent' />}
        {submitText}
      </Button>
    </div>
  );
};
