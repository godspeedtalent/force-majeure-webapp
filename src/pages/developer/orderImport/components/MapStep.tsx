/**
 * MapStep - Column mapping step component
 *
 * This is a placeholder that re-exports the original inline rendering.
 * For a full split, extract the sections into separate components.
 */

import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Columns,
  Type,
  Calculator,
  Ban,
  Ticket,
  DollarSign,
  Trash2,
  Package,
  Plus,
} from 'lucide-react';
import { cn } from '@/shared';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { FmCommonCard, FmCommonCardContent } from '@/components/common/display/FmCommonCard';
import { FmCommonSelect, type SelectOption } from '@/components/common/forms/FmCommonSelect';
import { FmFormulaInput, type FormulaColumn, type FormulaVariable } from '@/components/common/forms/FmFormulaInput';
import {
  FIELD_CATEGORIES,
  FIELD_DESCRIPTIONS,
  DATA_TYPE_DISPLAY,
  DATE_DEFAULTS,
  ASSIGNABLE_FIELDS,
} from '../constants';
import { createDefaultTicketLineItem, createDefaultFeeLineItem } from '../utils';
import type { ColumnMapping, LineItemTemplate, UnmappedFieldAssignment, FieldCategory } from '../types';

interface SelectedEvent {
  id: string;
  title: string;
}

interface EventDetails {
  id: string;
  title: string;
  start_time: string | null;
}

interface TierOption {
  value: string;
  label: string;
}

interface MapStepProps {
  selectedEvent: SelectedEvent | null;
  csvHeaders: string[];
  columnMapping: ColumnMapping;
  setColumnMapping: (mapping: ColumnMapping | ((prev: ColumnMapping) => ColumnMapping)) => void;
  lineItems: LineItemTemplate[];
  setLineItems: (items: LineItemTemplate[] | ((prev: LineItemTemplate[]) => LineItemTemplate[])) => void;
  showMapping: boolean;
  setShowMapping: (show: boolean) => void;
  showLineItems: boolean;
  setShowLineItems: (show: boolean) => void;
  expandedSections: Record<FieldCategory, boolean>;
  setExpandedSections: (sections: Record<FieldCategory, boolean> | ((prev: Record<FieldCategory, boolean>) => Record<FieldCategory, boolean>)) => void;
  tierOptions: TierOption[];
  eventDetails: EventDetails | null | undefined;
  unmappedColumns: string[];
  unmappedAssignments: UnmappedFieldAssignment[];
  setUnmappedAssignments: (assignments: UnmappedFieldAssignment[] | ((prev: UnmappedFieldAssignment[]) => UnmappedFieldAssignment[])) => void;
  isValidating: boolean;
  onBack: () => void;
  onValidate: () => void;
  columnMappingTitle: string;
  hideMapping: string;
  showMappingText: string;
}

const NOT_MAPPED_VALUE = '__not_mapped__';

