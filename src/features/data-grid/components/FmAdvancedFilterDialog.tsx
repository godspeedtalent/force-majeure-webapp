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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/shadcn/select';
import { Plus } from 'lucide-react';
import { DataGridColumn } from './FmDataGrid';
import { FmFilterRuleRow } from './filters/FmFilterRuleRow';
import { FmFilterPresets } from './filters/FmFilterPresets';
import { FmFilterPresetSave } from './filters/FmFilterPresetSave';

export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'greater_or_equal'
  | 'less_or_equal'
  | 'is_empty'
  | 'is_not_empty';

export type FilterLogic = 'AND' | 'OR';

export interface FilterRule {
  id: string;
  column: string;
  operator: FilterOperator;
  value: string;
}

export interface FilterGroup {
  logic: FilterLogic;
  rules: FilterRule[];
}

export interface FilterPreset {
  id: string;
  name: string;
  group: FilterGroup;
}

interface FmAdvancedFilterDialogProps<T = any> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: DataGridColumn<T>[];
  currentFilter: FilterGroup | null;
  presets: FilterPreset[];
  onApply: (filter: FilterGroup) => void;
  onSavePreset: (name: string, filter: FilterGroup) => void;
  onLoadPreset: (preset: FilterPreset) => void;
  onDeletePreset: (presetId: string) => void;
  onClear: () => void;
}

export function FmAdvancedFilterDialog<T = any>({
  open,
  onOpenChange,
  columns,
  currentFilter,
  presets,
  onApply,
  onSavePreset,
  onLoadPreset,
  onDeletePreset,
  onClear,
}: FmAdvancedFilterDialogProps<T>) {
  const { t } = useTranslation('common');
  const [filterGroup, setFilterGroup] = useState<FilterGroup>(
    currentFilter || { logic: 'AND', rules: [] }
  );

  const filterableColumns = columns.filter(col => col.filterable !== false);

  const addRule = () => {
    const newRule: FilterRule = {
      id: Date.now().toString(),
      column: filterableColumns[0]?.key || '',
      operator: 'contains',
      value: '',
    };
    setFilterGroup({
      ...filterGroup,
      rules: [...filterGroup.rules, newRule],
    });
  };

  const updateRule = (ruleId: string, updates: Partial<FilterRule>) => {
    setFilterGroup({
      ...filterGroup,
      rules: filterGroup.rules.map(rule =>
        rule.id === ruleId ? { ...rule, ...updates } : rule
      ),
    });
  };

  const removeRule = (ruleId: string) => {
    setFilterGroup({
      ...filterGroup,
      rules: filterGroup.rules.filter(rule => rule.id !== ruleId),
    });
  };

  const handleApply = () => {
    onApply(filterGroup);
    onOpenChange(false);
  };

  const handleSavePreset = (name: string) => {
    onSavePreset(name, filterGroup);
  };

  const handleLoadPreset = (preset: FilterPreset) => {
    setFilterGroup(preset.group);
    onLoadPreset(preset);
  };

  const handleClear = () => {
    setFilterGroup({ logic: 'AND', rules: [] });
    onClear();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-3xl max-h-[80vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{t('filters.advancedFilters')}</DialogTitle>
          <DialogDescription>
            {t('filters.buildComplexFilters')}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          {/* Logic selector */}
          <div className='flex items-center gap-2'>
            <span className='text-sm text-muted-foreground'>{t('filters.match')}</span>
            <Select
              value={filterGroup.logic}
              onValueChange={(value: FilterLogic) =>
                setFilterGroup({ ...filterGroup, logic: value })
              }
            >
              <SelectTrigger className='w-24'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='AND'>{t('filters.all')}</SelectItem>
                <SelectItem value='OR'>{t('filters.any')}</SelectItem>
              </SelectContent>
            </Select>
            <span className='text-sm text-muted-foreground'>
              {t('filters.ofFollowingRules')}
            </span>
          </div>

          {/* Rules */}
          <div className='space-y-2'>
            {filterGroup.rules.length === 0 ? (
              <div className='text-center py-8 text-muted-foreground'>
                {t('formMessages.noFiltersAdded')}
              </div>
            ) : (
              filterGroup.rules.map((rule, index) => (
                <FmFilterRuleRow
                  key={rule.id}
                  rule={rule}
                  index={index}
                  filterableColumns={filterableColumns}
                  onUpdate={updateRule}
                  onRemove={removeRule}
                />
              ))
            )}
          </div>

          {/* Add Rule Button */}
          <Button variant='outline' size='sm' onClick={addRule} className='w-full'>
            <Plus className='h-4 w-4 mr-2' />
            {t('filters.addRule')}
          </Button>

          {/* Presets */}
          <FmFilterPresets
            presets={presets}
            onLoadPreset={handleLoadPreset}
            onDeletePreset={onDeletePreset}
          />

          {/* Save Preset */}
          <div className='space-y-2 pt-2'>
            <FmFilterPresetSave
              onSave={handleSavePreset}
              disabled={filterGroup.rules.length === 0}
            />
          </div>
        </div>

        <DialogFooter className='gap-2'>
          <Button variant='outline' onClick={handleClear}>
            {t('filters.clearAll')}
          </Button>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            {t('buttons.cancel')}
          </Button>
          <Button onClick={handleApply} disabled={filterGroup.rules.length === 0}>
            {t('filters.applyFilters')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
