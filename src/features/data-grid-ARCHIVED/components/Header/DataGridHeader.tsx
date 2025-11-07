import React from 'react';
import { TableHead, TableRow, TableHeader } from '@/components/common/shadcn/table';
import { FmCommonCheckbox } from '@/components/common/forms/FmCommonCheckbox';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useDataGridContext } from '../../context/DataGridContext';
import { cn } from '@/shared/utils/utils';

/**
 * Table header component with sortable columns and selection
 */
export function DataGridHeader() {
  const { columns, sorting, selection, data } = useDataGridContext();

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      selection.selectAll();
    } else {
      selection.clearSelection();
    }
  };

  const isAllSelected = selection.isAllSelected(data.length);

  return (
    <TableHead>
      <TableRow>
        {selection.enabled && (
          <TableHeader className="w-12">
            {selection.mode === 'multiple' && (
              <FmCommonCheckbox
                checked={isAllSelected}
                onCheckedChange={handleSelectAll}
                aria-label="Select all rows"
              />
            )}
          </TableHeader>
        )}
        {columns.map((column) => (
          <TableHeader
            key={column.key}
            style={{ width: column.width }}
            className={cn(
              column.sortable && 'cursor-pointer select-none hover:bg-muted/50',
              'transition-colors'
            )}
            onClick={column.sortable ? () => sorting.handleSort(column.key) : undefined}
          >
            <div className="flex items-center justify-between gap-2">
              <span>{column.label}</span>
              {column.sortable && sorting.sortColumn === column.key && (
                <span className="text-fm-gold">
                  {sorting.sortDirection === 'asc' ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </span>
              )}
            </div>
          </TableHeader>
        ))}
        <TableHeader className="w-12" />
      </TableRow>
    </TableHead>
  );
}
