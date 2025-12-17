import { useTranslation } from 'react-i18next';
import { ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Separator } from '@/components/common/shadcn/separator';

export function CartTabContent() {
  const { t } = useTranslation('common');

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
