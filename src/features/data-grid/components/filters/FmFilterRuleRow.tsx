import React from 'react';
import { Input } from '@/components/common/shadcn/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/shadcn/select';
import { Button } from '@/components/common/shadcn/button';
import { X } from 'lucide-react';
import { DataGridColumn } from '../FmDataGrid';
import { FilterRule, FilterOperator } from '../FmAdvancedFilterDialog';

const OPERATORS: {
  value: FilterOperator;
  label: string;
  requiresValue: boolean;
}[] = [
  { value: 'equals', label: 'Equals', requiresValue: true },
  { value: 'not_equals', label: 'Not Equals', requiresValue: true },
  { value: 'contains', label: 'Contains', requiresValue: true },
  { value: 'not_contains', label: 'Not Contains', requiresValue: true },
  { value: 'starts_with', label: 'Starts With', requiresValue: true },
  { value: 'ends_with', label: 'Ends With', requiresValue: true },
  { value: 'greater_than', label: 'Greater Than', requiresValue: true },
  { value: 'less_than', label: 'Less Than', requiresValue: true },
  { value: 'greater_or_equal', label: 'Greater or Equal', requiresValue: true },
  { value: 'less_or_equal', label: 'Less or Equal', requiresValue: true },
  { value: 'is_empty', label: 'Is Empty', requiresValue: false },
  { value: 'is_not_empty', label: 'Is Not Empty', requiresValue: false },
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
  const operator = OPERATORS.find(op => op.value === rule.operator);
  const requiresValue = operator?.requiresValue ?? true;

  return (
    <div className='flex items-start gap-2 p-3 border border-border/50 rounded-none bg-muted/20'>
      <span className='text-xs text-muted-foreground mt-2 w-6'>{index + 1}.</span>

      {/* Column */}
      <Select value={rule.column} onValueChange={value => onUpdate(rule.id, { column: value })}>
        <SelectTrigger className='w-40'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {filterableColumns.map(col => (
            <SelectItem key={col.key} value={col.key}>
              {col.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Operator */}
      <Select
        value={rule.operator}
        onValueChange={(value: FilterOperator) => onUpdate(rule.id, { operator: value })}
      >
        <SelectTrigger className='w-48'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {OPERATORS.map(op => (
            <SelectItem key={op.value} value={op.value}>
              {op.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Value */}
      {requiresValue && (
        <Input
          placeholder='Value...'
          value={rule.value}
          onChange={e => onUpdate(rule.id, { value: e.target.value })}
          className='flex-1'
        />
      )}

      {/* Remove */}
      <Button
        variant='ghost'
        size='sm'
        onClick={() => onRemove(rule.id)}
        className='h-10 w-10 p-0 hover:bg-destructive/20 hover:text-destructive'
      >
        <X className='h-4 w-4' />
      </Button>
    </div>
  );
}
