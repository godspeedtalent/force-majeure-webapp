import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TableCell, TableRow } from '@/components/common/shadcn/table';
import { Button } from '@/components/common/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/common/shadcn/dropdown-menu';
import { ChevronDown, ChevronUp, MoreVertical, X, Eye } from 'lucide-react';
import { FmCommonCheckbox } from '@/components/common/forms/FmCommonCheckbox';
import { FmDataGridContextMenu } from '../FmDataGridContextMenu';
import { FmDataGridCell } from './FmDataGridCell';
import { cn } from '@/shared';
import { DataGridColumn, DataGridAction } from '../FmDataGrid';
import type { GroupedRow } from '../../utils/grouping';
import { isRelationField, getRelationConfig } from '../../utils/dataGridRelations';
import { logger } from '@/shared';

export interface FmDataGridRowProps<T> {
  row: T;
  rowIndex: number;
  globalIndex: number;
  columns: DataGridColumn<T>[];
  actions: DataGridAction<T>[];
  contextMenuActions: DataGridAction<T>[];
  isSelected: boolean;
  isEvenRow: boolean;
  hasContextMenuOpen: boolean;
  onSelectRow: (checked: boolean, shiftKey: boolean) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onMouseEnter: () => void;
  setRowRef: (el: HTMLTableRowElement | null) => void;

  // Editing
  editingCell: { rowIndex: number; columnKey: string } | null;
  editValue: string;
  onEditValueChange: (value: string) => void;
  onStartEdit: (rowIndex: number, columnKey: string, currentValue: any) => void;
  onSaveEdit: (row: T, columnKey: string, overrideValue?: any) => void;
  onCancelEdit: () => void;
  onUpdate?: (row: T, columnKey: string, newValue: any) => Promise<void>;

  // Drag & Hover
  isDragMode: boolean;
  isDragSelected: boolean;
  hoveredColumn: string | null;
  onSetHoveredColumn: (col: string | null) => void;

  // Context menu
  onContextMenuOpenChange: (open: boolean) => void;

  // Selection helpers
  isMultipleSelected: boolean;
  onUnselectAll: () => void;

  // Keyboard nav
  getFocusableCellProps: (rowIndex: number, columnKey: string) => any;

  // Column widths for frozen column positioning
  columnWidths?: Record<string, number>;

  // Show row numbers
  showRowNumbers?: boolean;
}

