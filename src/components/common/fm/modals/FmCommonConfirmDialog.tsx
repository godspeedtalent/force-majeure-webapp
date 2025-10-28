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
} from '@/components/ui/shadcn/alert-dialog';
import { cn } from '@/shared/utils/utils';

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
    confirmButton: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  },
  warning: {
    confirmButton: 'bg-yellow-600 text-white hover:bg-yellow-700',
  },
};

export const FmCommonConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
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
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn(config.confirmButton)}
          >
            {isLoading ? 'Loading...' : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
