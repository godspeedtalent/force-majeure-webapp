/**
 * FmStickyFormFooter
 *
 * A sticky footer component for forms with Save Changes buttons.
 * Floats at the bottom right of the viewport with a frosted glass effect.
 * Shows an unsaved changes indicator when the form is dirty.
 */

import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, AlertCircle } from 'lucide-react';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { cn } from '@/shared';

interface FmStickyFormFooterProps {
  /** Whether the form has unsaved changes */
  isDirty?: boolean;
  /** Whether the form is currently saving */
  isSaving?: boolean;
  /** Whether the save button should be disabled */
  disabled?: boolean;
  /** Called when save button is clicked */
  onSave: () => void;
  /** Optional secondary action (e.g., delete button) */
  secondaryAction?: ReactNode;
  /** Additional class names */
  className?: string;
  /** Custom save button text (defaults to "Save Changes") */
  saveText?: string;
  /** Custom saving text (defaults to "Saving...") */
  savingText?: string;
}

export function FmStickyFormFooter({
  isDirty = false,
  isSaving = false,
  disabled = false,
  onSave,
  secondaryAction,
  className,
  saveText,
  savingText,
}: FmStickyFormFooterProps) {
  const { t } = useTranslation('common');

  const buttonText = isSaving
    ? (savingText || t('buttons.saving'))
    : (saveText || t('buttons.saveChanges'));

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-50',
        'flex items-center gap-3',
        'p-4 rounded-none',
        'bg-black/80 backdrop-blur-lg',
        'border border-white/20',
        'shadow-lg shadow-black/50',
        'transition-all duration-300',
        isDirty ? 'opacity-100 translate-y-0' : 'opacity-70 hover:opacity-100',
        className
      )}
    >
      {/* Unsaved changes indicator */}
      {isDirty && (
        <div className='flex items-center gap-2 text-fm-gold text-sm'>
          <AlertCircle className='h-4 w-4' />
          <span className='hidden sm:inline'>{t('dialogs.unsavedChanges')}</span>
        </div>
      )}

      {/* Secondary action (e.g., delete) */}
      {secondaryAction}

      {/* Save button */}
      <FmCommonButton
        icon={Save}
        onClick={onSave}
        disabled={disabled || isSaving}
        loading={isSaving}
        variant={isDirty ? 'gold' : 'default'}
      >
        {buttonText}
      </FmCommonButton>
    </div>
  );
}
