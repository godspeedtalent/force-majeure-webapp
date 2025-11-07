import React from 'react';
import { Search, Filter, Download, Trash2, Plus } from 'lucide-react';
import { Input } from '@/components/common/shadcn/input';
import { Button } from '@/components/common/shadcn/button';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { cn } from '@/shared/utils/utils';

export interface FmDataGridToolbarProps {
  // Search
  searchQuery: string;
  onSearchChange: (value: string) => void;

  // Filters
  hasActiveFilters: boolean;
  onClearFilters: () => void;

  // Selection
  selectedCount: number;

  // Actions
  onBatchDelete?: () => void;
  onBulkEdit?: () => void;
  onExport?: () => void;
  onGroupBy?: () => void;
  onCreate?: () => void;
  onCreateButtonClick?: () => void;

  // Config
  resourceName?: string;
  createButtonLabel?: string;
  enableExport?: boolean;
  hasGrouping?: boolean;
  totalDataCount: number;

  // Custom toolbar actions
  toolbarActions?: React.ReactNode;

  // Loading states
  isBatchDeleting?: boolean;
}

export function FmDataGridToolbar({
  searchQuery,
  onSearchChange,
  hasActiveFilters,
  onClearFilters,
  selectedCount,
  onBatchDelete,
  onBulkEdit,
  onExport,
  onGroupBy,
  onCreate,
  onCreateButtonClick,
  resourceName = 'Resource',
  createButtonLabel,
  enableExport = true,
  hasGrouping = false,
  totalDataCount,
  toolbarActions,
  isBatchDeleting = false,
}: FmDataGridToolbarProps) {
  return (
    <div className='flex items-center gap-4'>
      {/* Search Bar */}
      <div className='relative flex-1 max-w-md'>
        <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
        <Input
          placeholder='Search across all columns...'
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          className='pl-10 bg-background/50 border-border/50 focus:border-fm-gold transition-all duration-300'
        />
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <Button
          variant='outline'
          size='sm'
          onClick={onClearFilters}
          className='animate-in fade-in duration-300'
        >
          Clear Filters
        </Button>
      )}

      <div className='ml-auto flex items-center gap-2'>
        {/* Selection Count */}
        <div className='text-sm text-muted-foreground'>
          {selectedCount > 0 && (
            <span className='animate-in fade-in slide-in-from-right duration-300'>
              {selectedCount} row{selectedCount !== 1 ? 's' : ''} selected
            </span>
          )}
        </div>

        {/* Batch Delete Button */}
        {selectedCount > 0 && onBatchDelete && (
          <Button
            onClick={onBatchDelete}
            variant='destructive'
            size='sm'
            disabled={isBatchDeleting}
            className='animate-in fade-in slide-in-from-right duration-300'
          >
            <Trash2 className='h-4 w-4 mr-1.5' />
            Delete {selectedCount}
          </Button>
        )}

        {/* Bulk Edit Button */}
        {selectedCount > 0 && onBulkEdit && (
          <Button
            onClick={onBulkEdit}
            variant='outline'
            size='sm'
            className='animate-in fade-in slide-in-from-right duration-300'
          >
            <Plus className='h-4 w-4 mr-1.5' />
            Edit {selectedCount}
          </Button>
        )}

        {/* Export Button */}
        {enableExport && totalDataCount > 0 && onExport && (
          <Button onClick={onExport} variant='outline' size='sm'>
            <Download className='h-4 w-4 mr-1.5' />
            Export
          </Button>
        )}

        {/* Group By Button */}
        {totalDataCount > 0 && onGroupBy && (
          <Button
            onClick={onGroupBy}
            variant={hasGrouping ? 'default' : 'outline'}
            size='sm'
          >
            <Filter className='h-4 w-4 mr-1.5' />
            {hasGrouping ? 'Grouped' : 'Group By'}
          </Button>
        )}

        {/* Additional Toolbar Actions */}
        {toolbarActions}

        {/* Create Button */}
        {(onCreate || onCreateButtonClick) && (
          <FmCommonButton
            onClick={onCreateButtonClick || onCreate}
            variant='default'
            size='sm'
            icon={Plus}
            iconPosition='left'
          >
            {createButtonLabel || `Add ${resourceName}`}
          </FmCommonButton>
        )}
      </div>
    </div>
  );
}
