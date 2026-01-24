
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/common/shadcn/dialog';
import { Button } from '@/components/common/shadcn/button';
import { FmGoldenGridLoader } from '@/components/common/feedback/FmGoldenGridLoader';
import { Trash2 } from 'lucide-react';
import { FmI18nCommon } from '@/components/common/i18n';

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
  const { t } = useTranslation('common');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('dataGrid.confirmBatchDelete')}</DialogTitle>
          <DialogDescription>
            {t('dataGrid.batchDeleteConfirmation', {
              count: selectedRows.length,
              resourceName: selectedRows.length !== 1 ? `${resourceName}s` : resourceName
            })}
          </DialogDescription>
        </DialogHeader>
        <div className='py-4'>
          <FmI18nCommon i18nKey='dataGrid.itemsToBeDeleted' as='div' className='text-sm text-muted-foreground mb-2' />
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
                {t('dataGrid.andMoreItems', { count: selectedRows.length - 10 })}
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
            {t('buttons.cancel')}
          </Button>
          <Button variant='destructive' onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <FmGoldenGridLoader size="sm" className="mr-2" />
                {t('dataGrid.deleting')}
              </>
            ) : (
              <>
                <Trash2 className='h-4 w-4 mr-2' />
                {t('dataGrid.deleteCount', { count: selectedRows.length })}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
