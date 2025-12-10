
import { TableCell, TableRow } from '@/components/common/shadcn/table';
import { Button } from '@/components/common/shadcn/button';
import { Input } from '@/components/common/shadcn/input';
import { Plus } from 'lucide-react';
import { cn } from '@force-majeure/shared';
import { DataGridColumn } from '../FmDataGrid';
import { isRelationField, getRelationConfig } from '../../utils/dataGridRelations';

export interface FmDataGridNewRowProps<T> {
  columns: DataGridColumn<T>[];
  hasActions: boolean;
  isCreating: boolean;
  newRowData: Partial<T>;
  onFieldChange: (columnKey: string, value: any) => void;
  onSave: () => void;
  onCancel: () => void;
  onStartCreating: () => void;
  resourceName: string;
}

export function FmDataGridNewRow<T extends Record<string, any>>({
  columns,
  hasActions,
  isCreating,
  newRowData,
  onFieldChange,
  onSave,
  onCancel,
  onStartCreating,
  resourceName,
}: FmDataGridNewRowProps<T>) {
  if (isCreating) {
    return (
      <TableRow className='border-border/50 bg-fm-gold/5'>
        {/* Action Buttons */}
        <TableCell>
          <div className='flex gap-2'>
            <Button
              size='sm'
              variant='ghost'
              onClick={onSave}
              className='h-7 px-2 text-xs bg-fm-gold/20 hover:bg-fm-gold/30 text-fm-gold'
            >
              Save
            </Button>
            <Button
              size='sm'
              variant='ghost'
              onClick={onCancel}
              className='h-7 px-2 text-xs'
            >
              Cancel
            </Button>
          </div>
        </TableCell>

        {/* Input Fields */}
        {columns.map(column => {
          const relationConfig = isRelationField(column.key)
            ? getRelationConfig(column.key)
            : null;

          // Skip created_date fields - they are auto-populated
          if (column.type === 'created_date') {
            return (
              <TableCell key={column.key}>
                <div className='text-sm text-muted-foreground italic'>
                  Auto-populated
                </div>
              </TableCell>
            );
          }

          return (
            <TableCell key={column.key}>
              <div className='flex items-center gap-2'>
                {relationConfig ? (
                  relationConfig.component({
                    value: (newRowData[column.key as keyof T] as string) || '',
                    onChange: value => onFieldChange(column.key, value),
                  })
                ) : (
                  <Input
                    type={column.type || 'text'}
                    value={(newRowData[column.key as keyof T] as string) || ''}
                    onChange={e => onFieldChange(column.key, e.target.value)}
                    placeholder={column.label}
                    className={cn(
                      'h-8 bg-background/50',
                      column.required && 'border-fm-gold/50'
                    )}
                  />
                )}
                {column.required && <span className='text-fm-gold text-xs'>*</span>}
              </div>
            </TableCell>
          );
        })}

        {hasActions && <TableCell />}
      </TableRow>
    );
  }

  // Bottom "Add new" button row
  return (
    <TableRow
      className='border-border/50 hover:bg-fm-gold/5 transition-colors cursor-pointer'
      onClick={onStartCreating}
    >
      <TableCell
        colSpan={columns.length + 1 + (hasActions ? 1 : 0)}
        className='text-center py-3'
      >
        <button className='flex items-center justify-center gap-2 mx-auto text-muted-foreground hover:text-fm-gold transition-colors'>
          <Plus className='h-4 w-4' />
          <span className='text-sm'>Add new {resourceName.toLowerCase()}</span>
        </button>
      </TableCell>
    </TableRow>
  );
}
