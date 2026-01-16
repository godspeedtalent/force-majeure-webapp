import { useRef, useState, useEffect } from 'react';
import { TableCell } from '@/components/common/shadcn/table';
import { Input } from '@/components/common/shadcn/input';
import { Textarea } from '@/components/common/shadcn/textarea';
import { Switch } from '@/components/common/shadcn/switch';
import { Button } from '@/components/common/shadcn/button';
import { Calendar } from '@/components/common/shadcn/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/shadcn/select';
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
import { cn, logger } from '@/shared';
import { DataGridColumn } from '../FmDataGrid';
import { isRelationField, getRelationConfig } from '../../utils/dataGridRelations';

/** Hook to detect if text is truncated (overflowing) */
function useIsTruncated(ref: React.RefObject<HTMLElement>) {
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const checkTruncation = () => {
      setIsTruncated(element.scrollWidth > element.clientWidth);
    };

    checkTruncation();

    // Re-check on resize
    const resizeObserver = new ResizeObserver(checkTruncation);
    resizeObserver.observe(element);

    return () => resizeObserver.disconnect();
  }, [ref]);

  return isTruncated;
}

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
  frozenLeft?: number; // Left position if column is frozen
  columnWidths?: Record<string, number>; // Column widths for alignment
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
  frozenLeft,
  columnWidths = {},
}: FmDataGridCellProps<T>) {
  const textRef = useRef<HTMLSpanElement>(null);
  const isTruncated = useIsTruncated(textRef);

  const relationConfig = isRelationField(column.key)
    ? getRelationConfig(column.key)
    : null;

  const isEditableCell =
    column.editable &&
    !column.readonly &&
    onUpdate &&
    column.type !== 'boolean' &&
    column.type !== 'created_date';

  // Get conditional cell styling if defined
  const conditionalStyle = column.cellStyle ? column.cellStyle(value, row) : undefined;

  // Get the text content for tooltip (only for simple text display)
  const textContent = !column.render && !relationConfig && column.type !== 'boolean'
    ? (value?.toString() || '-')
    : null;

  const cellContent = (
    <TableCell
      data-cell-column={column.key}
      className={cn(
        'font-medium transition-all duration-200 border-l border-r border-border/60',
        // Highlight entire column on hover
        !isDragMode && hoveredColumn === column.key && 'bg-fm-gold/10 shadow-[inset_0_0_0_1px_rgba(223,186,125,0.2)]',
        isEditing && 'bg-fm-gold/10 ring-1 ring-fm-gold/30',
        isEditableCell && 'cursor-pointer hover:bg-muted/20',
        // Frozen column styling
        column.frozen && 'sticky bg-background/95 backdrop-blur-sm shadow-[2px_0_4px_rgba(0,0,0,0.1)]',
        // Allow column-specific className overrides (e.g., p-0 for images)
        column.cellClassName,
        // Conditional cell styling based on value
        conditionalStyle
      )}
      style={{
        ...(columnWidths[column.key]
          ? {
              width: `${columnWidths[column.key]}px`,
              minWidth: `${columnWidths[column.key]}px`,
              maxWidth: `${columnWidths[column.key]}px`,
            }
          : column.width
          ? { width: column.width }
          : {}),
        ...(column.frozen && frozenLeft !== undefined
          ? {
              position: 'sticky',
              left: `${frozenLeft}px`,
              zIndex: 10,
            }
          : {}),
      }}
      {...(column.editable && !column.readonly && onUpdate ? focusableProps : {})}
      onMouseEnter={() => {}}
      onMouseLeave={() => {}}
      onClick={e => {
        // Debug logging for organization_id
        if (column.key === 'organization_id') {
          logger.info('Organization cell clicked', {
            columnKey: column.key,
            editable: column.editable,
            readonly: column.readonly,
            hasOnUpdate: !!onUpdate,
            columnType: column.type,
            isEditableCell,
            isEditing,
            hasRelationConfig: !!relationConfig,
            source: 'FmDataGridCell',
          });
        }

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
          if (column.key === 'organization_id') {
            logger.info('Organization cell click blocked - interactive element', { source: 'FmDataGridCell' });
          }
          return;
        }

        if (isEditableCell) {
          if (column.key === 'organization_id') {
            logger.info('Organization cell entering edit mode', { source: 'FmDataGridCell' });
          }
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
              onChange: (newValue) => {
                if (column.key === 'organization_id') {
                  logger.info('Organization dropdown onChange', { newValue, source: 'FmDataGridCell' });
                }
                onEditValueChange(newValue);
              },
              onComplete: () => {
                if (column.key === 'organization_id') {
                  logger.info('Organization dropdown onComplete - calling onSaveEdit', { source: 'FmDataGridCell' });
                }
                onSaveEdit();
              },
            })}
          </div>
        ) : column.type === 'boolean' ? (
          <div
            onClick={e => e.stopPropagation()}
            className='flex items-center gap-2'
            data-no-select
          >
            <Switch
              checked={(typeof editValue === 'boolean' && editValue) || (typeof editValue === 'string' && editValue === 'true')}
              onCheckedChange={checked => {
                onEditValueChange(checked.toString());
                onSaveEdit(checked);
              }}
              className='data-[state=checked]:bg-fm-gold'
            />
            <span className='text-sm'>
              {(typeof editValue === 'boolean' && editValue) || (typeof editValue === 'string' && editValue === 'true') ? 'Yes' : 'No'}
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
        ) : column.type === 'select' && column.options ? (
          <div onClick={e => e.stopPropagation()} data-no-select>
            <Select
              value={editValue}
              onValueChange={value => {
                onEditValueChange(value);
                onSaveEdit(value);
              }}
            >
              <SelectTrigger className='h-8 bg-background border-fm-gold/50'>
                <SelectValue placeholder='Select...' />
              </SelectTrigger>
              <SelectContent className='z-50 bg-background border-border'>
                {column.options.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : column.multiline ? (
          <Textarea
            value={editValue}
            onChange={e => onEditValueChange(e.target.value)}
            onBlur={() => onSaveEdit()}
            onKeyDown={e => {
              // For multiline, use Ctrl+Enter or Cmd+Enter to save
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                onSaveEdit();
              } else if (e.key === 'Escape') {
                onCancelEdit();
              }
            }}
            autoFocus
            rows={column.rows || 3}
            className='min-h-[80px] bg-background/50 border-fm-gold/50 text-sm'
          />
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
            <div
              className={cn(
                'transition-colors',
                hoveredColumn === column.key && 'text-fm-gold [&_*]:text-fm-gold'
              )}
            >
              {column.render(value, row)}
            </div>
          ) : relationConfig &&
            relationConfig.displayField &&
            row[relationConfig.displayField] ? (
            <span
              className={cn(
                'transition-colors truncate block',
                hoveredColumn === column.key && 'text-fm-gold'
              )}
            >
              {row[relationConfig.displayField]?.name ||
                row[relationConfig.displayField] ||
                '-'}
            </span>
          ) : textContent ? (
            // Plain text with truncation tooltip
            isTruncated ? (
              <TooltipProvider>
                <Tooltip delayDuration={500}>
                  <TooltipTrigger asChild>
                    <span
                      ref={textRef}
                      className={cn(
                        'transition-colors truncate block cursor-default',
                        hoveredColumn === column.key && 'text-fm-gold'
                      )}
                    >
                      {textContent}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side='top' className='max-w-md break-words'>
                    <p className='text-xs whitespace-pre-wrap'>{textContent}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <span
                ref={textRef}
                className={cn(
                  'transition-colors truncate block',
                  hoveredColumn === column.key && 'text-fm-gold'
                )}
              >
                {textContent}
              </span>
            )
          ) : (
            <span
              className={cn(
                'transition-colors',
                hoveredColumn === column.key && 'text-fm-gold'
              )}
            >
              {value?.toString() || '-'}
            </span>
          )}
        </div>
      )}
    </TableCell>
  );

  // Return cell content directly (no tooltip)
  return cellContent;
}
