import { useTranslation } from 'react-i18next';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonSelect } from '@/components/common/forms/FmCommonSelect';
import { FmCommonIconButton } from '@/components/common/buttons/FmCommonIconButton';
import { X } from 'lucide-react';
import { DataGridColumn } from '../FmDataGrid';
import { FilterRule, FilterOperator } from '../FmAdvancedFilterDialog';

const OPERATORS: {
  value: FilterOperator;
  labelKey: string;
  requiresValue: boolean;
}[] = [
  { value: 'equals', labelKey: 'filterOperators.equals', requiresValue: true },
  { value: 'not_equals', labelKey: 'filterOperators.notEquals', requiresValue: true },
  { value: 'contains', labelKey: 'filterOperators.contains', requiresValue: true },
  { value: 'not_contains', labelKey: 'filterOperators.notContains', requiresValue: true },
  { value: 'starts_with', labelKey: 'filterOperators.startsWith', requiresValue: true },
  { value: 'ends_with', labelKey: 'filterOperators.endsWith', requiresValue: true },
  { value: 'greater_than', labelKey: 'filterOperators.greaterThan', requiresValue: true },
  { value: 'less_than', labelKey: 'filterOperators.lessThan', requiresValue: true },
  { value: 'greater_or_equal', labelKey: 'filterOperators.greaterOrEqual', requiresValue: true },
  { value: 'less_or_equal', labelKey: 'filterOperators.lessOrEqual', requiresValue: true },
  { value: 'is_empty', labelKey: 'filterOperators.isEmpty', requiresValue: false },
  { value: 'is_not_empty', labelKey: 'filterOperators.isNotEmpty', requiresValue: false },
];

export interface FmFilterRuleRowProps {
  rule: FilterRule;
  index: number;
  filterableColumns: DataGridColumn[];
  onUpdate: (ruleId: string, updates: Partial<FilterRule>) => void;
  onRemove: (ruleId: string) => void;
}

export function FmFilterRuleRow({
  rule,
  index,
  filterableColumns,
  onUpdate,
  onRemove,
}: FmFilterRuleRowProps) {
  const { t } = useTranslation('common');
  const operator = OPERATORS.find(op => op.value === rule.operator);
  const requiresValue = operator?.requiresValue ?? true;

  const columnOptions = filterableColumns.map(col => ({
    value: col.key,
    label: col.label,
  }));

  const operatorOptions = OPERATORS.map(op => ({
    value: op.value,
    label: t(op.labelKey),
  }));

  return (
    <div className='flex items-start gap-2 p-3 border border-border/50 rounded-none bg-muted/20'>
      <span className='text-xs text-muted-foreground mt-2 w-6'>{index + 1}.</span>

      {/* Column */}
      <FmCommonSelect
        value={rule.column}
        onChange={value => onUpdate(rule.id, { column: value })}
        options={columnOptions}
        className='w-40'
      />

      {/* Operator */}
      <FmCommonSelect
        value={rule.operator}
        onChange={(value) => onUpdate(rule.id, { operator: value as FilterOperator })}
        options={operatorOptions}
        className='w-48'
      />

      {/* Value */}
      {requiresValue && (
        <FmCommonTextField
          placeholder={t('dataGrid.valuePlaceholder')}
          value={rule.value}
          onChange={e => onUpdate(rule.id, { value: e.target.value })}
          containerClassName='flex-1'
        />
      )}

      {/* Remove */}
      <FmCommonIconButton
        icon={X}
        variant='destructive'
        size='sm'
        onClick={() => onRemove(rule.id)}
        tooltip={t('buttons.remove')}
      />
    </div>
  );
}
