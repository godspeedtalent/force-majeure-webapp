
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/common/shadcn/dialog';
import { Button } from '@/components/common/shadcn/button';
import { Trash2 } from 'lucide-react';

interface BatchDeleteDialogProps<T> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRows: T[];
  resourceName: string;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function FmDataGridBatchDeleteDialog<T extends Record<string, any>>({
  open,
  onOpenChange,
  selectedRows,
  resourceName,
  onConfirm,
  isDeleting,
}: BatchDeleteDialogProps<T>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Batch Delete</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete {selectedRows.length} {resourceName}
            {selectedRows.length !== 1 ? 's' : ''}? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className='py-4'>
          <div className='text-sm text-muted-foreground mb-2'>
            Items to be deleted:
          </div>
          <div className='max-h-48 overflow-y-auto space-y-1 rounded-none bg-muted/30 p-3'>
            {selectedRows.slice(0, 10).map((row, idx) => (
              <div key={idx} className='text-sm'>
                •{' '}
                {row['name' as keyof T] ||
                  row['title' as keyof T] ||
                  row['id' as keyof T] ||
                  `${resourceName} ${idx + 1}`}
              </div>
            ))}
            {selectedRows.length > 10 && (
              <div className='text-sm text-muted-foreground italic'>
                ... and {selectedRows.length - 10} more
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button variant='destructive' onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <div className='h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent' />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className='h-4 w-4 mr-2' />
                Delete {selectedRows.length}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
