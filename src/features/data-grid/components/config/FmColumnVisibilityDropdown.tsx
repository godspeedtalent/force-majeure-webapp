
import { Button } from '@/components/common/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/common/shadcn/dropdown-menu';
import { Settings2, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { DataGridColumn } from '../FmDataGrid';
import { FmCommonToggle } from '@/components/common/forms/FmCommonToggle';

interface ColumnConfig {
  key: string;
  visible: boolean;
  order: number;
  width?: number;
}

export interface FmColumnVisibilityDropdownProps {
  baseColumns: DataGridColumn[];
  columnConfigs: ColumnConfig[];
  onToggleVisibility: (columnKey: string) => void;
  onResetConfiguration: () => void;
  onClearFiltersAndSort: () => void;
}

export function FmColumnVisibilityDropdown({
  baseColumns,
  columnConfigs,
  onToggleVisibility,
  onResetConfiguration,
  onClearFiltersAndSort,
}: FmColumnVisibilityDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' size='sm' className='gap-2'>
          <Settings2 className='h-4 w-4' />
          Columns
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-64'>
        <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className='max-h-[400px] overflow-y-auto px-2 py-1 space-y-1'>
          {baseColumns.map(col => {
            const isVisible =
              columnConfigs.find(c => c.key === col.key)?.visible ?? true;

            return (
              <FmCommonToggle
                key={col.key}
                id={`column-toggle-${col.key}`}
                label={col.label}
                icon={isVisible ? Eye : EyeOff}
                checked={isVisible}
                onCheckedChange={() => onToggleVisibility(col.key)}
                className='w-full'
              />
            );
          })}
        </div>
        <DropdownMenuSeparator />
        <Button
          variant='ghost'
          size='sm'
          onClick={onResetConfiguration}
          className='w-full justify-start text-xs'
        >
          <RotateCcw className='h-4 w-4 mr-2' />
          Reset to Default
        </Button>
        <Button
          variant='ghost'
          size='sm'
          onClick={onClearFiltersAndSort}
          className='w-full justify-start text-xs'
        >
          <RotateCcw className='h-4 w-4 mr-2' />
          Clear Filters & Sort
        </Button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