export function FmDataGridRow<T extends Record<string, any>>({
  row,
  rowIndex,
  globalIndex,
  columns,
  actions,
  contextMenuActions,
  isSelected,
  isEvenRow,
  hasContextMenuOpen,
  onSelectRow,
  onMouseDown,
  onMouseUp,
  onMouseEnter,
  setRowRef,
  editingCell,
  editValue,
  onEditValueChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onUpdate,
  isDragMode,
  isDragSelected,
  hoveredColumn,
  onSetHoveredColumn,
  onContextMenuOpenChange,
  isMultipleSelected,
  onUnselectAll,
  getFocusableCellProps,
  columnWidths = {},
  showRowNumbers = false,
}: FmDataGridRowProps<T>) {
  const navigate = useNavigate();

  // Validate column keys against row data (only in development)
  useMemo(() => {
    if (process.env.NODE_ENV === 'development') {
      const missingKeys = columns
        .filter(col => !(col.key in row) && !col.render)
        .map(col => col.key);

      if (missingKeys.length > 0) {
        logger.warn('Column keys missing in row data', {
          missingKeys,
          availableKeys: Object.keys(row),
          source: 'FmDataGridRow',
        });
      }
    }
  }, [columns, row]);

  // Calculate cumulative left positions for frozen columns
  const frozenColumnPositions = useMemo(() => {
    const positions: Record<string, number> = {};
    let cumulativeLeft = 48; // Start after checkbox column (w-12 = 48px)

    columns.forEach(column => {
      if (column.frozen) {
        positions[column.key] = cumulativeLeft;
        const width = columnWidths[column.key] || 150; // Default width
        cumulativeLeft += width;
      }
    });

    return positions;
  }, [columns, columnWidths]);

  // Determine context menu actions based on selection
  const currentContextMenuActions =
    isMultipleSelected && isSelected
      ? contextMenuActions
          .map(action => {
            if (action.label === 'Manage') return null;
            if (action.label === 'Delete Event') {
              return { ...action, label: 'Delete Selected' };
            }
            return action;
          })
          .filter(Boolean) as DataGridAction<T>[]
      : contextMenuActions;

  // Build relation detail actions dynamically
  const relationDetailActions: DataGridAction<T>[] = [];
  columns.forEach(column => {
    if (isRelationField(column.key)) {
      const relationConfig = getRelationConfig(column.key);
      const relationId = row[column.key];

      if (
        relationConfig?.detailRoute &&
        relationConfig?.entityName &&
        relationId
      ) {
        relationDetailActions.push({
          label: `View ${relationConfig.entityName} details`,
          icon: <Eye className='h-4 w-4' />,
          onClick: () => navigate(relationConfig.detailRoute!(relationId)),
        });
      }
    }
  });

  // Add separator before relation actions if they exist
  let actionsWithRelations = currentContextMenuActions;
  if (relationDetailActions.length > 0) {
    actionsWithRelations = [
      ...currentContextMenuActions,
      ...(currentContextMenuActions.length > 0
        ? [{ separator: true } as DataGridAction<T>]
        : []),
      ...relationDetailActions,
    ];
  }

  // Add "Unselect All" if multiple selected
  const finalContextMenuActions =
    isMultipleSelected && isSelected
      ? [
          ...actionsWithRelations,
          {
            label: 'Unselect All',
            icon: <X className='h-4 w-4' />,
            onClick: onUnselectAll,
            separator: true,
          } as DataGridAction<T>,
        ]
      : actionsWithRelations;

  return (
    <FmDataGridContextMenu
      row={row}
      actions={finalContextMenuActions}
      onOpenChange={onContextMenuOpenChange}
    >
      <TableRow
        ref={setRowRef}
        className={cn(
          'border-border/50 transition-all duration-200 group',
          isEvenRow && 'bg-muted/20',
          isSelected && 'bg-fm-gold/10 border-fm-gold/30',
          hasContextMenuOpen && 'bg-fm-gold/20 border-fm-gold/50',
          !hasContextMenuOpen && 'hover:bg-fm-gold/5',
          isDragSelected && 'bg-fm-gold/15'
        )}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseEnter={onMouseEnter}
      >
        {/* Checkbox Cell */}
        <TableCell
          className={cn(
            'transition-colors duration-200 border-l border-r border-border/60',
            !isDragMode && hoveredColumn === '__checkbox' && 'bg-muted/40'
          )}
          onMouseEnter={() => !isDragMode && onSetHoveredColumn('__checkbox')}
          onMouseLeave={() => !isDragMode && onSetHoveredColumn(null)}
        >
          <FmCommonCheckbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelectRow(!!checked, false)}
            aria-label={`Select row ${globalIndex + 1}`}
          />
        </TableCell>

        {/* Row Number Cell */}
        {showRowNumbers && (
          <TableCell className='w-12 text-center text-muted-foreground font-mono text-xs sticky left-12 z-10 bg-background/95 backdrop-blur-sm border-r border-border/60'>
            {globalIndex + 1}
          </TableCell>
        )}

        {/* Data Cells */}
        {columns.map(column => {
          const isEditing =
            editingCell?.rowIndex === globalIndex &&
            editingCell?.columnKey === column.key;
          const cellValue = row[column.key];

          return (
            <FmDataGridCell
              key={column.key}
              row={row}
              column={column}
              value={cellValue}
              isEditing={isEditing}
              editValue={editValue}
              onEditValueChange={onEditValueChange}
              onStartEdit={() => onStartEdit(globalIndex, column.key, cellValue)}
              onSaveEdit={overrideValue => onSaveEdit(row, column.key, overrideValue)}
              onCancelEdit={onCancelEdit}
              onUpdate={onUpdate}
              hoveredColumn={hoveredColumn}
              isDragMode={isDragMode}
              focusableProps={
                column.editable && !column.readonly && onUpdate
                  ? getFocusableCellProps(rowIndex, column.key)
                  : {}
              }
              frozenLeft={column.frozen ? frozenColumnPositions[column.key] : undefined}
              columnWidths={columnWidths}
            />
          );
        })}

        {/* Actions Cell */}
        {actions.length > 0 && (
          <TableCell
            className={cn(
              'text-right transition-colors duration-200 border-l border-r border-border/60',
              !isDragMode && hoveredColumn === '__actions' && 'bg-muted/40'
            )}
            onMouseEnter={() => !isDragMode && onSetHoveredColumn('__actions')}
            onMouseLeave={() => !isDragMode && onSetHoveredColumn(null)}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-8 w-8 p-0 hover:bg-fm-gold/20 transition-all duration-200'
                  onClick={e => e.stopPropagation()}
                >
                  <MoreVertical className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                {actions.map((action, idx) => (
                  <DropdownMenuItem
                    key={idx}
                    onClick={e => {
                      e.stopPropagation();
                      action.onClick?.(row);
                    }}
                    className={cn(
                      'cursor-pointer transition-colors duration-200',
                      action.variant === 'destructive' &&
                        'text-destructive focus:text-destructive'
                    )}
                  >
                    {action.icon && <span className='mr-2'>{action.icon}</span>}
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        )}
      </TableRow>
    </FmDataGridContextMenu>
  );
}

// Group header row component
export interface FmDataGridGroupRowProps<T> {
  groupData: GroupedRow<T>;
  columns: DataGridColumn<T>[];
  hasActions: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}

export function FmDataGridGroupRow<T>({
  groupData,
  columns,
  hasActions,
  isExpanded,
  onToggle,
}: FmDataGridGroupRowProps<T>) {
  return (
    <TableRow
      className='bg-muted/40 hover:bg-muted/60 cursor-pointer border-b-2 border-border font-medium'
      onClick={onToggle}
    >
      <TableCell colSpan={columns.length + 1 + (hasActions ? 1 : 0)}>
        <div className='flex items-center gap-3 py-1'>
          {isExpanded ? (
            <ChevronDown className='h-5 w-5 text-fm-gold' />
          ) : (
            <ChevronUp className='h-5 w-5 text-muted-foreground' />
          )}
          <span className='text-base'>{groupData.groupValue || '(Empty)'}</span>
          <span className='text-sm text-muted-foreground'>
            ({groupData.count} row{groupData.count !== 1 ? 's' : ''})
          </span>
          {groupData.aggregations && Object.keys(groupData.aggregations).length > 0 && (
            <div className='ml-4 flex gap-4 text-sm text-muted-foreground'>
              {Object.entries(groupData.aggregations).map(([key, value]) => {
                const [colKey, aggType] = key.split('_');
                const column = columns.find(c => c.key === colKey);
                return (
                  <span key={key}>
                    {aggType}:{' '}
                    <span className='text-foreground font-medium'>{value}</span>
                    {column && ` (${column.label})`}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
