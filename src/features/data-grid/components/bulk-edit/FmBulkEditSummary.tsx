import { useTranslation } from 'react-i18next';

import { DataGridColumn } from '../FmDataGrid';

export interface FmBulkEditSummaryProps {
  selectedRowCount: number;
  enabledFields: Record<string, boolean>;
  editableColumns: DataGridColumn[];
}

export function FmBulkEditSummary({
  selectedRowCount,
  enabledFields,
  editableColumns,
}: FmBulkEditSummaryProps) {
  const { t } = useTranslation('common');
  const enabledFieldCount = Object.values(enabledFields).filter(Boolean).length;

  return (
    <div className='rounded-none bg-muted/30 p-4 space-y-2'>
      <div className='text-sm font-medium'>{t('bulkEdit.summary')}</div>
      <div className='text-sm text-muted-foreground space-y-1'>
        <div>
          • {t('bulkEdit.rowsSelected', { count: selectedRowCount })}
        </div>
        <div>
          • {t('bulkEdit.fieldsToBeUpdated', { count: enabledFieldCount })}
        </div>
        {enabledFieldCount > 0 && (
          <div className='text-foreground font-medium mt-2'>
            {t('bulkEdit.fieldsToUpdate')}{' '}
            {Object.keys(enabledFields)
              .filter(k => enabledFields[k])
              .map(k => editableColumns.find(c => c.key === k)?.label)
              .join(', ')}
          </div>
        )}
      </div>
    </div>
  );
}
