import React from 'react';
import { TableCell } from '@/components/common/shadcn/table';
import { Input } from '@/components/common/shadcn/input';
import { Switch } from '@/components/common/shadcn/switch';
import { Button } from '@/components/common/shadcn/button';
import { Calendar } from '@/components/common/shadcn/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/common/shadcn/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/common/shadcn/tooltip';
import { format as formatDate } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/shared/utils/utils';
import { DataGridColumn } from '../FmDataGrid';
import { isRelationField, getRelationConfig } from '../../utils/dataGridRelations';

export interface FmDataGridCellProps<T> {
  row: T;
  column: DataGridColumn<T>;
  value: any;
  isEditing: boolean;
  editValue: string;
  onEditValueChange: (value: string) => void;
  onStartEdit: () => void;
  onSaveEdit: (overrideValue?: any) => void;
  onCancelEdit: () => void;
  onUpdate?: (row: T, columnKey: string, newValue: any) => Promise<void>;
  hoveredColumn: string | null;
  isDragMode: boolean;
  focusableProps?: any;
}

export function FmDataGridCell<T extends Record<string, any>>({
  row,
  column,
  value,
  isEditing,
  editValue,
  onEditValueChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onUpdate,
  hoveredColumn,
  isDragMode,
  focusableProps = {},
}: FmDataGridCellProps<T>) {
  const relationConfig = isRelationField(column.key)
    ? getRelationConfig(column.key)
    : null;

  const isEditableCell =
    column.editable &&
    !column.readonly &&
    onUpdate &&
    column.type !== 'boolean' &&
    column.type !== 'created_date';

  const cellContent = (
    <TableCell
      className={cn(
        'font-medium transition-colors duration-200',
        !isDragMode && hoveredColumn === column.key && 'bg-muted/30',
        isEditing && 'bg-fm-gold/10 ring-1 ring-fm-gold/30',
        isEditableCell && 'cursor-pointer'
      )}
      {...(column.editable && !column.readonly && onUpdate ? focusableProps : {})}
      onMouseEnter={() => {}}
      onMouseLeave={() => {}}
      onClick={e => {
        // Don't interfere with interactive elements (selects, buttons, inputs, etc.)
        const target = e.target as HTMLElement;
        const isInteractiveElement =
          target.closest('button') ||
          target.closest('[role="combobox"]') ||
          target.closest('[data-radix-select-trigger]') ||
          target.closest('[data-radix-dropdown-menu-trigger]') ||
          target.closest('input') ||
          target.closest('textarea') ||
          target.closest('select') ||
          target.closest('[role="checkbox"]') ||
          target.closest('[role="switch"]');

        if (isInteractiveElement) {
          // Let the interactive element handle the event
          return;
        }

        if (isEditableCell) {
          onStartEdit();
        }
      }}
    >
      {isEditing ? (
        // Editing mode
        relationConfig ? (
          <div onClick={e => e.stopPropagation()}>
            {relationConfig.component({
              value: editValue,
              onChange: onEditValueChange,
              onComplete: () => onSaveEdit(),
            })}
          </div>
        ) : column.type === 'boolean' ? (
          <div
            onClick={e => e.stopPropagation()}
            className='flex items-center gap-2'
            data-no-select
          >
            <Switch
              checked={editValue === 'true' || editValue === true}
              onCheckedChange={checked => {
                onEditValueChange(checked.toString());
                onSaveEdit(checked);
              }}
              className='data-[state=checked]:bg-fm-gold'
            />
            <span className='text-sm'>
              {editValue === 'true' || editValue === true ? 'Yes' : 'No'}
            </span>
          </div>
        ) : column.type === 'date' ? (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant='outline'
                className='w-full justify-start text-left font-normal h-8'
                onClick={e => e.stopPropagation()}
              >
                <CalendarIcon className='mr-2 h-4 w-4' />
                {editValue ? formatDate(new Date(editValue), 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-auto p-0' align='start'>
              <Calendar
                mode='single'
                selected={editValue ? new Date(editValue) : undefined}
                onSelect={date => {
                  if (date) {
                    onEditValueChange(date.toISOString());
                    onSaveEdit(date.toISOString());
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        ) : (
          <Input
            type={column.type || 'text'}
            value={editValue}
            onChange={e => onEditValueChange(e.target.value)}
            onBlur={() => onSaveEdit()}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                onSaveEdit();
              } else if (e.key === 'Escape') {
                onCancelEdit();
              }
            }}
            autoFocus
            className='h-8 bg-background/50 border-fm-gold/50'
          />
        )
      ) : (
        // Display mode
        <div className='flex items-center gap-2'>
          {column.type === 'boolean' ? (
            <div className='flex items-center gap-2' data-no-select>
              <Switch
                checked={value === true}
                onCheckedChange={checked => {
                  if (column.editable && !column.readonly && onUpdate) {
                    onSaveEdit(checked);
                  }
                }}
                disabled={!column.editable || column.readonly || !onUpdate}
                className='data-[state=checked]:bg-fm-gold'
              />
              <span className='text-sm'>{value ? 'Yes' : 'No'}</span>
            </div>
          ) : column.render ? (
            column.render(value, row)
          ) : relationConfig &&
            relationConfig.displayField &&
            row[relationConfig.displayField] ? (
            <span
              className={cn(
                'transition-colors',
                column.editable &&
                  !column.readonly &&
                  onUpdate &&
                  hoveredColumn === column.key &&
                  'text-fm-gold'
              )}
            >
              {row[relationConfig.displayField]?.name ||
                row[relationConfig.displayField] ||
                '-'}
            </span>
          ) : (
            <span
              className={cn(
                'transition-colors',
                column.editable &&
                  !column.readonly &&
                  onUpdate &&
                  column.type !== 'created_date' &&
                  hoveredColumn === column.key &&
                  'text-fm-gold'
              )}
            >
              {value?.toString() || '-'}
            </span>
          )}
        </div>
      )}
    </TableCell>
  );

  // Wrap with tooltip if editable
  return isEditableCell ? (
    <TooltipProvider key={column.key} delayDuration={2000}>
      <Tooltip>
        <TooltipTrigger asChild>{cellContent}</TooltipTrigger>
        <TooltipContent side='top' className='text-xs'>
          Click to edit
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : (
    cellContent
  );
}
