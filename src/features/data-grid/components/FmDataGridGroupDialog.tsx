import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/shadcn/select';
import { Plus, X, Layers } from 'lucide-react';
import { DataGridColumn } from './FmDataGrid';
import type { GroupConfig, AggregationType } from '../utils/grouping';

interface FmDataGridGroupDialogProps<T = any> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: DataGridColumn<T>[];
  currentGroupConfig: GroupConfig | null;
  onApply: (config: GroupConfig) => void;
  onClear: () => void;
}

const AGGREGATION_TYPES: { value: AggregationType; label: string }[] = [
  { value: 'count', label: 'Count' },
  { value: 'sum', label: 'Sum' },
  { value: 'avg', label: 'Average' },
  { value: 'min', label: 'Minimum' },
  { value: 'max', label: 'Maximum' },
];

export function FmDataGridGroupDialog<T = any>({
  open,
  onOpenChange,
  columns,
  currentGroupConfig,
  onApply,
  onClear,
}: FmDataGridGroupDialogProps<T>) {
  const { t } = useTranslation('common');
  const [groupColumn, setGroupColumn] = useState<string>(
    currentGroupConfig?.columnKey || columns[0]?.key || ''
  );
  const [aggregations, setAggregations] = useState<
    {
      columnKey: string;
      type: AggregationType;
    }[]
  >(currentGroupConfig?.aggregations || []);

  const addAggregation = () => {
    // Find first numeric column
    const numericColumn = columns.find(col => col.type === 'number');

    setAggregations([
      ...aggregations,
      {
        columnKey: numericColumn?.key || columns[0]?.key || '',
        type: 'sum',
      },
    ]);
  };

  const updateAggregation = (
    index: number,
    updates: Partial<{ columnKey: string; type: AggregationType }>
  ) => {
    setAggregations(
      aggregations.map((agg, i) => (i === index ? { ...agg, ...updates } : agg))
    );
  };

  const removeAggregation = (index: number) => {
    setAggregations(aggregations.filter((_, i) => i !== index));
  };

  const handleApply = () => {
    onApply({
      columnKey: groupColumn,
      aggregations: aggregations.length > 0 ? aggregations : undefined,
    });
    onOpenChange(false);
  };

  const handleClear = () => {
    setGroupColumn(columns[0]?.key || '');
    setAggregations([]);
    onClear();
    onOpenChange(false);
  };

  // Get numeric columns for aggregation
  const numericColumns = columns.filter(
    col =>
      col.type === 'number' ||
      col.key.toLowerCase().includes('price') ||
      col.key.toLowerCase().includes('count')
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl max-h-[80vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{t('dialogs.groupData')}</DialogTitle>
          <DialogDescription>
            {t('dialogs.groupDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6 py-4'>
          {/* Group By Column */}
          <div className='space-y-2'>
            <Label>{t('dialogs.groupByColumn')}</Label>
            <Select value={groupColumn} onValueChange={setGroupColumn}>
              <SelectTrigger>
                <SelectValue placeholder={t('placeholders.selectColumn')} />
              </SelectTrigger>
              <SelectContent>
                {columns.map(col => (
                  <SelectItem key={col.key} value={col.key}>
                    {col.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className='text-xs text-muted-foreground'>
              {t('dialogs.groupByHelp')}
            </p>
          </div>

          {/* Aggregations */}
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <Label>{t('dialogs.aggregationsOptional')}</Label>
              <Button
                variant='outline'
                size='sm'
                onClick={addAggregation}
                disabled={numericColumns.length === 0}
              >
                <Plus className='h-4 w-4 mr-2' />
                {t('dialogs.addAggregation')}
              </Button>
            </div>

            {aggregations.length === 0 ? (
              <div className='text-center py-6 text-sm text-muted-foreground border border-dashed border-border/50 rounded-none'>
                {t('dialogs.noAggregationsAdded')}
              </div>
            ) : (
              <div className='space-y-2'>
                {aggregations.map((agg, index) => (
                  <div
                    key={index}
                    className='flex items-center gap-2 p-3 border border-border/50 rounded-none bg-muted/20'
                  >
                    {/* Column */}
                    <Select
                      value={agg.columnKey}
                      onValueChange={value =>
                        updateAggregation(index, { columnKey: value })
                      }
                    >
                      <SelectTrigger className='flex-1'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {numericColumns.map(col => (
                          <SelectItem key={col.key} value={col.key}>
                            {col.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Aggregation Type */}
                    <Select
                      value={agg.type}
                      onValueChange={(value: AggregationType) =>
                        updateAggregation(index, { type: value })
                      }
                    >
                      <SelectTrigger className='w-36'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AGGREGATION_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Remove */}
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => removeAggregation(index)}
                      className='h-10 w-10 p-0 hover:bg-destructive/20 hover:text-destructive'
                    >
                      <X className='h-4 w-4' />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {numericColumns.length === 0 && (
              <p className='text-xs text-muted-foreground'>
                {t('dialogs.noNumericColumns')}
              </p>
            )}
          </div>

          {/* Preview Info */}
          <div className='rounded-none bg-muted/30 p-4 space-y-2'>
            <div className='flex items-center gap-2 text-sm font-medium'>
              <Layers className='h-4 w-4 text-fm-gold' />
              <span>{t('dialogs.previewSection')}</span>
            </div>
            <div className='text-sm text-muted-foreground space-y-1'>
              <div>
                • {t('dialogs.rowsGroupedBy')}{' '}
                <span className='text-foreground font-medium'>
                  {columns.find(c => c.key === groupColumn)?.label}
                </span>
              </div>
              {aggregations.length > 0 && (
                <div>
                  • {t('dialogs.showingAggregations', { count: aggregations.length })}
                </div>
              )}
              <div>• {t('dialogs.clickGroupRows')}</div>
            </div>
          </div>
        </div>

        <DialogFooter className='gap-2'>
          <Button variant='outline' onClick={handleClear}>
            {t('dialogs.clearGrouping')}
          </Button>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            {t('buttons.cancel')}
          </Button>
          <Button onClick={handleApply}>{t('formActions.applyGrouping')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
