import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, DollarSign, Percent, GripVertical } from 'lucide-react';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonToggle } from '@/components/common/forms/FmCommonToggle';
import { FmCommonIconButton } from '@/components/common/buttons/FmCommonIconButton';
import { Label } from '@/components/common/shadcn/label';
import { Button } from '@/components/common/shadcn/button';
import { cn } from '@/shared';
import type { FeeItem, FeeType, CreateFeeItemInput } from '@/features/events/hooks/useEntityFeeItems';

interface InheritedFee {
  label: string;
  fee_type: FeeType;
  fee_value: number;
}

interface FeeItemsEditorProps {
  /** Label for the inherit toggle */
  inheritLabel: string;
  /** Description for the inherit toggle */
  inheritDescription: string;
  /** Whether fees are being inherited from parent */
  isInheriting: boolean;
  /** Callback when inherit toggle changes */
  onInheritChange: (inherit: boolean) => void;
  /** Inherited fees from parent level (shown in read-only mode when inheriting) */
  inheritedFees?: InheritedFee[];
  /** Current fee items for this entity */
  feeItems: FeeItem[];
  /** Callback to add a new fee item */
  onAddFeeItem: (input: CreateFeeItemInput) => void;
  /** Callback to update a fee item */
  onUpdateFeeItem: (id: string, updates: Partial<FeeItem>) => void;
  /** Callback to delete a fee item */
  onDeleteFeeItem: (id: string) => void;
  /** Whether the editor is disabled */
  disabled?: boolean;
  /** Whether operations are in progress */
  isLoading?: boolean;
}

/**
 * FeeItemsEditor - Component for managing multiple fee items with labels
 *
 * Supports hierarchical inheritance where entities can inherit parent fees
 * AND add their own additional fees on top.
 */
