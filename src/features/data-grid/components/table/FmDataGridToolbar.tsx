import React from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Filter, Download, Trash2, Plus } from 'lucide-react';
import { Input } from '@/components/common/shadcn/input';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmDataGridKeyboardShortcuts } from '../FmDataGridKeyboardShortcuts';

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
  const { t } = useTranslation('common');

  return (
    <div className='flex items-center gap-4'>
      {/* Search Bar */}
      <div className='relative flex-1'>
        <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
        <Input
          placeholder={t('placeholders.searchAllColumns')}
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          className='pl-10 bg-background/50 border-border/50 focus:border-fm-gold transition-all duration-300'
        />
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <FmCommonButton
          variant='default'
          size='sm'
          onClick={onClearFilters}
          className='animate-in fade-in duration-300'
        >
          {t('table.clearFilters')}
        </FmCommonButton>
      )}

      <div className='ml-auto flex items-center gap-2'>
        {/* Selection Count */}
        <div className='text-sm text-muted-foreground'>
          {selectedCount > 0 && (
            <span className='animate-in fade-in slide-in-from-right duration-300'>
              {t('table.rowsSelected', { count: selectedCount })}
            </span>
          )}
        </div>

        {/* Batch Delete Button */}
        {selectedCount > 0 && onBatchDelete && (
          <FmCommonButton
            onClick={onBatchDelete}
            variant='destructive'
            size='sm'
            disabled={isBatchDeleting}
            icon={Trash2}
            className='animate-in fade-in slide-in-from-right duration-300'
          >
            {t('table.delete', { count: selectedCount })}
          </FmCommonButton>
        )}

        {/* Bulk Edit Button */}
        {selectedCount > 0 && onBulkEdit && (
          <FmCommonButton
            onClick={onBulkEdit}
            variant='default'
            size='sm'
            icon={Plus}
            className='animate-in fade-in slide-in-from-right duration-300'
          >
            {t('table.edit', { count: selectedCount })}
          </FmCommonButton>
        )}

        {/* Export Button */}
        {enableExport && totalDataCount > 0 && onExport && (
          <FmCommonButton onClick={onExport} variant='default' size='sm' icon={Download}>
            {t('table.export')}
          </FmCommonButton>
        )}

        {/* Group By Button */}
        {totalDataCount > 0 && onGroupBy && (
          <FmCommonButton
            onClick={onGroupBy}
            variant='default'
            size='sm'
            icon={Filter}
          >
            {hasGrouping ? t('table.grouped') : t('table.groupBy')}
          </FmCommonButton>
        )}

        {/* Keyboard Shortcuts */}
        <FmDataGridKeyboardShortcuts />

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
            {createButtonLabel || t('table.add', { resource: resourceName })}
          </FmCommonButton>
        )}
      </div>
    </div>
  );
}
