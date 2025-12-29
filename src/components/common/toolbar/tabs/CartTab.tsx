import { useTranslation } from 'react-i18next';
import { ShoppingCart, Trash2, Plus, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Separator } from '@/components/common/shadcn/separator';
import { Button } from '@/components/common/shadcn/button';
import { useCartStore } from '@/shared/stores/cartStore';
import { formatPrice } from '@/features/products/types';

export function CartTabContent() {
  const { t } = useTranslation('common');
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);

  if (items.length === 0) {
    return (
      <div className='space-y-4'>
        <Separator className='bg-white/10' />
        <div className='text-center py-12'>
          <ShoppingCart className='w-12 h-12 text-muted-foreground mx-auto mb-4' />
          <h3 className='text-lg font-medium text-foreground mb-2'>
            {t('cart.empty')}
          </h3>
          <p className='text-sm text-muted-foreground'>
            {t('cart.whyNot')}{' '}
            <Link
              to='/merch'
              className='text-fm-gold hover:text-fm-gold/80 underline transition-colors'
            >
              {t('cart.checkOutMerch')}
            </Link>
            ?
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <Separator className='bg-white/10' />

      {/* Cart Items */}
      <div className='space-y-3 max-h-[400px] overflow-y-auto'>
        {items.map((item) => (
          <div
            key={item.id}
            className='flex items-center gap-3 p-3 bg-black/40 border border-white/10 rounded-none'
          >
            {/* Item Image */}
            {item.imageUrl && (
              <img
                src={item.imageUrl}
                alt={item.name}
                className='w-12 h-12 object-cover rounded-none'
              />
            )}

            {/* Item Details */}
            <div className='flex-1 min-w-0'>
              <p className='text-sm font-medium text-foreground truncate'>
                {item.name}
              </p>
              <p className='text-xs text-muted-foreground'>
                {formatPrice(item.price)} {t('cart.each', 'each')}
              </p>
            </div>

            {/* Quantity Controls */}
            <div className='flex items-center gap-1'>
              <Button
                variant='ghost'
                size='icon'
                className='h-6 w-6'
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
              >
                <Minus className='h-3 w-3' />
              </Button>
              <span className='w-6 text-center text-sm'>{item.quantity}</span>
              <Button
                variant='ghost'
                size='icon'
                className='h-6 w-6'
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
              >
                <Plus className='h-3 w-3' />
              </Button>
            </div>

            {/* Remove Button */}
            <Button
              variant='ghost'
              size='icon'
              className='h-6 w-6 text-muted-foreground hover:text-fm-danger'
              onClick={() => removeItem(item.id)}
            >
              <Trash2 className='h-3 w-3' />
            </Button>
          </div>
        ))}
      </div>

      <Separator className='bg-white/10' />

      {/* Total */}
      <div className='flex items-center justify-between'>
        <span className='text-sm text-muted-foreground'>{t('cart.total', 'Total')}</span>
        <span className='text-lg font-bold text-foreground'>
          {formatPrice(getTotalPrice())}
        </span>
      </div>

      {/* Actions */}
      <div className='flex gap-2'>
        <Button
          variant='outline'
          size='sm'
          className='flex-1'
          onClick={clearCart}
        >
          {t('cart.clear', 'Clear')}
        </Button>
        <Button
          variant='outline'
          size='sm'
          className='flex-1 border-fm-gold text-fm-gold hover:bg-fm-gold/10'
          asChild
        >
          <Link to='/checkout'>{t('cart.checkout', 'Checkout')}</Link>
        </Button>
      </div>
    </div>
  );
}
