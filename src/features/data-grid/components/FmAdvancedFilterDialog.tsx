import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FmCommonModal } from '@/components/common/modals/FmCommonModal';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonSelect } from '@/components/common/forms/FmCommonSelect';
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

  const logicOptions = [
    { value: 'AND', label: t('filters.all') },
    { value: 'OR', label: t('filters.any') },
  ];

  return (
    <FmCommonModal
      open={open}
      onOpenChange={onOpenChange}
      title={t('filters.advancedFilters')}
      description={t('filters.buildComplexFilters')}
      className='max-w-3xl max-h-[80vh] overflow-y-auto'
    >
      <div className='space-y-4 py-4'>
        {/* Logic selector */}
        <div className='flex items-center gap-2'>
          <span className='text-sm text-muted-foreground'>{t('filters.match')}</span>
          <FmCommonSelect
            value={filterGroup.logic}
            onChange={(value) =>
              setFilterGroup({ ...filterGroup, logic: value as FilterLogic })
            }
            options={logicOptions}
            className='w-24'
          />
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
        <FmCommonButton variant='default' size='sm' onClick={addRule} className='w-full' icon={Plus}>
          {t('filters.addRule')}
        </FmCommonButton>

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

      <div className='flex justify-end gap-2 pt-4 border-t'>
        <FmCommonButton variant='destructive-outline' onClick={handleClear}>
          {t('filters.clearAll')}
        </FmCommonButton>
        <FmCommonButton variant='secondary' onClick={() => onOpenChange(false)}>
          {t('buttons.cancel')}
        </FmCommonButton>
        <FmCommonButton variant='gold' onClick={handleApply} disabled={filterGroup.rules.length === 0}>
          {t('filters.applyFilters')}
        </FmCommonButton>
      </div>
    </FmCommonModal>
  );
}
