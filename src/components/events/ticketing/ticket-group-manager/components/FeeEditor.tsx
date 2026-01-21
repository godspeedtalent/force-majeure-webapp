import { useTranslation } from 'react-i18next';
import { DollarSign, Percent } from 'lucide-react';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonToggle } from '@/components/common/forms/FmCommonToggle';
import { Label } from '@/components/common/shadcn/label';

interface FeeEditorProps {
  /** Label for the inherit toggle */
  inheritLabel: string;
  /** Description for the inherit toggle */
  inheritDescription: string;
  /** Whether fees are being inherited */
  isInheriting: boolean;
  /** Callback when inherit toggle changes */
  onInheritChange: (inherit: boolean) => void;
  /** Flat fee in cents */
  flatFeeCents: number;
  /** Callback when flat fee changes */
  onFlatFeeChange: (cents: number) => void;
  /** Percentage fee in basis points */
  pctFeeBps: number;
  /** Callback when percentage fee changes */
  onPctFeeChange: (bps: number) => void;
  /** Whether the editor is disabled */
  disabled?: boolean;
  /** Inherited fee values to display in read-only mode (when inheriting) */
  inheritedFees?: {
    flatCents: number;
    pctBps: number;
  };
}

/**
 * FeeEditor - Reusable component for editing fee settings
 *
 * Used at event, group, and tier levels for the hierarchical fee system.
 * Shows inherited values in read-only mode when inheriting is enabled.
 */
export function FeeEditor({
  inheritLabel,
  inheritDescription,
  isInheriting,
  onInheritChange,
  flatFeeCents,
  onFlatFeeChange,
  pctFeeBps,
  onPctFeeChange,
  disabled = false,
  inheritedFees,
}: FeeEditorProps) {
  const { t } = useTranslation('common');

  // Determine which values to display
  const displayFlatCents = isInheriting && inheritedFees ? inheritedFees.flatCents : flatFeeCents;
  const displayPctBps = isInheriting && inheritedFees ? inheritedFees.pctBps : pctFeeBps;

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
          disabled={disabled}
        />
      </div>

      {/* Fee Fields - show values in read-only mode when inheriting */}
      <div className='grid grid-cols-2 gap-4 pt-4 border-t border-border'>
        <div className='space-y-1.5'>
          <Label className='text-xs text-muted-foreground uppercase flex items-center gap-1'>
            <DollarSign className='h-3 w-3' />
            {t('ticketing.flatFee')}
          </Label>
          {isInheriting ? (
            <div className='h-10 px-3 flex items-center bg-muted/30 text-sm text-muted-foreground border border-border'>
              ${(displayFlatCents / 100).toFixed(2)}
              <span className='ml-2 text-xs opacity-70'>({t('ticketing.inherited')})</span>
            </div>
          ) : (
            <FmCommonTextField
              type='number'
              min={0}
              step={0.01}
              value={(flatFeeCents / 100).toFixed(2)}
              onChange={e => onFlatFeeChange(Math.round(parseFloat(e.target.value || '0') * 100))}
              prepend='$'
              placeholder='0.00'
              disabled={disabled}
            />
          )}
          <p className='text-xs text-muted-foreground'>{t('ticketing.flatFeeHint')}</p>
        </div>
        <div className='space-y-1.5'>
          <Label className='text-xs text-muted-foreground uppercase flex items-center gap-1'>
            <Percent className='h-3 w-3' />
            {t('ticketing.percentFee')}
          </Label>
          {isInheriting ? (
            <div className='h-10 px-3 flex items-center bg-muted/30 text-sm text-muted-foreground border border-border'>
              {(displayPctBps / 100).toFixed(2)}%
              <span className='ml-2 text-xs opacity-70'>({t('ticketing.inherited')})</span>
            </div>
          ) : (
            <FmCommonTextField
              type='number'
              min={0}
              max={100}
              step={0.01}
              value={(pctFeeBps / 100).toFixed(2)}
              onChange={e => onPctFeeChange(Math.round(parseFloat(e.target.value || '0') * 100))}
              placeholder='0.00%'
              disabled={disabled}
            />
          )}
          <p className='text-xs text-muted-foreground'>{t('ticketing.percentFeeHint')}</p>
        </div>
      </div>
    </div>
  );
}
