/**
 * UnsavedChangesDialog
 *
 * Dialog shown when a user attempts to navigate away from a form with unsaved changes.
 * Uses the standard FmCommonConfirmDialog pattern for consistent UX.
 */

import { useTranslation } from 'react-i18next';
import { FmCommonConfirmDialog } from './FmCommonConfirmDialog';

interface UnsavedChangesDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Called when user confirms they want to leave without saving */
  onConfirm: () => void;
  /** Called when user cancels and wants to stay on the page */
  onCancel: () => void;
}

export function UnsavedChangesDialog({
  open,
  onConfirm,
  onCancel,
}: UnsavedChangesDialogProps) {
  const { t } = useTranslation('common');

  return (
    <FmCommonConfirmDialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onCancel();
        }
      }}
      title={t('dialogs.unsavedChanges')}
      description={t('dialogs.unsavedChangesDescription')}
      confirmText={t('dialogs.leaveWithoutSaving')}
      cancelText={t('dialogs.stayOnPage')}
      onConfirm={onConfirm}
      variant="warning"
    />
  );
}
