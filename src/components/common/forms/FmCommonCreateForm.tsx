/**
 * FmCommonCreateForm
 *
 * Base component for create forms with consistent layout, spacing, and button styling.
 * Handles common patterns: loading states, navigation, error handling, and form actions.
 */

import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DemoLayout } from '@/components/demo/DemoLayout';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';

export interface FmCommonCreateFormProps {
  /** Page title */
  title: string;
  /** Page description */
  description: string;
  /** Icon for the page header */
  icon: LucideIcon;
  /** Helper text shown above the form */
  helperText?: string;
  /** Form fields - render prop pattern */
  children: ReactNode;
  /** Submit handler */
  onSubmit: () => void | Promise<void>;
  /** Cancel handler (optional - defaults to navigate back to database) */
  onCancel?: () => void;
  /** Is form currently submitting */
  isSubmitting: boolean;
  /** Submit button text (defaults to "Create") */
  submitText?: string;
  /** Cancel button text (defaults to "Cancel") */
  cancelText?: string;
  /** Where to navigate on cancel/success (defaults to /developer/database) */
  returnPath?: string;
  /** Additional query params for return path */
  returnQuery?: string;
}

/**
 * Standardized create form wrapper with consistent layout and behavior
 *
 * @example
 * ```tsx
 * <FmCommonCreateForm
 *   title="Create Artist"
 *   description="Add a new artist profile"
 *   icon={Mic2}
 *   helperText="Use this form to create artist records"
 *   isSubmitting={isSubmitting}
 *   onSubmit={handleSubmit}
 * >
 *   <FmCommonTextField label="Name" {...nameProps} />
 *   <FmCommonTextField label="Bio" multiline {...bioProps} />
 * </FmCommonCreateForm>
 * ```
 */
export const FmCommonCreateForm = ({
  title,
  description,
  icon,
  helperText,
  children,
  onSubmit,
  onCancel,
  isSubmitting,
  submitText = 'Create',
  cancelText = 'Cancel',
  returnPath = '/developer/database',
  returnQuery,
}: FmCommonCreateFormProps) => {
  const navigate = useNavigate();

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      const path = returnQuery ? `${returnPath}?${returnQuery}` : returnPath;
      navigate(path);
    }
  };

  return (
    <DemoLayout
      title={title}
      description={description}
      icon={icon}
      condensed
    >
      <div className='space-y-[40px]'>
        {helperText && (
          <p className='text-sm text-muted-foreground'>{helperText}</p>
        )}

        {/* Form Fields */}
        <div className='space-y-[20px]'>{children}</div>

        {/* Form Actions */}
        <div className='flex gap-[10px] justify-end pt-[20px] border-t border-white/20'>
          <FmCommonButton
            type='button'
            variant='secondary'
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            {cancelText}
          </FmCommonButton>
          <FmCommonButton
            type='button'
            variant='default'
            onClick={onSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : submitText}
          </FmCommonButton>
        </div>
      </div>
    </DemoLayout>
  );
};
