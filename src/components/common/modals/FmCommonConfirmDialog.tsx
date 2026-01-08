/**
 * FmCommonConfirmDialog
 *
 * Standardized confirmation dialog for destructive or important actions
 * Provides consistent UX for confirmations across the app
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/common/shadcn/alert-dialog';
import { cn } from '@/shared';
import { FmI18nCommon } from '@/components/common/i18n';

interface FmCommonConfirmDialogProps {
  /** Whether dialog is open */
  open: boolean;
  /** Callback when dialog state changes */
  onOpenChange: (open: boolean) => void;
  /** Dialog title */
  title: string;
  /** Dialog description/message */
  description: string;
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Callback when confirmed */
  onConfirm: () => void | Promise<void>;
  /** Dialog variant for styling */
  variant?: 'default' | 'destructive' | 'warning';
  /** Loading state */
  isLoading?: boolean;
}

const variantConfig = {
  default: {
    confirmButton: 'bg-primary text-primary-foreground hover:bg-primary/90',
  },
  destructive: {
    confirmButton:
      'bg-destructive/20 backdrop-blur-sm border border-destructive text-destructive hover:bg-destructive hover:text-black hover:border-destructive shadow-[0_0_12px_hsl(var(--destructive)/0.2)] hover:shadow-[0_0_20px_hsl(var(--destructive)/0.4)] transition-all duration-200',
  },
  warning: {
    confirmButton: 'bg-fm-gold/20 backdrop-blur-sm border border-fm-gold text-fm-gold hover:bg-fm-gold hover:text-black hover:border-fm-gold shadow-[0_0_12px_rgba(223,186,125,0.2)] hover:shadow-[0_0_20px_rgba(223,186,125,0.4)] transition-all duration-200',
  },
};

export const FmCommonConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText,
  cancelText,
  onConfirm,
  variant = 'default',
  isLoading = false,
}: FmCommonConfirmDialogProps) => {
  const config = variantConfig[variant];

  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {cancelText || <FmI18nCommon i18nKey='buttons.cancel' />}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn(config.confirmButton)}
          >
            {isLoading ? (
              <FmI18nCommon i18nKey='buttons.loading' />
            ) : (
              confirmText || <FmI18nCommon i18nKey='buttons.confirm' />
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
