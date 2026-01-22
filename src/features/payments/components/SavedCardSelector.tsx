import { CreditCard, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared';
import type { SavedCard } from '../types';

interface SavedCardSelectorProps {
  cards: SavedCard[];
  selectedCardId: string | null;
  onSelectCard: (cardId: string) => void;
  onRemoveCard?: (cardId: string) => void;
  onUseNewCard?: () => void;
  loading?: boolean;
}

/**
 * SavedCardSelector - Display and select from saved payment methods
 *
 * Shows a list of saved cards with selection, removal, and new card options.
 */
export const SavedCardSelector = ({
  cards,
  selectedCardId,
  onSelectCard,
  onRemoveCard,
  onUseNewCard,
  loading = false,
}: SavedCardSelectorProps) => {
  const { t } = useTranslation('common');

  if (cards.length === 0) {
    return null;
  }

  const getCardBrandIcon = (_brand: string) => {
    // You can expand this with actual card brand icons
    return <CreditCard className='h-4 w-4' />;
  };

  return (
    <div className='space-y-3'>
      <p className='text-sm font-medium text-foreground'>{t('savedCards.title')}</p>

      <div className='space-y-2'>
        {cards.map(card => (
          <button
            key={card.id}
            type='button'
            onClick={() => onSelectCard(card.id)}
            disabled={loading}
            className={cn(
              'w-full p-3 rounded-none border-2 text-left transition-all group',
              'hover:border-fm-gold/50',
              selectedCardId === card.id
                ? 'border-fm-gold bg-fm-gold/5'
                : 'border-border',
              loading && 'opacity-50 cursor-not-allowed'
            )}
          >
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <div className='text-fm-gold'>
                  {getCardBrandIcon(card.brand)}
                </div>
                <div>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm font-medium capitalize'>
                      {card.brand}
                    </span>
                    <span className='text-sm text-muted-foreground'>
                      •••• {card.last4}
                    </span>
                  </div>
                  <span className='text-xs text-muted-foreground'>
                    {t('savedCards.expires', { month: card.exp_month, year: card.exp_year })}
                  </span>
                </div>
              </div>

              {onRemoveCard && (
                <button
                  type='button'
                  onClick={e => {
                    e.stopPropagation();
                    onRemoveCard(card.id);
                  }}
                  disabled={loading}
                  className={cn(
                    'opacity-0 group-hover:opacity-100 transition-opacity',
                    'p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive'
                  )}
                  title={t('savedCards.removeCard')}
                >
                  <Trash2 className='h-4 w-4' />
                </button>
              )}
            </div>
          </button>
        ))}
      </div>

      {onUseNewCard && (
        <button
          type='button'
          onClick={onUseNewCard}
          disabled={loading}
          className='text-sm text-fm-gold hover:underline transition-all disabled:opacity-50'
        >
          {t('savedCards.useDifferentCard')}
        </button>
      )}
    </div>
  );
};
