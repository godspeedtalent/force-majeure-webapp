import { useState } from 'react';
import { X, Check, Pencil } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/common/shadcn/sheet';
import { Button } from '@/components/common/shadcn/button';
import { Input } from '@/components/common/shadcn/input';
import { Textarea } from '@/components/common/shadcn/textarea';
import { Switch } from '@/components/common/shadcn/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/shadcn/select';
import { toast } from 'sonner';
import { cn } from '@/shared';
import { FmMobileDataGridDetailDrawerProps } from './types';
import { DataGridColumn } from '../../types';

/**
 * Format a value for display
 */
function formatValue(value: any, column: DataGridColumn): React.ReactNode {
  if (value === null || value === undefined) return '-';
  
  if (column.render) {
    return column.render(value, {});
  }
  
  if (column.type === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  
  if (column.type === 'date' || column.type === 'created_date') {
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  }
  
  if (column.type === 'select' && column.options) {
    const option = column.options.find(o => o.value === value);
    return option?.label ?? value;
  }
  
  return String(value);
}

/**
 * Inline field editor component
 */
function FieldEditor({
  column,
  value,
  onSave,
  onCancel,
}: {
  column: DataGridColumn;
  value: any;
  onSave: (newValue: any) => void;
  onCancel: () => void;
}) {
  const [editValue, setEditValue] = useState(value ?? '');
  
  const handleSave = () => {
    onSave(editValue);
  };
  
  // Boolean editor
  if (column.type === 'boolean') {
    return (
      <div className='flex items-center justify-between gap-2'>
        <Switch
          checked={!!editValue}
          onCheckedChange={checked => {
            setEditValue(checked);
            onSave(checked);
          }}
        />
        <Button variant='ghost' size='icon' className='h-8 w-8' onClick={onCancel}>
          <X className='h-4 w-4' />
        </Button>
      </div>
    );
  }
  
  // Select editor
  if (column.type === 'select' && column.options) {
    return (
      <div className='flex items-center gap-2'>
        <Select
          value={editValue}
          onValueChange={val => {
            setEditValue(val);
            onSave(val);
          }}
        >
          <SelectTrigger className='flex-1'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className='bg-popover z-50'>
            {column.options.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant='ghost' size='icon' className='h-8 w-8' onClick={onCancel}>
          <X className='h-4 w-4' />
        </Button>
      </div>
    );
  }
  
  // Multiline text editor
  if (column.multiline) {
    return (
      <div className='space-y-2'>
        <Textarea
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          rows={column.rows ?? 3}
          className='w-full'
          autoFocus
        />
        <div className='flex justify-end gap-2'>
          <Button variant='ghost' size='sm' onClick={onCancel}>
            Cancel
          </Button>
          <Button size='sm' onClick={handleSave}>
            <Check className='h-4 w-4 mr-1' />
            Save
          </Button>
        </div>
      </div>
    );
  }
  
  // Default text/number input
  return (
    <div className='flex items-center gap-2'>
      <Input
        type={column.type === 'number' ? 'number' : 'text'}
        value={editValue}
        onChange={e => setEditValue(e.target.value)}
        className='flex-1'
        autoFocus
        onKeyDown={e => {
          if (e.key === 'Enter') handleSave();
          if (e.key === 'Escape') onCancel();
        }}
      />
      <Button variant='ghost' size='icon' className='h-8 w-8' onClick={handleSave}>
        <Check className='h-4 w-4' />
      </Button>
      <Button variant='ghost' size='icon' className='h-8 w-8' onClick={onCancel}>
        <X className='h-4 w-4' />
      </Button>
    </div>
  );
}

/**
 * Detail drawer showing all fields of a record with inline editing
 */
export function FmMobileDataGridDetailDrawer<T extends Record<string, any>>({
  open,
  onOpenChange,
  row,
  columns,
  actions = [],
  onUpdate,
  resourceName = 'Record',
}: FmMobileDataGridDetailDrawerProps<T>) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  if (!row) return null;
  
  const handleSave = async (columnKey: string, newValue: any) => {
    if (!onUpdate) return;
    
    const oldValue = row[columnKey];
    if (newValue === oldValue) {
      setEditingField(null);
      return;
    }
    
    setIsUpdating(true);
    try {
      await onUpdate(row, columnKey, newValue);
      toast.success('Updated successfully');
      setEditingField(null);
    } catch (error) {
      toast.error('Failed to update');
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Separate editable and readonly columns
  const editableColumns = columns.filter(
    c => c.editable && !c.readonly && c.type !== 'created_date'
  );
  const readonlyColumns = columns.filter(
    c => !c.editable || c.readonly || c.type === 'created_date'
  );
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='right' className='w-full sm:max-w-md overflow-y-auto'>
        <SheetHeader className='mb-6'>
          <SheetTitle>{resourceName} Details</SheetTitle>
        </SheetHeader>
        
        <div className='space-y-6'>
          {/* Action buttons */}
          {actions.length > 0 && (
            <div className='flex flex-wrap gap-2'>
              {actions.map((action, idx) => {
                if (action.hidden && action.hidden(row)) return null;
                
                return (
                  <Button
                    key={idx}
                    variant={action.variant === 'destructive' ? 'destructive' : 'outline'}
                    size='sm'
                    onClick={() => {
                      action.onClick?.(row);
                      onOpenChange(false);
                    }}
                  >
                    {action.icon && <span className='mr-2'>{action.icon}</span>}
                    {action.label}
                  </Button>
                );
              })}
            </div>
          )}
          
          {/* Editable fields */}
          {editableColumns.length > 0 && onUpdate && (
            <div className='space-y-4'>
              <h4 className='text-sm font-medium text-muted-foreground uppercase tracking-wide'>
                Editable Fields
              </h4>
              <div className='space-y-4'>
                {editableColumns.map(column => (
                  <div key={column.key} className='space-y-1'>
                    <label className='text-sm font-medium text-foreground'>
                      {column.label}
                      {column.required && <span className='text-destructive ml-1'>*</span>}
                    </label>
                    
                    {editingField === column.key ? (
                      <FieldEditor
                        column={column}
                        value={row[column.key]}
                        onSave={newValue => handleSave(column.key, newValue)}
                        onCancel={() => setEditingField(null)}
                      />
                    ) : (
                      <div
                        className={cn(
                          'flex items-center justify-between gap-2 p-2 rounded-none border border-border/50',
                          'hover:bg-muted/30 cursor-pointer transition-colors',
                          isUpdating && 'opacity-50 pointer-events-none'
                        )}
                        onClick={() => setEditingField(column.key)}
                      >
                        <span className='text-sm truncate'>
                          {formatValue(row[column.key], column)}
                        </span>
                        <Pencil className='h-3.5 w-3.5 text-muted-foreground flex-shrink-0' />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Readonly fields */}
          {readonlyColumns.length > 0 && (
            <div className='space-y-4'>
              <h4 className='text-sm font-medium text-muted-foreground uppercase tracking-wide'>
                {onUpdate && editableColumns.length > 0 ? 'Read-only Fields' : 'All Fields'}
              </h4>
              <div className='space-y-3'>
                {readonlyColumns.map(column => (
                  <div key={column.key} className='space-y-1'>
                    <label className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>
                      {column.label}
                    </label>
                    <div className='text-sm text-foreground'>
                      {formatValue(row[column.key], column)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