export function FeeItemsEditor({
  inheritLabel,
  inheritDescription,
  isInheriting,
  onInheritChange,
  inheritedFees = [],
  feeItems,
  onAddFeeItem,
  onUpdateFeeItem,
  onDeleteFeeItem,
  disabled = false,
  isLoading = false,
}: FeeItemsEditorProps) {
  const { t } = useTranslation('common');
  const [newFeeLabel, setNewFeeLabel] = useState('');
  const [newFeeType, setNewFeeType] = useState<FeeType>('flat');
  const [newFeeValue, setNewFeeValue] = useState('');
  const [isAddingFee, setIsAddingFee] = useState(false);

  const handleAddFee = () => {
    if (!newFeeLabel.trim() || !newFeeValue) return;

    const value = parseFloat(newFeeValue);
    if (isNaN(value) || value < 0) return;

    // Convert to appropriate unit (cents for flat, basis points for percentage)
    const feeValue = newFeeType === 'flat'
      ? Math.round(value * 100) // Convert dollars to cents
      : Math.round(value * 100); // Convert percent to basis points

    onAddFeeItem({
      label: newFeeLabel.trim(),
      fee_type: newFeeType,
      fee_value: feeValue,
    });

    // Reset form
    setNewFeeLabel('');
    setNewFeeType('flat');
    setNewFeeValue('');
    setIsAddingFee(false);
  };

  const formatFeeValue = (feeType: FeeType, value: number) => {
    if (feeType === 'flat') {
      return `$${(value / 100).toFixed(2)}`;
    }
    return `${(value / 100).toFixed(2)}%`;
  };

  return (
    <div className='space-y-4 p-4 border border-border bg-card'>
      {/* Inherit Toggle */}
      <div className='flex items-center gap-3'>
        <div className='flex-1'>
          <Label className='cursor-pointer font-medium'>{inheritLabel}</Label>
          <p className='text-xs text-muted-foreground mt-1'>{inheritDescription}</p>
        </div>
        <FmCommonToggle
          id="fee-inherit-toggle"
          label={inheritLabel}
          hideLabel
          checked={isInheriting}
          onCheckedChange={onInheritChange}
          disabled={disabled || isLoading}
        />
      </div>

      {/* Inherited Fees Display */}
      {isInheriting && inheritedFees.length > 0 && (
        <div className='pt-4 border-t border-border space-y-2'>
          <Label className='text-xs text-muted-foreground uppercase'>
            {t('ticketing.inheritedFees')}
          </Label>
          <div className='space-y-2'>
            {inheritedFees.map((fee, index) => (
              <div
                key={index}
                className='flex items-center justify-between px-3 py-2 bg-muted/30 border border-border'
              >
                <div className='flex items-center gap-2'>
                  {fee.fee_type === 'flat' ? (
                    <DollarSign className='h-3 w-3 text-muted-foreground' />
                  ) : (
                    <Percent className='h-3 w-3 text-muted-foreground' />
                  )}
                  <span className='text-sm'>{fee.label}</span>
                </div>
                <span className='text-sm text-muted-foreground'>
                  {formatFeeValue(fee.fee_type, fee.fee_value)}
                  <span className='ml-2 text-xs opacity-70'>({t('ticketing.inherited')})</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Additional Fees Section */}
      <div className='pt-4 border-t border-border space-y-3'>
        <div className='flex items-center justify-between'>
          <Label className='text-xs text-muted-foreground uppercase'>
            {isInheriting ? t('ticketing.additionalFees') : t('ticketing.customFees')}
          </Label>
          {!isAddingFee && (
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => setIsAddingFee(true)}
              disabled={disabled || isLoading}
              className='h-7 text-xs gap-1'
            >
              <Plus className='h-3 w-3' />
              {t('ticketing.addFee')}
            </Button>
          )}
        </div>

        {/* Existing Fee Items */}
        {feeItems.length > 0 && (
          <div className='space-y-2'>
            {feeItems.map(item => (
              <FeeItemRow
                key={item.id}
                item={item}
                onUpdate={(updates) => onUpdateFeeItem(item.id, updates)}
                onDelete={() => onDeleteFeeItem(item.id)}
                disabled={disabled || isLoading}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {feeItems.length === 0 && !isAddingFee && (
          <p className='text-xs text-muted-foreground py-2'>
            {isInheriting
              ? t('ticketing.noAdditionalFees')
              : t('ticketing.noCustomFees')}
          </p>
        )}

        {/* Add New Fee Form */}
        {isAddingFee && (
          <div className='space-y-3 p-3 border border-dashed border-fm-gold/30 bg-fm-gold/5'>
            <FmCommonTextField
              label={t('ticketing.feeLabel')}
              value={newFeeLabel}
              onChange={e => setNewFeeLabel(e.target.value)}
              placeholder={t('ticketing.feeLabelPlaceholder')}
              disabled={disabled || isLoading}
            />
            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1.5'>
                <Label className='text-xs text-muted-foreground uppercase'>
                  {t('ticketing.feeType')}
                </Label>
                <div className='flex gap-2'>
                  <Button
                    type='button'
                    size='sm'
                    variant='outline'
                    onClick={() => setNewFeeType('flat')}
                    className={cn(
                      'h-8 px-3 text-xs flex-1',
                      newFeeType === 'flat'
                        ? 'bg-fm-gold/20 border-fm-gold text-foreground'
                        : 'bg-background border-border text-muted-foreground'
                    )}
                  >
                    <DollarSign className='h-3 w-3 mr-1' />
                    {t('labels.flat')}
                  </Button>
                  <Button
                    type='button'
                    size='sm'
                    variant='outline'
                    onClick={() => setNewFeeType('percentage')}
                    className={cn(
                      'h-8 px-3 text-xs flex-1',
                      newFeeType === 'percentage'
                        ? 'bg-fm-gold/20 border-fm-gold text-foreground'
                        : 'bg-background border-border text-muted-foreground'
                    )}
                  >
                    <Percent className='h-3 w-3 mr-1' />%
                  </Button>
                </div>
              </div>
              <FmCommonTextField
                label={newFeeType === 'flat' ? t('labels.amountDollar') : t('labels.percentage')}
                type='number'
                min={0}
                step={0.01}
                value={newFeeValue}
                onChange={e => setNewFeeValue(e.target.value)}
                prepend={newFeeType === 'flat' ? '$' : '%'}
                placeholder='0.00'
                disabled={disabled || isLoading}
              />
            </div>
            <div className='flex gap-2 pt-2'>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => {
                  setIsAddingFee(false);
                  setNewFeeLabel('');
                  setNewFeeType('flat');
                  setNewFeeValue('');
                }}
                disabled={isLoading}
                className='flex-1'
              >
                {t('buttons.cancel')}
              </Button>
              <Button
                type='button'
                size='sm'
                onClick={handleAddFee}
                disabled={!newFeeLabel.trim() || !newFeeValue || isLoading}
                className='flex-1 bg-fm-gold/20 border-fm-gold text-fm-gold hover:bg-fm-gold hover:text-black'
              >
                {t('ticketing.addFee')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface FeeItemRowProps {
  item: FeeItem;
  onUpdate: (updates: Partial<FeeItem>) => void;
  onDelete: () => void;
  disabled?: boolean;
}

function FeeItemRow({ item, onUpdate, onDelete, disabled }: FeeItemRowProps) {
  const { t } = useTranslation('common');
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(item.label);
  const [editType, setEditType] = useState<FeeType>(item.fee_type);
  const [editValue, setEditValue] = useState(
    item.fee_type === 'flat'
      ? (item.fee_value / 100).toFixed(2)
      : (item.fee_value / 100).toFixed(2)
  );

  const handleSave = () => {
    const value = parseFloat(editValue);
    if (isNaN(value) || value < 0) return;

    const feeValue = editType === 'flat'
      ? Math.round(value * 100)
      : Math.round(value * 100);

    onUpdate({
      label: editLabel.trim(),
      fee_type: editType,
      fee_value: feeValue,
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className='space-y-2 p-3 border border-border bg-muted/20'>
        <FmCommonTextField
          value={editLabel}
          onChange={e => setEditLabel(e.target.value)}
          disabled={disabled}
        />
        <div className='grid grid-cols-2 gap-2'>
          <div className='flex gap-1'>
            <Button
              type='button'
              size='sm'
              variant='outline'
              onClick={() => setEditType('flat')}
              className={cn(
                'h-8 px-2 text-xs flex-1',
                editType === 'flat'
                  ? 'bg-fm-gold/20 border-fm-gold'
                  : 'bg-background border-border'
              )}
            >
              <DollarSign className='h-3 w-3' />
            </Button>
            <Button
              type='button'
              size='sm'
              variant='outline'
              onClick={() => setEditType('percentage')}
              className={cn(
                'h-8 px-2 text-xs flex-1',
                editType === 'percentage'
                  ? 'bg-fm-gold/20 border-fm-gold'
                  : 'bg-background border-border'
              )}
            >
              <Percent className='h-3 w-3' />
            </Button>
          </div>
          <FmCommonTextField
            type='number'
            min={0}
            step={0.01}
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            prepend={editType === 'flat' ? '$' : '%'}
            disabled={disabled}
          />
        </div>
        <div className='flex gap-2'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => setIsEditing(false)}
            className='flex-1'
          >
            {t('buttons.cancel')}
          </Button>
          <Button
            type='button'
            size='sm'
            onClick={handleSave}
            disabled={!editLabel.trim() || !editValue}
            className='flex-1 bg-fm-gold/20 border-fm-gold text-fm-gold hover:bg-fm-gold hover:text-black'
          >
            {t('buttons.save')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='flex items-center justify-between px-3 py-2 bg-muted/20 border border-border group'>
      <div className='flex items-center gap-2'>
        <GripVertical className='h-3 w-3 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab' />
        {item.fee_type === 'flat' ? (
          <DollarSign className='h-3 w-3 text-fm-gold' />
        ) : (
          <Percent className='h-3 w-3 text-fm-gold' />
        )}
        <button
          type='button'
          onClick={() => !disabled && setIsEditing(true)}
          className='text-sm hover:text-fm-gold transition-colors'
          disabled={disabled}
        >
          {item.label}
        </button>
      </div>
      <div className='flex items-center gap-2'>
        <span className='text-sm font-medium'>
          {item.fee_type === 'flat'
            ? `$${(item.fee_value / 100).toFixed(2)}`
            : `${(item.fee_value / 100).toFixed(2)}%`}
        </span>
        <FmCommonIconButton
          icon={Trash2}
          variant='destructive'
          size='sm'
          onClick={onDelete}
          disabled={disabled}
          tooltip={t('buttons.delete')}
          className='opacity-0 group-hover:opacity-100 transition-opacity'
        />
      </div>
    </div>
  );
}
