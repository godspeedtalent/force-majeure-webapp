/**
 * DeleteSubmissionModal Component
 *
 * Confirmation modal for permanently deleting a submission.
 * Shows submission details and prominent warning about irreversible action.
 * Only accessible to admin and developer roles.
 *
 * @example
 * ```tsx
 * <DeleteSubmissionModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   submission={submissionToDelete}
 *   onConfirm={handleDelete}
 * />
 * ```
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Music, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/common/shadcn/dialog';
import { Button } from '@/components/common/shadcn/button';
import type { ScreeningSubmissionWithDetails } from '../types';

interface DeleteSubmissionModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Submission to delete */
  submission: ScreeningSubmissionWithDetails | null;
  /** Callback to execute deletion (async) */
  onConfirm: () => Promise<void>;
}

/**
 * Confirmation modal for hard deletion of submissions
 *
 * Features:
 * - Displays submission details (artist, recording)
 * - Prominent warning about irreversible action
 * - Disabled state during deletion
 * - Cancel and Delete buttons
 */
export function DeleteSubmissionModal({
  open,
  onOpenChange,
  submission,
  onConfirm,
}: DeleteSubmissionModalProps) {
  const { t } = useTranslation('common');
  const { t: tToast } = useTranslation('toasts');
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle delete action
  const handleDelete = async () => {
    if (!submission) return;

    setIsDeleting(true);
    try {
      await onConfirm();
      toast.success(tToast('submissions.submissionDeleted', 'Submission deleted permanently'));
      onOpenChange(false);
    } catch (error) {
      // Error already handled by service layer
      // Just log for debugging
      console.error('Delete submission error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!submission) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle className='text-fm-danger font-canela'>
            Delete Submission
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-[20px] py-[20px]'>
          {/* Confirmation question */}
          <p className='text-white/80'>
            Are you sure you want to permanently delete this submission?
          </p>

          {/* Submission details */}
          <div className='bg-black/40 border border-white/10 p-[20px] space-y-[10px] rounded-none'>
            <div className='flex items-center gap-[10px]'>
              <User className='h-4 w-4 text-muted-foreground flex-shrink-0' />
              <span className='text-sm font-medium text-white'>
                {submission.artists.name}
              </span>
            </div>
            <div className='flex items-center gap-[10px]'>
              <Music className='h-4 w-4 text-muted-foreground flex-shrink-0' />
              <span className='text-sm text-muted-foreground'>
                {submission.artist_recordings.name}
              </span>
            </div>
          </div>

          {/* Warning box */}
          <div className='bg-fm-danger/10 border border-fm-danger/30 p-[20px] rounded-none'>
            <div className='flex gap-[10px]'>
              <AlertTriangle className='h-5 w-5 text-fm-danger flex-shrink-0 mt-0.5' />
              <div className='text-sm text-fm-danger space-y-[5px]'>
                <p className='font-medium'>Warning: This action cannot be undone.</p>
                <p>
                  The submission will be permanently removed from the database with no
                  paper trail. All associated reviews, scores, and tags will also be
                  deleted.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className='border-white/20 hover:bg-white/10'
          >
            {t('buttons.cancel', 'Cancel')}
          </Button>
          <Button
            variant='destructive'
            onClick={handleDelete}
            disabled={isDeleting}
            className='bg-fm-danger hover:bg-fm-danger/90 text-white'
          >
            {isDeleting
              ? t('buttons.deleting', 'Deleting...')
              : t('buttons.deletePermanently', 'Delete Permanently')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
