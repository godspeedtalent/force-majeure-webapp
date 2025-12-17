import { useTranslation } from 'react-i18next';
import { GripVertical, Copy, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/common/shadcn/button';
import { Input } from '@/components/common/shadcn/input';
import { Label } from '@/components/common/shadcn/label';
import { Switch } from '@/components/common/shadcn/switch';
import { Card, CardContent } from '@/components/common/shadcn/card';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/common/shadcn/tooltip';
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
    <Card className='bg-background/50 border-border/50'>
      <CardContent className='pt-4 space-y-4'>
        <div className='flex items-start gap-3'>
          <button className='mt-2 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors'>
            <GripVertical className='h-4 w-4' />
          </button>

          <div className='flex-1 space-y-3'>
            <div className='grid grid-cols-2 gap-3'>
              <div>
                <Label className='text-xs'>{t('tierListItem.tierName')}</Label>
                <Input
                  value={tier.name}
                  onChange={e =>
                    onUpdate({
                      name: e.target.value,
                    })
                  }
                  placeholder={t('tierListItem.tierNamePlaceholder')}
                />
              </div>
              <div>
                <Label className='text-xs'>{t('tierListItem.price')}</Label>
                <div className='relative'>
                  <span className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'>
                    $
                  </span>
                  <Input
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
                    className='pl-7'
                    placeholder='0.00'
                  />
                </div>
              </div>
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
              <div>
                <Label className='text-xs'>{t('tierListItem.totalTickets')}</Label>
                <Input
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
              </div>
              <div>
                <Label className='text-xs'>{t('tierListItem.potentialRevenue')}</Label>
                <div className='h-10 px-3 flex items-center bg-muted/50 rounded-md text-sm font-semibold text-fm-gold'>
                  {formatPrice(tier.total_tickets * tier.price_cents)}
                </div>
              </div>
            </div>

            <div className='flex items-center space-x-2 p-3 bg-muted/30 rounded-md'>
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
                <Label
                  htmlFor={`hide-tier-${tierIndex}`}
                  className='cursor-pointer text-xs'
                >
                  {t('tierListItem.hideUntilSoldOut')}
                </Label>
                {isFirstTier && tier.hide_until_previous_sold_out && (
                  <div className='flex items-center gap-1 text-xs text-amber-500 mt-1'>
                    <AlertCircle className='h-3 w-3' />
                    <span>
                      {t('tierListItem.firstTierWarning')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className='flex flex-col gap-1'>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant='ghost' size='sm' onClick={onDuplicate}>
                    <Copy className='h-4 w-4' />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('tierListItem.duplicateTier')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                 <TooltipTrigger asChild>
                   <Button
                     variant='ghost'
                     size='sm'
                     onClick={onDelete}
                     disabled={isOnlyTier || isProtected}
                   >
                     <Trash2 className='h-4 w-4 text-destructive' />
                   </Button>
                 </TooltipTrigger>
                 <TooltipContent>
                   <p>{isProtected ? t('tierListItem.cannotDeleteLast') : t('tierListItem.deleteTier')}</p>
                 </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
