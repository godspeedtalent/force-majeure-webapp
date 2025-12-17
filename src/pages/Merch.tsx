import { ShoppingCart, Filter } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { logger } from '@/shared';

import { FmCommonEmptyState } from '@/components/common/display/FmCommonEmptyState';
import { FmCommonLoadingState } from '@/components/common/feedback/FmCommonLoadingState';
import { Layout } from '@/components/layout/Layout';
import { Badge } from '@/components/common/shadcn/badge';
import { Button } from '@/components/common/shadcn/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/shadcn/select';
import { MerchCard } from '@/features/merch/components/MerchCard';

interface MerchItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  type: string;
  image_url: string | null;
  in_stock: boolean;
  created_at: string;
}

export default function Merch() {
  const { t } = useTranslation('pages');
  const [items, setItems] = useState<MerchItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MerchItem[]>([]);
  const [sortBy, setSortBy] = useState<string>('date');
  const [filterType, setFilterType] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMerchItems();
  }, []);

  useEffect(() => {
    let filtered = [...items];

    // Apply filter
    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.type === filterType);
    }

    // Apply sorting
    if (sortBy === 'date') {
      filtered.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else if (sortBy === 'price-low') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      filtered.sort((a, b) => b.price - a.price);
    }

    setFilteredItems(filtered);
  }, [items, sortBy, filterType]);

  const fetchMerchItems = async () => {
    try {
      // Note: 'merch' table doesn't exist yet - this is a placeholder
      // TODO: Create merch table in database
      logger.error('Merch table not yet implemented', {
        source: 'Merch.tsx',
        details: 'fetchMerchItems',
      });
      setItems([]);
      toast.error(t('merch.comingSoon'));
    } catch (error) {
      logger.error('Error fetching merch:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'Merch.tsx',
        details: 'fetchMerchItems',
      });
      toast.error(t('merch.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return price % 1 === 0 ? `$${price.toFixed(0)}` : `$${price.toFixed(2)}`;
  };

  const handleAddToCart = (item: MerchItem) => {
    toast.success(t('merch.addedToCart', { name: item.name }));
  };

  if (loading) {
    return (
      <Layout>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
          <FmCommonLoadingState message={t('merch.loading')} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in'>
        {/* Header */}
        <div className='text-center mb-12'>
          <h1 className='text-4xl font-canela text-foreground mb-4'>
            {t('merch.title')}
          </h1>
          <p className='text-lg text-muted-foreground max-w-2xl mx-auto'>
            {t('merch.subtitle')}
          </p>
        </div>

        {/* Controls */}
        <div className='flex flex-col sm:flex-row gap-4 mb-8'>
          <div className='flex items-center gap-2'>
            <Filter className='h-4 w-4 text-muted-foreground' />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className='w-48'>
                <SelectValue placeholder={t('merch.filterByType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>{t('merch.allItems')}</SelectItem>
                <SelectItem value='Limited Prints'>{t('merch.limitedPrints')}</SelectItem>
                <SelectItem value='Stickers'>{t('merch.stickers')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className='w-48'>
              <SelectValue placeholder={t('merch.sortBy')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='date'>{t('merch.dateAdded')}</SelectItem>
              <SelectItem value='price-low'>{t('merch.priceLowHigh')}</SelectItem>
              <SelectItem value='price-high'>{t('merch.priceHighLow')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Grid */}
        {filteredItems.length === 0 ? (
          <FmCommonEmptyState
            icon={ShoppingCart}
            title={t('merch.noItems')}
            description={t('merch.noItemsDescription')}
          />
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
            {filteredItems.map(item => (
              <MerchCard
                key={item.id}
                id={item.id}
                name={item.name}
                description={item.description}
                price={item.price}
                type={item.type}
                image_url={item.image_url}
                in_stock={item.in_stock}
              >
                {item.description && (
                  <p className='text-sm text-muted-foreground line-clamp-2 mb-3'>
                    {item.description}
                  </p>
                )}
                <div className='flex items-center justify-between mb-3'>
                  <span className='text-2xl font-bold text-foreground'>
                    {formatPrice(item.price)}
                  </span>
                  {!item.in_stock && (
                    <Badge variant='destructive'>{t('merch.outOfStock')}</Badge>
                  )}
                </div>
                <Button
                  onClick={() => handleAddToCart(item)}
                  disabled={!item.in_stock}
                  className='w-full'
                  variant={item.in_stock ? 'default' : 'secondary'}
                >
                  <ShoppingCart className='h-4 w-4 mr-2' />
                  {item.in_stock ? t('merch.addToCart') : t('merch.outOfStock')}
                </Button>
              </MerchCard>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
