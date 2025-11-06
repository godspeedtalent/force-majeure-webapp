import { TableRow, TableCell } from '@/components/common/shadcn/table';
import { FmCommonCheckbox } from '@/components/common/forms/FmCommonCheckbox';
import { MoreVertical } from 'lucide-react';
import { useDataGridContext } from '../../context/DataGridContext';
import { DataGridCell } from './DataGridCell';
import { Button } from '@/components/common/shadcn/button';
import { cn } from '@/shared/utils/utils';

interface DataGridRowProps<TData = any> {
  row?: TData;
  rowIndex?: number;
  isNewRow?: boolean;
}

/**
 * Individual table row component
 */
export function DataGridRow<TData extends Record<string, any>>({
  row,
  rowIndex,
  isNewRow = false,
}: DataGridRowProps<TData>) {
  const { columns, selection, rowActions, pagination, creation } = useDataGridContext<TData>();

  const globalIndex = rowIndex !== undefined
    ? (pagination.currentPage - 1) * pagination.pageSize + rowIndex
    : -1;

  const isSelected = selection.enabled && globalIndex >= 0 && selection.selectedRows.has(globalIndex);

  const handleRowClick = (event: React.MouseEvent) => {
    if (rowIndex !== undefined && selection.enabled) {
      selection.toggleRow(globalIndex, event);
    }
  };

  const hasActions = rowActions && rowActions.length > 0;

  return (
    <TableRow
      className={cn(
        'cursor-pointer',
        isSelected && 'bg-muted/50',
        isNewRow && 'bg-blue-50 dark:bg-blue-950/20'
      )}
      onClick={!isNewRow ? handleRowClick : undefined}
    >
      {selection.enabled && (
        <TableCell onClick={(e) => e.stopPropagation()}>
          {!isNewRow && selection.mode === 'multiple' && (
            <FmCommonCheckbox
              checked={isSelected}
              onCheckedChange={() => selection.toggleRow(globalIndex)}
              aria-label={`Select row ${rowIndex}`}
            />
          )}
        </TableCell>
      )}
      
      {columns.map((column) => (
        <DataGridCell
          key={column.key}
          column={column}
          row={row}
          rowIndex={rowIndex}
          isNewRow={isNewRow}
        />
      ))}

      <TableCell onClick={(e) => e.stopPropagation()}>
        {isNewRow ? (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={creation.saveCreate}
              className="bg-fm-gold hover:bg-fm-gold/90"
            >
              Save
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={creation.cancelCreate}
            >
              Cancel
            </Button>
          </div>
        ) : hasActions ? (
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        ) : null}
      </TableCell>
    </TableRow>
  );
}
