import { cn } from '@/shared';
import { ChevronRight, MoreVertical } from 'lucide-react';
import { FmMobileDataGridCardProps, MobileCardFieldConfig } from './types';
import { FmMobileDataGridField } from './FmMobileDataGridField';
import { Button } from '@/components/common/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/common/shadcn/dropdown-menu';
import { DataGridColumn } from '../../types';

/**
 * Get the display value for a cell, using custom render if available
 */
function getCellValue<T>(
  row: T,
  column: DataGridColumn<T>,
  value: any
): React.ReactNode {
  if (column.render) {
    return column.render(value, row);
  }
  
  // Handle boolean
  if (column.type === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  
  // Handle date
  if (column.type === 'date' || column.type === 'created_date') {
    if (!value) return '-';
    try {
      return new Date(value).toLocaleDateString();
    } catch {
      return value;
    }
  }
  
  // Handle select options
  if (column.type === 'select' && column.options) {
    const option = column.options.find(o => o.value === value);
    return option?.label ?? value ?? '-';
  }
  
  return value ?? '-';
}

/**
 * Generate default field config from columns if none provided
 */
export function getDefaultFieldConfig(
  columns: DataGridColumn[]
): MobileCardFieldConfig[] {
  // Try to find an image column (first one found)
  const imageColumn = columns.find(c => c.isImage);

  // Try to find a 'name' or 'title' column for the title
  const titleColumn = columns.find(
    c => c.key === 'name' || c.key === 'title' || c.key === 'label'
  );

  // Try to find a good subtitle column
  const subtitleColumn = columns.find(
    c =>
      c.key !== titleColumn?.key &&
      (c.key === 'email' ||
        c.key === 'description' ||
        c.key === 'status' ||
        c.type === 'select')
  );

  return columns
    .filter(c => c.key !== 'id') // Exclude id by default
    .map((col, index) => ({
      key: col.key,
      priority: index,
      showLabel: col.key !== titleColumn?.key && col.key !== subtitleColumn?.key,
      isTitle: col.key === titleColumn?.key,
      isSubtitle: col.key === subtitleColumn?.key,
      isImage: col.key === imageColumn?.key,
    }))
    .slice(0, 6); // Show max 6 fields by default (including image)
}

/**
 * Mobile card component for displaying a single data row
 * Shows stacked fields based on configuration
 *
 * When an image column is present, displays a two-column layout:
 * - Left (25%): Featured image
 * - Right (75%): Title, subtitle, and regular fields
 */
export function FmMobileDataGridCard<T extends Record<string, any>>({
  row,
  columns,
  fieldConfig,
  onClick,
  isSelected,
  actions = [],
}: FmMobileDataGridCardProps<T>) {
  // Sort fields by priority and separate by type
  const sortedFields = [...fieldConfig].sort((a, b) => a.priority - b.priority);
  const imageField = sortedFields.find(f => f.isImage);
  const titleField = sortedFields.find(f => f.isTitle);
  const subtitleField = sortedFields.find(f => f.isSubtitle);
  const regularFields = sortedFields.filter(
    f => !f.isTitle && !f.isSubtitle && !f.isImage
  );

  const getColumn = (key: string) => columns.find(c => c.key === key);

  // Render the text content (title, subtitle, regular fields)
  const renderTextContent = () => (
    <div className='flex-1 min-w-0 space-y-2'>
      {/* Title and subtitle row */}
      {(titleField || subtitleField) && (
        <div className='space-y-0.5'>
          {titleField && (
            <FmMobileDataGridField
              label={getColumn(titleField.key)?.label ?? titleField.key}
              value={getCellValue(
                row,
                getColumn(titleField.key)!,
                row[titleField.key]
              )}
              showLabel={false}
              isTitle
            />
          )}
          {subtitleField && (
            <FmMobileDataGridField
              label={getColumn(subtitleField.key)?.label ?? subtitleField.key}
              value={getCellValue(
                row,
                getColumn(subtitleField.key)!,
                row[subtitleField.key]
              )}
              showLabel={false}
              isSubtitle
            />
          )}
        </div>
      )}

      {/* Regular fields in a grid */}
      {regularFields.length > 0 && (
        <div className='grid grid-cols-2 gap-x-4 gap-y-2 pt-1'>
          {regularFields.map(field => {
            const column = getColumn(field.key);
            if (!column) return null;

            return (
              <FmMobileDataGridField
                key={field.key}
                label={column.label}
                value={getCellValue(row, column, row[field.key])}
                showLabel={field.showLabel}
              />
            );
          })}
        </div>
      )}
    </div>
  );

  // Render the actions (dropdown menu and chevron)
  const renderActions = () => (
    <div className='flex items-center gap-1 flex-shrink-0'>
      {actions.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='ghost'
              size='icon'
              className='h-8 w-8'
              onClick={e => e.stopPropagation()}
            >
              <MoreVertical className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='bg-popover z-50'>
            {actions.map((action, idx) => {
              // Check if action should be hidden
              if (action.hidden && action.hidden(row)) return null;

              return (
                <DropdownMenuItem
                  key={idx}
                  onClick={e => {
                    e.stopPropagation();
                    action.onClick?.(row);
                  }}
                  className={cn(
                    action.variant === 'destructive' && 'text-destructive'
                  )}
                >
                  {action.icon && <span className='mr-2'>{action.icon}</span>}
                  {action.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {onClick && <ChevronRight className='h-4 w-4 text-muted-foreground' />}
    </div>
  );

  return (
    <div
      className={cn(
        'border border-border/50 bg-background/50 backdrop-blur-sm p-4',
        'active:bg-muted/50 transition-colors',
        'w-full max-w-full overflow-hidden', // Prevent horizontal overflow
        isSelected && 'ring-2 ring-primary',
        onClick && 'cursor-pointer'
      )}
      onClick={onClick}
    >
      {imageField ? (
        // Two-column layout with image on left and content on right
        <div className='flex gap-3 w-full min-w-0'>
          {/* Image column - fixed width for mobile */}
          <div className='w-16 h-16 flex-shrink-0'>
            <div className='w-full h-full overflow-hidden'>
              {getCellValue(
                row,
                getColumn(imageField.key)!,
                row[imageField.key]
              )}
            </div>
          </div>

          {/* Content column - takes remaining space */}
          <div className='flex-1 min-w-0 flex items-start gap-2'>
            {renderTextContent()}
            {renderActions()}
          </div>
        </div>
      ) : (
        // Standard layout without image
        <div className='flex items-start gap-3 w-full min-w-0'>
          {renderTextContent()}
          {renderActions()}
        </div>
      )}
    </div>
  );
}