export function MapStep({
  selectedEvent,
  csvHeaders,
  columnMapping,
  setColumnMapping,
  lineItems,
  setLineItems,
  showMapping,
  setShowMapping,
  showLineItems,
  setShowLineItems,
  expandedSections,
  setExpandedSections,
  tierOptions,
  eventDetails,
  unmappedColumns,
  unmappedAssignments,
  setUnmappedAssignments,
  isValidating,
  onBack,
  onValidate,
  columnMappingTitle,
  hideMapping,
  showMappingText,
}: MapStepProps) {
  const [showUnmappedManager, setShowUnmappedManager] = useState(true);

  const formulaColumns: FormulaColumn[] = csvHeaders.map(h => ({
    name: h,
    description: `Value from ${h} column`,
  }));

  const formulaVariables: FormulaVariable[] = [
    { name: '$TIER_PRICE', description: 'Ticket tier price in cents', prefix: '$' },
  ];

  const headerOptions: SelectOption[] = [
    { value: NOT_MAPPED_VALUE, label: '-- Not mapped --' },
    ...csvHeaders.map(header => ({ value: header, label: header, labelClassName: 'font-mono text-xs' }))
  ];

  const tierOptionsStyled: SelectOption[] = tierOptions.map(opt => ({
    ...opt,
    labelClassName: 'font-mono text-xs',
  }));

  const assignableTables = [...new Set(ASSIGNABLE_FIELDS.map(f => f.table))];

  const addUnmappedAssignment = () => {
    if (unmappedColumns.length === 0) return;

    // Find the first available target column that isn't already used
    const defaultTable = ASSIGNABLE_FIELDS[0].table;
    const usedColumnsForDefaultTable = unmappedAssignments
      .filter(a => a.targetTable === defaultTable)
      .map(a => a.targetColumn);
    const firstAvailableField = ASSIGNABLE_FIELDS.find(
      f => f.table === defaultTable && !usedColumnsForDefaultTable.includes(f.column)
    ) || ASSIGNABLE_FIELDS[0];

    const newAssignment: UnmappedFieldAssignment = {
      id: `assign-${Date.now()}`,
      csvColumn: unmappedColumns[0],
      targetTable: firstAvailableField.table,
      targetColumn: firstAvailableField.column,
    };
    setUnmappedAssignments(prev => [...prev, newAssignment]);
  };

  const removeUnmappedAssignment = (id: string) => {
    setUnmappedAssignments(prev => prev.filter(a => a.id !== id));
  };

  const updateUnmappedAssignment = (id: string, updates: Partial<UnmappedFieldAssignment>) => {
    setUnmappedAssignments(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  return (
    <div className='space-y-6'>
      {/* Config summary */}
      <FmCommonCard hoverable={false} className='bg-fm-gold/10 border-fm-gold/30'>
        <FmCommonCardContent className='p-4'>
          <div className='text-sm'>
            <span className='text-fm-gold font-medium'>Importing to:</span>{' '}
            <span className='text-white'>{selectedEvent?.title}</span>
          </div>
        </FmCommonCardContent>
      </FmCommonCard>

      {/* Column Mapping Card */}
      <FmCommonCard hoverable={false}>
        <FmCommonCardContent className='p-4'>
          <div className='flex items-center justify-between mb-4'>
            <div>
              <h3 className='font-medium'>{columnMappingTitle}</h3>
              <p className='text-xs text-muted-foreground mt-1'>
                Map your CSV columns to Order table fields. Required fields are marked with *.
              </p>
            </div>
            <button
              onClick={() => setShowMapping(!showMapping)}
              className='text-sm text-fm-gold flex items-center gap-1'
            >
              {showMapping ? <ChevronUp className='h-4 w-4' /> : <ChevronDown className='h-4 w-4' />}
              {showMapping ? hideMapping : showMappingText}
            </button>
          </div>

          {showMapping && (
            <div className='space-y-4'>
              <div className='bg-blue-500/10 border border-blue-500/30 p-3 rounded-sm text-sm'>
                <p className='text-blue-400 font-medium mb-1'>Auto-calculated fields:</p>
                <ul className='text-blue-300/80 text-xs space-y-0.5'>
                  <li>&bull; Unit price is determined by the selected ticket tier</li>
                  <li>&bull; Fees are calculated from site fee configuration</li>
                  <li>&bull; Order date defaults to event date if not mapped</li>
                </ul>
              </div>

              {(Object.entries(FIELD_CATEGORIES) as [FieldCategory, typeof FIELD_CATEGORIES[FieldCategory]][])
                .filter(([category]) => category !== 'tickets')
                .map(([category, categoryInfo]) => {
                const categoryFields = (Object.entries(FIELD_DESCRIPTIONS) as [keyof ColumnMapping, typeof FIELD_DESCRIPTIONS[keyof ColumnMapping]][])
                  .filter(([, info]) => info.category === category);

                if (categoryFields.length === 0) return null;

                const isExpanded = expandedSections[category];
                const mappedCount = categoryFields.filter(([field]) => {
                  const mapping = columnMapping[field];
                  return mapping.mode !== 'ignore' && (mapping.mode !== 'column' || mapping.value);
                }).length;

                return (
                  <div key={category} className='border border-white/10 rounded-sm overflow-hidden'>
                    <button
                      type='button'
                      onClick={() => setExpandedSections(prev => ({ ...prev, [category]: !prev[category] }))}
                      className='w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 transition-colors'
                    >
                      <div className='flex items-center gap-3'>
                        {isExpanded ? (
                          <ChevronUp className='h-4 w-4 text-fm-gold' />
                        ) : (
                          <ChevronDown className='h-4 w-4 text-muted-foreground' />
                        )}
                        <div className='text-left flex items-center gap-2'>
                          <code className='font-mono text-sm bg-white/10 px-2 py-0.5 text-fm-gold'>{categoryInfo.tableName}</code>
                          <span className='text-xs text-muted-foreground'>
                            ({mappedCount}/{categoryFields.length} mapped)
                          </span>
                        </div>
                      </div>
                      <span className='text-xs text-muted-foreground'>{categoryInfo.description}</span>
                    </button>

                    {isExpanded && (
                      <div className='p-3 space-y-3 bg-black/20'>
                        {categoryFields.map(([field, info]) => {
                          const mapping = columnMapping[field];
                          const typeDisplay = DATA_TYPE_DISPLAY[info.dataType];
                          const isIgnored = mapping.mode === 'ignore';
                          const canIgnore = !info.required;

                          return (
                            <div key={field} className={cn(
                              'border rounded-sm p-3 transition-colors',
                              isIgnored ? 'border-white/5 bg-black/20' : 'border-white/10'
                            )}>
                              <div className='flex items-center justify-between mb-2'>
                                <div className='flex items-center gap-2'>
                                  <code className={cn(
                                    'font-mono text-sm bg-white/5 px-1.5 py-0.5',
                                    isIgnored ? 'text-muted-foreground' : 'text-white'
                                  )}>
                                    <span className='text-muted-foreground'>{info.tableName}.</span>
                                    <span className={isIgnored ? 'text-muted-foreground' : 'text-fm-gold'}>{info.dbColumn}</span>
                                    {info.required && <span className='text-red-400 ml-0.5'>*</span>}
                                  </code>
                                  <span className={cn(
                                    'text-xs px-1.5 py-0.5 border border-current/30 rounded-sm',
                                    isIgnored ? 'text-muted-foreground' : typeDisplay.color
                                  )}>
                                    {typeDisplay.label}
                                  </span>
                                </div>
                                <div className='flex gap-1'>
                                  {['column', 'hardcoded', 'formula'].map(mode => (
                                    <button
                                      key={mode}
                                      type='button'
                                      onClick={() => setColumnMapping(prev => ({
                                        ...prev,
                                        [field]: { ...prev[field], mode: mode as 'column' | 'hardcoded' | 'formula' }
                                      }))}
                                      className={cn(
                                        'px-2 py-1 text-xs flex items-center gap-1 border transition-colors',
                                        mapping.mode === mode
                                          ? 'bg-fm-gold/20 border-fm-gold text-fm-gold'
                                          : 'border-white/20 text-muted-foreground hover:border-white/40'
                                      )}
                                    >
                                      {mode === 'column' && <Columns className='h-3 w-3' />}
                                      {mode === 'hardcoded' && <Type className='h-3 w-3' />}
                                      {mode === 'formula' && <Calculator className='h-3 w-3' />}
                                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                                    </button>
                                  ))}
                                  {canIgnore && (
                                    <button
                                      type='button'
                                      onClick={() => setColumnMapping(prev => ({
                                        ...prev,
                                        [field]: { ...prev[field], mode: 'ignore' }
                                      }))}
                                      className={cn(
                                        'px-2 py-1 text-xs flex items-center gap-1 border transition-colors',
                                        mapping.mode === 'ignore'
                                          ? 'bg-red-500/20 border-red-500 text-red-400'
                                          : 'border-white/20 text-muted-foreground hover:border-white/40'
                                      )}
                                    >
                                      <Ban className='h-3 w-3' />
                                      Ignore
                                    </button>
                                  )}
                                </div>
                              </div>

                              {mapping.mode === 'column' && (
                                <FmCommonSelect
                                  value={mapping.value || NOT_MAPPED_VALUE}
                                  onChange={(newValue) => {
                                    setColumnMapping(prev => ({
                                      ...prev,
                                      [field]: { ...prev[field], value: newValue === NOT_MAPPED_VALUE ? '' : newValue }
                                    }));
                                  }}
                                  options={headerOptions}
                                  placeholder='Select CSV column...'
                                />
                              )}

                              {mapping.mode === 'hardcoded' && (
                                <input
                                  type='text'
                                  value={mapping.value}
                                  onChange={(e) => setColumnMapping(prev => ({
                                    ...prev,
                                    [field]: { ...prev[field], value: e.target.value }
                                  }))}
                                  placeholder='Enter value...'
                                  className='w-full px-2 py-1 bg-black/40 border border-white/10 text-sm focus:border-fm-gold focus:outline-none'
                                />
                              )}

                              {mapping.mode === 'formula' && (
                                <FmFormulaInput
                                  value={mapping.value}
                                  onChange={(value) => setColumnMapping(prev => ({
                                    ...prev,
                                    [field]: { ...prev[field], value }
                                  }))}
                                  columns={formulaColumns}
                                  variables={formulaVariables}
                                  placeholder='Enter formula...'
                                />
                              )}

                              {info.supportsDefault && !isIgnored && (
                                <div className='mt-2 flex items-center gap-2'>
                                  <span className='text-xs text-muted-foreground'>Default:</span>
                                  <input
                                    type='text'
                                    value={mapping.defaultValue || ''}
                                    onChange={(e) => setColumnMapping(prev => ({
                                      ...prev,
                                      [field]: { ...prev[field], defaultValue: e.target.value }
                                    }))}
                                    placeholder='Default value...'
                                    className='flex-1 px-2 py-1 bg-black/40 border border-white/10 text-xs focus:border-fm-gold focus:outline-none'
                                  />
                                  {field === 'created_at' && (
                                    <div className='flex gap-2'>
                                      <button
                                        type='button'
                                        onClick={() => setColumnMapping(prev => ({
                                          ...prev,
                                          [field]: { ...prev[field], defaultValue: DATE_DEFAULTS.NOW }
                                        }))}
                                        className='text-xs text-fm-gold hover:underline'
                                      >
                                        now()
                                      </button>
                                      {eventDetails?.start_time && (
                                        <button
                                          type='button'
                                          onClick={() => setColumnMapping(prev => ({
                                            ...prev,
                                            [field]: { ...prev[field], defaultValue: DATE_DEFAULTS.EVENT_DATE }
                                          }))}
                                          className='text-xs text-fm-gold hover:underline'
                                        >
                                          event date
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}

                              <p className={cn(
                                'text-xs mt-1',
                                isIgnored ? 'text-muted-foreground/50' : 'text-muted-foreground'
                              )}>{info.description}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </FmCommonCardContent>
      </FmCommonCard>

      {/* Line Items Card - simplified */}
      <FmCommonCard hoverable={false}>
        <FmCommonCardContent className='p-4'>
          <div className='flex items-center justify-between mb-4'>
            <div>
              <h3 className='font-medium'>Line Items</h3>
              <p className='text-xs text-muted-foreground mt-1'>
                Configure what items to create per order row.
              </p>
            </div>
            <button
              onClick={() => setShowLineItems(!showLineItems)}
              className='text-sm text-fm-gold flex items-center gap-1'
            >
              {showLineItems ? <ChevronUp className='h-4 w-4' /> : <ChevronDown className='h-4 w-4' />}
            </button>
          </div>

          {showLineItems && (
            <div className='space-y-4'>
              <div className='flex gap-2'>
                <FmCommonButton
                  variant='default'
                  size='sm'
                  onClick={() => setLineItems(prev => [...prev, createDefaultTicketLineItem()])}
                >
                  <Ticket className='h-3 w-3 mr-1' />
                  Add Ticket Item
                </FmCommonButton>
                <FmCommonButton
                  variant='default'
                  size='sm'
                  onClick={() => setLineItems(prev => [...prev, createDefaultFeeLineItem()])}
                >
                  <DollarSign className='h-3 w-3 mr-1' />
                  Add Fee Item
                </FmCommonButton>
              </div>

              {lineItems.length === 0 ? (
                <div className='text-center py-6 text-muted-foreground text-sm'>
                  <Package className='h-8 w-8 mx-auto mb-2 opacity-30' />
                  <p>No line items configured</p>
                  <p className='text-xs'>Add items above or a default will be created from the first ticket tier</p>
                </div>
              ) : (
                <div className='space-y-3'>
                  {lineItems.map((item, idx) => (
                    <div key={item.id} className='border border-white/10 rounded-sm p-3'>
                      <div className='flex items-center justify-between mb-2'>
                        <div className='flex items-center gap-2'>
                          {item.type === 'ticket' ? <Ticket className='h-4 w-4 text-blue-400' /> : <DollarSign className='h-4 w-4 text-green-400' />}
                          <input
                            type='text'
                            value={item.name}
                            onChange={(e) => setLineItems(prev => prev.map((li, i) => i === idx ? { ...li, name: e.target.value } : li))}
                            className='bg-transparent border-b border-white/20 focus:border-fm-gold outline-none text-sm'
                          />
                        </div>
                        <button
                          onClick={() => setLineItems(prev => prev.filter((_, i) => i !== idx))}
                          className='text-red-400 hover:text-red-300'
                        >
                          <Trash2 className='h-4 w-4' />
                        </button>
                      </div>

                      {item.type === 'ticket' && (
                        <div className='mb-3'>
                          <label className='text-xs text-muted-foreground'>Ticket Tier</label>
                          <FmCommonSelect
                            value={item.ticketTierId || ''}
                            onChange={(value) => setLineItems(prev => prev.map((li, i) => i === idx ? { ...li, ticketTierId: value } : li))}
                            options={tierOptionsStyled}
                            placeholder='Select tier...'
                          />
                        </div>
                      )}

                      <div className='grid grid-cols-2 gap-2'>
                        <div>
                          <label className='text-xs text-muted-foreground'>Qty Mode</label>
                          <FmCommonSelect
                            value={item.quantity.mode}
                            onChange={(mode) => setLineItems(prev => prev.map((li, i) => i === idx ? {
                              ...li,
                              quantity: { ...li.quantity, mode: mode as 'column' | 'hardcoded' | 'formula', value: '' }
                            } : li))}
                            options={[
                              { value: 'column', label: 'CSV Column' },
                              { value: 'hardcoded', label: 'Fixed Value' },
                            ]}
                          />
                        </div>
                        <div>
                          <label className='text-xs text-muted-foreground'>Quantity</label>
                          {item.quantity.mode === 'column' ? (
                            <FmCommonSelect
                              value={item.quantity.value || NOT_MAPPED_VALUE}
                              onChange={(value) => setLineItems(prev => prev.map((li, i) => i === idx ? {
                                ...li,
                                quantity: { ...li.quantity, value: value === NOT_MAPPED_VALUE ? '' : value }
                              } : li))}
                              options={headerOptions}
                              placeholder='Select column...'
                            />
                          ) : (
                            <input
                              type='number'
                              min='1'
                              value={item.quantity.value || ''}
                              onChange={(e) => setLineItems(prev => prev.map((li, i) => i === idx ? {
                                ...li,
                                quantity: { ...li.quantity, value: e.target.value }
                              } : li))}
                              placeholder='Enter quantity'
                              className='w-full h-9 px-3 bg-black/40 border border-white/20 text-sm focus:border-fm-gold focus:outline-none transition-colors'
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </FmCommonCardContent>
      </FmCommonCard>

      {/* Unmapped Fields Manager */}
      {unmappedColumns.length > 0 && (
        <FmCommonCard hoverable={false}>
          <FmCommonCardContent className='p-4'>
            <div className='flex items-center justify-between mb-4'>
              <div>
                <h3 className='font-medium'>Unmapped Fields</h3>
                <p className='text-xs text-muted-foreground mt-1'>
                  {unmappedColumns.length} CSV column{unmappedColumns.length !== 1 ? 's' : ''} not yet mapped.
                </p>
              </div>
              <button
                onClick={() => setShowUnmappedManager(!showUnmappedManager)}
                className='text-sm text-fm-gold flex items-center gap-1'
              >
                {showUnmappedManager ? <ChevronUp className='h-4 w-4' /> : <ChevronDown className='h-4 w-4' />}
              </button>
            </div>

            {showUnmappedManager && (
              <div className='space-y-4'>
                <div className='flex flex-wrap gap-2 p-3 bg-black/20 border border-white/10 rounded-sm'>
                  <span className='text-xs text-muted-foreground mr-2'>Available:</span>
                  {unmappedColumns.map(col => (
                    <span key={col} className='px-2 py-1 bg-white/10 text-xs font-mono text-muted-foreground'>
                      {col}
                    </span>
                  ))}
                </div>

                {unmappedAssignments.length > 0 && (
                  <div className='space-y-2'>
                    {unmappedAssignments.map(assignment => {
                      const fieldsForTable = ASSIGNABLE_FIELDS.filter(f => f.table === assignment.targetTable);

                      // Get target columns already assigned by OTHER assignments (not this one)
                      const usedTargetColumns = unmappedAssignments
                        .filter(a => a.id !== assignment.id && a.targetTable === assignment.targetTable)
                        .map(a => a.targetColumn);

                      // Filter available target columns to exclude already-used ones
                      // But always include the current assignment's selected column
                      const availableTargetColumns = fieldsForTable.filter(f =>
                        f.column === assignment.targetColumn || !usedTargetColumns.includes(f.column)
                      );

                      // Include the currently selected column in options even if it's been "consumed"
                      // because unmappedColumns filters out already-assigned columns
                      const csvColumnOptions = [
                        ...(assignment.csvColumn && !unmappedColumns.includes(assignment.csvColumn)
                          ? [{ value: assignment.csvColumn, label: assignment.csvColumn, labelClassName: 'font-mono text-xs' }]
                          : []),
                        ...unmappedColumns.map(col => ({ value: col, label: col, labelClassName: 'font-mono text-xs' }))
                      ];
                      return (
                        <div key={assignment.id} className='flex items-center gap-2 p-2 border border-white/10 bg-black/10 rounded-sm'>
                          <div className='flex-1'>
                            <label className='text-xs text-muted-foreground block mb-1'>CSV Column</label>
                            <FmCommonSelect
                              value={assignment.csvColumn}
                              onChange={(value) => updateUnmappedAssignment(assignment.id, { csvColumn: value })}
                              options={csvColumnOptions}
                              placeholder='Select column...'
                            />
                          </div>
                          <div className='flex-1'>
                            <label className='text-xs text-muted-foreground block mb-1'>Target Table</label>
                            <FmCommonSelect
                              value={assignment.targetTable}
                              onChange={(value) => {
                                // Get columns already used for this table by other assignments
                                const usedColumnsForNewTable = unmappedAssignments
                                  .filter(a => a.id !== assignment.id && a.targetTable === value)
                                  .map(a => a.targetColumn);
                                // Find first available column for the new table
                                const firstAvailableField = ASSIGNABLE_FIELDS.find(
                                  f => f.table === value && !usedColumnsForNewTable.includes(f.column)
                                );
                                updateUnmappedAssignment(assignment.id, {
                                  targetTable: value,
                                  targetColumn: firstAvailableField?.column || ''
                                });
                              }}
                              options={assignableTables.map(table => ({ value: table, label: table, labelClassName: 'font-mono text-xs' }))}
                              placeholder='Select table...'
                            />
                          </div>
                          <div className='flex-1'>
                            <label className='text-xs text-muted-foreground block mb-1'>Target Column</label>
                            <FmCommonSelect
                              value={assignment.targetColumn}
                              onChange={(value) => updateUnmappedAssignment(assignment.id, { targetColumn: value })}
                              options={availableTargetColumns.map(f => ({
                                value: f.column,
                                label: f.column,
                                labelClassName: 'font-mono text-xs'
                              }))}
                              placeholder='Select column...'
                            />
                          </div>
                          <button
                            onClick={() => removeUnmappedAssignment(assignment.id)}
                            className='text-red-400 hover:text-red-300 mt-4 p-1'
                          >
                            <Trash2 className='h-4 w-4' />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <FmCommonButton
                  variant='default'
                  size='sm'
                  onClick={addUnmappedAssignment}
                  disabled={unmappedColumns.length === 0}
                >
                  <Plus className='h-3 w-3 mr-1' />
                  Add Field Assignment
                </FmCommonButton>
              </div>
            )}
          </FmCommonCardContent>
        </FmCommonCard>
      )}

      {/* Validate Button */}
      <div className='flex justify-between'>
        <FmCommonButton variant='secondary' onClick={onBack}>
          Back
        </FmCommonButton>
        <FmCommonButton
          variant='gold'
          onClick={onValidate}
          disabled={isValidating || !columnMapping.customer_email.value}
        >
          {isValidating ? (
            <>
              <FmCommonLoadingSpinner size='sm' className='mr-2' />
              Validating...
            </>
          ) : (
            'Validate & Preview'
          )}
        </FmCommonButton>
      </div>
    </div>
  );
}
