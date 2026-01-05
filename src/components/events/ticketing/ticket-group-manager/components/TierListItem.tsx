import { useTranslation } from 'react-i18next';
import { GripVertical, Copy, Trash2, AlertCircle } from 'lucide-react';
import { Switch } from '@/components/common/shadcn/switch';
import { FmCommonCard, FmCommonCardContent } from '@/components/common/display/FmCommonCard';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonIconButton } from '@/components/common/buttons/FmCommonIconButton';
import { FmI18nCommon } from '@/components/common/i18n';
import type { TicketTier } from '../types';
import { formatPrice } from '../utils';

interface TierListItemProps {
  tier: TicketTier;
  tierIndex: number;
  isFirstTier: boolean;
  isOnlyTier: boolean;
  isProtected?: boolean;
  onUpdate: (updates: Partial<TicketTier>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function TierListItem({
  tier,
  tierIndex,
  isFirstTier,
  isOnlyTier,
  isProtected = false,
  onUpdate,
  onDuplicate,
  onDelete,
}: TierListItemProps) {
  const { t } = useTranslation('common');

  return (
    <FmCommonCard className='bg-background/50 border-border/50'>
      <FmCommonCardContent className='pt-4 space-y-4'>
        <div className='flex items-start gap-3'>
          <FmCommonIconButton
            icon={GripVertical}
            variant='secondary'
            size='sm'
            className='mt-2 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground'
            aria-label={t('tierListItem.dragToReorder')}
          />

          <div className='flex-1 space-y-3'>
            <div className='grid grid-cols-2 gap-3'>
              <FmCommonTextField
                label={t('tierListItem.tierName')}
                value={tier.name}
                onChange={e =>
                  onUpdate({
                    name: e.target.value,
                  })
                }
                placeholder={t('tierListItem.tierNamePlaceholder')}
              />
              <FmCommonTextField
                label={t('tierListItem.price')}
                type='number'
                step='0.01'
                min='0'
                value={(tier.price_cents / 100).toFixed(2)}
                onChange={e =>
                  onUpdate({
                    price_cents: Math.round(
                      parseFloat(e.target.value || '0') * 100
                    ),
                  })
                }
                prepend='$'
                placeholder='0.00'
              />
            </div>

            <FmCommonTextField
              label={t('tierListItem.description')}
              multiline
              rows={2}
              value={tier.description}
              onChange={e =>
                onUpdate({
                  description: e.target.value,
                })
              }
              placeholder={t('tierListItem.descriptionPlaceholder')}
              className='text-xs'
            />

            <div className='grid grid-cols-2 gap-3'>
              <FmCommonTextField
                label={t('tierListItem.totalTickets')}
                type='number'
                min='0'
                value={tier.total_tickets}
                onChange={e =>
                  onUpdate({
                    total_tickets: parseInt(e.target.value || '0'),
                  })
                }
                placeholder='0'
              />
              <div>
                <label className='text-xs uppercase text-muted-foreground'>{t('tierListItem.potentialRevenue')}</label>
                <div className='h-10 px-3 flex items-center bg-muted/50 text-sm font-semibold text-fm-gold'>
                  {formatPrice(tier.total_tickets * tier.price_cents)}
                </div>
              </div>
            </div>

            <div className='flex items-center space-x-2 p-3 bg-muted/30'>
              <Switch
                id={`hide-tier-${tierIndex}`}
                checked={tier.hide_until_previous_sold_out}
                onCheckedChange={checked =>
                  onUpdate({
                    hide_until_previous_sold_out: checked,
                  })
                }
              />
              <div className='flex-1'>
                <label
                  htmlFor={`hide-tier-${tierIndex}`}
                  className='cursor-pointer text-xs'
                >
                  {t('tierListItem.hideUntilSoldOut')}
                </label>
                {isFirstTier && tier.hide_until_previous_sold_out && (
                  <div className='flex items-center gap-1 text-xs text-amber-500 mt-1'>
                    <AlertCircle className='h-3 w-3' />
                    <FmI18nCommon i18nKey='tierListItem.firstTierWarning' />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className='flex flex-col gap-1'>
            <FmCommonIconButton
              icon={Copy}
              variant='secondary'
              size='sm'
              onClick={onDuplicate}
              tooltip={t('tierListItem.duplicateTier')}
            />
            <FmCommonIconButton
              icon={Trash2}
              variant='destructive'
              size='sm'
              onClick={onDelete}
              disabled={isOnlyTier || isProtected}
              tooltip={isProtected ? t('tierListItem.cannotDeleteLast') : t('tierListItem.deleteTier')}
            />
          </div>
        </div>
      </FmCommonCardContent>
    </FmCommonCard>
  );
}
