import { useState, useMemo } from 'react';
import { logger } from '@/shared/services/logger';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/common/shadcn/dialog';
import { Button } from '@/components/common/shadcn/button';
import { Label } from '@/components/common/shadcn/label';
import { Input } from '@/components/common/shadcn/input';
import { Switch } from '@/components/common/shadcn/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/shadcn/select';
import { Calendar } from '@/components/common/shadcn/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/common/shadcn/popover';
import { format as formatDate } from 'date-fns';
import { CalendarIcon, Check, AlertCircle } from 'lucide-react';
import { DataGridColumn } from './FmDataGrid';
import { cn } from '@/shared/utils/utils';

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
        !col.key.endsWith('_id') && // Exclude foreign keys
        !col.isRelation
    );
  }, [columns]);

  const handleToggleField = (columnKey: string, enabled: boolean) => {
    setEditEnabled(prev => ({ ...prev, [columnKey]: enabled }));

    // If disabling, clear the value
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
    // Build updates object with only enabled fields
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

      // Reset state
      setEditValues({});
      setEditEnabled({});
      onOpenChange(false);
    } catch (error) {
      logger.error('Bulk edit failed:', error);
    } finally {
      setIsApplying(false);
    }
  };

  const enabledFieldCount = Object.values(editEnabled).filter(Boolean).length;
  const canApply = enabledFieldCount > 0 && !isApplying;

  const renderFieldInput = (column: DataGridColumn<T>) => {
    const value = editValues[column.key];

    switch (column.type) {
      case 'boolean':
        return (
          <Switch
            checked={value ?? false}
            onCheckedChange={checked => handleValueChange(column.key, checked)}
            disabled={!editEnabled[column.key]}
          />
        );

      case 'date':
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant='outline'
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !value && 'text-muted-foreground',
                  !editEnabled[column.key] && 'opacity-50'
                )}
                disabled={!editEnabled[column.key]}
              >
                <CalendarIcon className='mr-2 h-4 w-4' />
                {value ? formatDate(new Date(value), 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-auto p-0' align='start'>
              <Calendar
                mode='single'
                selected={value ? new Date(value) : undefined}
                onSelect={date =>
                  handleValueChange(column.key, date?.toISOString())
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );

      case 'number':
        return (
          <Input
            type='number'
            value={value ?? ''}
            onChange={e =>
              handleValueChange(column.key, parseFloat(e.target.value))
            }
            disabled={!editEnabled[column.key]}
            placeholder='Enter number...'
          />
        );

      case 'email':
        return (
          <Input
            type='email'
            value={value ?? ''}
            onChange={e => handleValueChange(column.key, e.target.value)}
            disabled={!editEnabled[column.key]}
            placeholder='Enter email...'
          />
        );

      case 'url':
        return (
          <Input
            type='url'
            value={value ?? ''}
            onChange={e => handleValueChange(column.key, e.target.value)}
            disabled={!editEnabled[column.key]}
            placeholder='Enter URL...'
          />
        );

      default:
        return (
          <Input
            type='text'
            value={value ?? ''}
            onChange={e => handleValueChange(column.key, e.target.value)}
            disabled={!editEnabled[column.key]}
            placeholder='Enter value...'
          />
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl max-h-[85vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Bulk Edit Rows</DialogTitle>
          <DialogDescription>
            Edit common fields for {selectedRows.length} selected row
            {selectedRows.length !== 1 ? 's' : ''}. Enable fields you want to
            update and set their new values.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          {editableColumns.length === 0 ? (
            <div className='text-center py-8 text-muted-foreground'>
              No editable fields available for bulk edit
            </div>
          ) : (
            <>
              {/* Info banner */}
              <div className='flex items-start gap-3 p-3 rounded-none bg-blue-500/10 border border-blue-500/20'>
                <AlertCircle className='h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5' />
                <div className='text-sm space-y-1'>
                  <p className='font-medium'>How bulk edit works:</p>
                  <ul className='list-disc list-inside text-muted-foreground space-y-0.5'>
                    <li>Toggle on the fields you want to update</li>
                    <li>Set the new value for each enabled field</li>
                    <li>
                      All selected rows will be updated with the same values
                    </li>
                    <li>Disabled fields will remain unchanged</li>
                  </ul>
                </div>
              </div>

              {/* Field editors */}
              <div className='space-y-3'>
                {editableColumns.map(column => (
                  <div
                    key={column.key}
                    className={cn(
                      'flex items-start gap-4 p-4 rounded-none border transition-colors',
                      editEnabled[column.key]
                        ? 'bg-fm-gold/5 border-fm-gold/30'
                        : 'bg-muted/20 border-border/50'
                    )}
                  >
                    {/* Toggle */}
                    <div className='flex items-center pt-2'>
                      <Switch
                        checked={editEnabled[column.key] ?? false}
                        onCheckedChange={checked =>
                          handleToggleField(column.key, checked)
                        }
                      />
                    </div>

                    {/* Field info and input */}
                    <div className='flex-1 space-y-2'>
                      <div className='flex items-center justify-between'>
                        <Label className='text-base font-medium'>
                          {column.label}
                        </Label>
                        {column.required && (
                          <span className='text-xs text-muted-foreground'>
                            (Required)
                          </span>
                        )}
                      </div>
                      {renderFieldInput(column)}
                    </div>

                    {/* Status indicator */}
                    {editEnabled[column.key] && (
                      <div className='pt-2'>
                        <Check className='h-5 w-5 text-fm-gold' />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className='rounded-none bg-muted/30 p-4 space-y-2'>
                <div className='text-sm font-medium'>Summary</div>
                <div className='text-sm text-muted-foreground space-y-1'>
                  <div>
                    • {selectedRows.length} row
                    {selectedRows.length !== 1 ? 's' : ''} selected
                  </div>
                  <div>
                    • {enabledFieldCount} field
                    {enabledFieldCount !== 1 ? 's' : ''} will be updated
                  </div>
                  {enabledFieldCount > 0 && (
                    <div className='text-foreground font-medium mt-2'>
                      Fields to update:{' '}
                      {Object.keys(editEnabled)
                        .filter(k => editEnabled[k])
                        .map(k => editableColumns.find(c => c.key === k)?.label)
                        .join(', ')}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isApplying}
          >
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={!canApply}>
            {isApplying ? (
              <>
                <div className='h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent' />
                Applying...
              </>
            ) : (
              `Apply to ${selectedRows.length} row${selectedRows.length !== 1 ? 's' : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
