import { TableCell } from '@/components/common/shadcn/table';
import { Input } from '@/components/common/shadcn/input';
import { Switch } from '@/components/common/shadcn/switch';
import { Calendar } from '@/components/common/shadcn/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/common/shadcn/popover';
import { Button } from '@/components/common/shadcn/button';
import { CalendarIcon } from 'lucide-react';
import { format as formatDate } from 'date-fns';
import { useDataGridContext } from '../../context/DataGridContext';
import { ColumnDef } from '../../types';
import { cn } from '@/shared/utils/utils';

interface DataGridCellProps<TData = any> {
  column: ColumnDef<TData>;
  row?: TData;
  rowIndex?: number;
  isNewRow?: boolean;
}

/**
 * Individual table cell component with inline editing support
 */
export function DataGridCell<TData extends Record<string, any>>({
  column,
  row,
  rowIndex,
  isNewRow = false,
}: DataGridCellProps<TData>) {
  const { editing, creation } = useDataGridContext<TData>();

  const isEditing =
    !isNewRow &&
    editing.editingCell?.rowIndex === rowIndex &&
    editing.editingCell?.columnKey === column.key;

  const cellValue = isNewRow
    ? creation.newRowData[column.key as keyof TData]
    : row?.[column.key as keyof TData];

  // Handle editing interactions
  const handleCellClick = () => {
    if (!isNewRow && column.editable && !column.readonly && row) {
      editing.startEdit(rowIndex!, column.key, cellValue);
    }
  };

  const handleSave = async () => {
    if (row) {
      await editing.saveEdit(row, column.key);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      editing.cancelEdit();
    }
  };

  const handleFieldChange = (value: any) => {
    if (isNewRow) {
      creation.updateNewRowField(column.key, value);
    } else {
      editing.setEditValue(value);
    }
  };

  // Render edit mode
  if (isEditing || (isNewRow && column.editable)) {
    const currentValue = isNewRow ? cellValue : editing.editValue;

    // Boolean type
    if (column.type === 'boolean') {
      return (
        <TableCell onClick={(e) => e.stopPropagation()}>
          <Switch
            checked={Boolean(currentValue)}
            onCheckedChange={(checked) => {
              if (isNewRow) {
                handleFieldChange(checked);
              } else {
                editing.saveEdit(row!, column.key, checked);
              }
            }}
          />
        </TableCell>
      );
    }

    // Date type
    if (column.type === 'date') {
      const dateValue = currentValue ? new Date(currentValue) : undefined;

      return (
        <TableCell onClick={(e) => e.stopPropagation()}>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !dateValue && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateValue ? formatDate(dateValue, 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dateValue}
                onSelect={(date) => {
                  const isoString = date?.toISOString();
                  if (isNewRow) {
                    handleFieldChange(isoString);
                  } else {
                    editing.saveEdit(row!, column.key, isoString);
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </TableCell>
      );
    }

    // Text/Number/Email/URL input
    return (
      <TableCell onClick={(e) => e.stopPropagation()}>
        <Input
          type={column.type || 'text'}
          value={currentValue != null ? String(currentValue) : ''}
          onChange={(e) => handleFieldChange(e.target.value)}
          onBlur={!isNewRow ? handleSave : undefined}
          onKeyDown={handleKeyDown}
          autoFocus={!isNewRow}
          className="h-8"
        />
      </TableCell>
    );
  }

  // Render display mode
  const displayValue = column.render
    ? column.render(cellValue, row!)
    : cellValue?.toString() || '';

  // Handle boolean display
  const booleanDisplay = column.type === 'boolean' ? (
    <Switch checked={Boolean(cellValue)} disabled />
  ) : null;

  // Handle date display
  const dateDisplay =
    column.type === 'date' && cellValue
      ? formatDate(new Date(cellValue), 'PPP')
      : null;

  return (
    <TableCell
      onClick={handleCellClick}
      className={cn(
        column.editable && !column.readonly && 'cursor-text hover:bg-muted/30',
        'transition-colors'
      )}
    >
      {booleanDisplay || dateDisplay || displayValue}
    </TableCell>
  );
}
