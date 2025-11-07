import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/common/shadcn/dialog';
import { Button } from '@/components/common/shadcn/button';
import { Input } from '@/components/common/shadcn/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/shadcn/select';
import { Plus, X, Save } from 'lucide-react';
import { DataGridColumn } from './FmDataGrid';

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
  const [filterGroup, setFilterGroup] = useState<FilterGroup>(
    currentFilter || { logic: 'AND', rules: [] }
  );
  const [presetName, setPresetName] = useState('');
  const [showPresetInput, setShowPresetInput] = useState(false);

  const addRule = () => {
    const newRule: FilterRule = {
      id: Date.now().toString(),
      column: columns[0]?.key || '',
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

  const handleSavePreset = () => {
    if (presetName.trim()) {
      onSavePreset(presetName.trim(), filterGroup);
      setPresetName('');
      setShowPresetInput(false);
    }
  };

  const handleLoadPreset = (preset: FilterPreset) => {
    setFilterGroup(preset.group);
    onLoadPreset(preset);
  };

  const handleClear = () => {
    setFilterGroup({ logic: 'AND', rules: [] });
    onClear();
  };

  const filterableColumns = columns.filter(col => col.filterable !== false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-3xl max-h-[80vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Advanced Filters</DialogTitle>
          <DialogDescription>
            Build complex filters with multiple conditions
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          {/* Logic selector */}
          <div className='flex items-center gap-2'>
            <span className='text-sm text-muted-foreground'>Match</span>
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
                <SelectItem value='AND'>ALL</SelectItem>
                <SelectItem value='OR'>ANY</SelectItem>
              </SelectContent>
            </Select>
            <span className='text-sm text-muted-foreground'>
              of the following rules:
            </span>
          </div>

          {/* Rules */}
          <div className='space-y-2'>
            {filterGroup.rules.length === 0 ? (
              <div className='text-center py-8 text-muted-foreground'>
                No filters added. Click "Add Rule" to start.
              </div>
            ) : (
              filterGroup.rules.map((rule, index) => {
                const operator = OPERATORS.find(
                  op => op.value === rule.operator
                );
                const requiresValue = operator?.requiresValue ?? true;

                return (
                  <div
                    key={rule.id}
                    className='flex items-start gap-2 p-3 border border-border/50 rounded-none bg-muted/20'
                  >
                    <span className='text-xs text-muted-foreground mt-2 w-6'>
                      {index + 1}.
                    </span>

                    {/* Column */}
                    <Select
                      value={rule.column}
                      onValueChange={value =>
                        updateRule(rule.id, { column: value })
                      }
                    >
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
                      onValueChange={(value: FilterOperator) =>
                        updateRule(rule.id, { operator: value })
                      }
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
                        onChange={e =>
                          updateRule(rule.id, { value: e.target.value })
                        }
                        className='flex-1'
                      />
                    )}

                    {/* Remove */}
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => removeRule(rule.id)}
                      className='h-10 w-10 p-0 hover:bg-destructive/20 hover:text-destructive'
                    >
                      <X className='h-4 w-4' />
                    </Button>
                  </div>
                );
              })
            )}
          </div>

          {/* Add Rule Button */}
          <Button
            variant='outline'
            size='sm'
            onClick={addRule}
            className='w-full'
          >
            <Plus className='h-4 w-4 mr-2' />
            Add Rule
          </Button>

          {/* Presets */}
          {presets.length > 0 && (
            <div className='space-y-2 pt-4 border-t'>
              <div className='text-sm font-medium'>Saved Filters</div>
              <div className='flex flex-wrap gap-2'>
                {presets.map(preset => (
                  <div
                    key={preset.id}
                    className='flex items-center gap-1 bg-muted/30 rounded-none'
                  >
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => handleLoadPreset(preset)}
                      className='h-8 rounded-r-none'
                    >
                      {preset.name}
                    </Button>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => onDeletePreset(preset.id)}
                      className='h-8 w-8 p-0 rounded-l-none hover:bg-destructive/20 hover:text-destructive'
                    >
                      <X className='h-3 w-3' />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Save Preset */}
          <div className='space-y-2 pt-2'>
            {showPresetInput ? (
              <div className='flex gap-2'>
                <Input
                  placeholder='Preset name...'
                  value={presetName}
                  onChange={e => setPresetName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSavePreset();
                    if (e.key === 'Escape') setShowPresetInput(false);
                  }}
                  autoFocus
                />
                <Button onClick={handleSavePreset} size='sm'>
                  <Save className='h-4 w-4 mr-2' />
                  Save
                </Button>
                <Button
                  variant='ghost'
                  onClick={() => setShowPresetInput(false)}
                  size='sm'
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant='outline'
                size='sm'
                onClick={() => setShowPresetInput(true)}
                className='w-full'
                disabled={filterGroup.rules.length === 0}
              >
                <Save className='h-4 w-4 mr-2' />
                Save as Preset
              </Button>
            )}
          </div>
        </div>

        <DialogFooter className='gap-2'>
          <Button variant='outline' onClick={handleClear}>
            Clear All
          </Button>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            disabled={filterGroup.rules.length === 0}
          >
            Apply Filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
