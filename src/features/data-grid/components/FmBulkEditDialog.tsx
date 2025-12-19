import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { logger } from '@/shared';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/common/shadcn/dialog';
import { Button } from '@/components/common/shadcn/button';
import { DataGridColumn } from './FmDataGrid';
import { FmBulkEditField } from './bulk-edit/FmBulkEditField';
import { FmBulkEditSummary } from './bulk-edit/FmBulkEditSummary';
import { FmBulkEditInfoBanner } from './bulk-edit/FmBulkEditInfoBanner';

interface FmBulkEditDialogProps<T = any> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: DataGridColumn<T>[];
  selectedRows: T[];
  onApply: (updates: Partial<T>) => Promise<void>;
}

export function FmBulkEditDialog<T = any>({
  open,
  onOpenChange,
  columns,
  selectedRows,
  onApply,
}: FmBulkEditDialogProps<T>) {
  const { t } = useTranslation('common');
  const [editValues, setEditValues] = useState<Record<string, any>>({});
  const [editEnabled, setEditEnabled] = useState<Record<string, boolean>>({});
  const [isApplying, setIsApplying] = useState(false);

  // Get editable columns (exclude readonly and id fields)
  const editableColumns = useMemo(() => {
    return columns.filter(
      col =>
        col.editable &&
        !col.readonly &&
        col.key !== 'id' &&
        !col.key.endsWith('_id') &&
        !col.isRelation
    );
  }, [columns]);

  const handleToggleField = (columnKey: string, enabled: boolean) => {
    setEditEnabled(prev => ({ ...prev, [columnKey]: enabled }));

    if (!enabled) {
      setEditValues(prev => {
        const next = { ...prev };
        delete next[columnKey];
        return next;
      });
    }
  };

  const handleValueChange = (columnKey: string, value: any) => {
    setEditValues(prev => ({ ...prev, [columnKey]: value }));
  };

  const handleApply = async () => {
    const updates: Partial<T> = {};
    Object.entries(editEnabled).forEach(([key, enabled]) => {
      if (enabled && editValues[key] !== undefined) {
        updates[key as keyof T] = editValues[key];
      }
    });

    if (Object.keys(updates).length === 0) {
      return;
    }

    setIsApplying(true);
    try {
      await onApply(updates);

      setEditValues({});
      setEditEnabled({});
      onOpenChange(false);
    } catch (error) {
      logger.error('Bulk edit failed:', { error: error instanceof Error ? error.message : 'Unknown' });
    } finally {
      setIsApplying(false);
    }
  };

  const enabledFieldCount = Object.values(editEnabled).filter(Boolean).length;
  const canApply = enabledFieldCount > 0 && !isApplying;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl max-h-[85vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{t('dialogs.bulkEdit')}</DialogTitle>
          <DialogDescription>
            {t('dialogs.bulkEditDescription', { count: selectedRows.length })}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          {editableColumns.length === 0 ? (
            <div className='text-center py-8 text-muted-foreground'>
              {t('dialogs.noEditableFields')}
            </div>
          ) : (
            <>
              {/* Info banner */}
              <FmBulkEditInfoBanner />

              {/* Field editors */}
              <div className='space-y-3'>
                {editableColumns.map(column => (
                  <FmBulkEditField
                    key={column.key}
                    column={column}
                    value={editValues[column.key]}
                    enabled={editEnabled[column.key] ?? false}
                    onToggle={enabled => handleToggleField(column.key, enabled)}
                    onValueChange={value => handleValueChange(column.key, value)}
                  />
                ))}
              </div>

              {/* Summary */}
              <FmBulkEditSummary
                selectedRowCount={selectedRows.length}
                enabledFields={editEnabled}
                editableColumns={editableColumns}
              />
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isApplying}
          >
            {t('buttons.cancel')}
          </Button>
          <Button onClick={handleApply} disabled={!canApply}>
            {isApplying ? (
              <>
                <div className='h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent' />
                {t('dialogs.applying')}
              </>
            ) : (
              t('buttons.apply')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
