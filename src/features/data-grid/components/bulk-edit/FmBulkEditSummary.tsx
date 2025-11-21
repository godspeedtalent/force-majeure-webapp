
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
  const enabledFieldCount = Object.values(enabledFields).filter(Boolean).length;

  return (
    <div className='rounded-none bg-muted/30 p-4 space-y-2'>
      <div className='text-sm font-medium'>Summary</div>
      <div className='text-sm text-muted-foreground space-y-1'>
        <div>
          • {selectedRowCount} row{selectedRowCount !== 1 ? 's' : ''} selected
        </div>
        <div>
          • {enabledFieldCount} field{enabledFieldCount !== 1 ? 's' : ''} will be
          updated
        </div>
        {enabledFieldCount > 0 && (
          <div className='text-foreground font-medium mt-2'>
            Fields to update:{' '}
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
