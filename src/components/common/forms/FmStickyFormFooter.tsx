/**
 * FmStickyFormFooter
 *
 * A sticky footer component for forms with Save Changes buttons.
 * Floats at the bottom left of the viewport with a frosted glass effect.
 * Only visible when the form has unsaved changes - slides in from the left.
 */

import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, AlertCircle } from 'lucide-react';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonIconButton } from '@/components/common/buttons/FmCommonIconButton';
import { cn, useIsMobile } from '@/shared';

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
  /** Whether inside a sidebar layout - adjusts left offset (default: false) */
  hasSidebar?: boolean;
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
  hasSidebar = false,
}: FmStickyFormFooterProps) {
  const { t } = useTranslation('common');
  const isMobile = useIsMobile();

  const buttonText = isSaving
    ? (savingText || t('buttons.saving'))
    : (saveText || t('buttons.saveChanges'));

  // Mobile bottom tab bar is ~70px + safe area, so use 90px bottom offset
  const bottomOffset = isMobile ? 'bottom-[90px]' : 'bottom-6';

  // Account for sidebar width (16rem = 256px) on desktop when hasSidebar is true
  // On mobile, sidebar is hidden so use normal left offset
  const leftOffset = hasSidebar && !isMobile ? 'left-[calc(16rem+1.5rem)]' : 'left-6';

  // Don't render at all when there are no unsaved changes
  if (!isDirty && !isSaving) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed z-50',
        leftOffset,
        bottomOffset,
        'flex items-center gap-3',
        'p-4 rounded-none',
        'bg-black/80 backdrop-blur-lg',
        'border border-white/20',
        'shadow-lg shadow-black/50',
        // Slide in from left animation
        'animate-in slide-in-from-left-full duration-300',
        className
      )}
    >
      {/* Unsaved changes indicator - desktop only */}
      {isDirty && !isMobile && (
        <div className='flex items-center gap-2 text-fm-gold text-sm'>
          <AlertCircle className='h-4 w-4' />
          <span>{t('dialogs.unsavedChanges')}</span>
        </div>
      )}

      {/* Secondary action (e.g., delete) */}
      {secondaryAction}

      {/* Save button - icon only on mobile, full button on desktop */}
      {isMobile ? (
        <FmCommonIconButton
          icon={Save}
          onClick={onSave}
          disabled={disabled || isSaving}
          loading={isSaving}
          variant='gold'
          tooltip={buttonText}
          aria-label={buttonText}
        />
      ) : (
        <FmCommonButton
          icon={Save}
          onClick={onSave}
          disabled={disabled || isSaving}
          loading={isSaving}
          variant='gold'
        >
          {buttonText}
        </FmCommonButton>
      )}
    </div>
  );
}
