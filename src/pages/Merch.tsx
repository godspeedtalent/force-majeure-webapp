import { ShoppingCart, Filter, ArrowUpDown } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { FmCommonEmptyState } from '@/components/common/display/FmCommonEmptyState';
import { FmCommonLoadingState } from '@/components/common/feedback/FmCommonLoadingState';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/common/shadcn/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/shadcn/select';

import { useMerchProducts, useMerchCategories } from '@/shared/api/queries/productQueries';
import { useCartStore } from '@/shared/stores/cartStore';
import {
  type MerchProduct,
  type MerchCategory,
  getStockStatus,
  canPurchase,
  formatPrice,
  MERCH_CATEGORY_LABELS,
} from '@/features/products/types';
import { StockBadge } from '@/features/products/components/StockBadge';
import { FmImageCard } from '@/components/common/display/FmImageCard';
import { getImageUrl } from '@/shared';

type SortOption = 'date' | 'price-low' | 'price-high' | 'name';

export default function Merch() {
  const { t } = useTranslation('pages');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [filterCategory, setFilterCategory] = useState<MerchCategory | 'all'>('all');

  // Fetch products and categories
  const { data: products = [], isLoading, error } = useMerchProducts(filterCategory);
  const { data: categories = [] } = useMerchCategories();

  // Cart actions
  const addItem = useCartStore((state) => state.addItem);

  // Sort products
  const sortedProducts = useMemo(() => {
    const sorted = [...products];

    switch (sortBy) {
      case 'date':
        sorted.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
      case 'price-low':
        sorted.sort((a, b) => a.price_cents - b.price_cents);
        break;
      case 'price-high':
        sorted.sort((a, b) => b.price_cents - a.price_cents);
        break;
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return sorted;
  }, [products, sortBy]);

  const handleAddToCart = (product: MerchProduct) => {
    if (!canPurchase(product)) {
      toast.error(t('merch.outOfStock'));
      return;
    }

    addItem({
      id: product.id,
      type: 'merch',
      name: product.name,
      price: product.price_cents,
      imageUrl: product.image_url ?? undefined,
      metadata: {
        category: product.category,
        sku: product.sku,
      },
    });

    toast.success(t('merch.addedToCart', { name: product.name }));
  };

  if (isLoading) {
    return (
      <Layout hideFooter>
        <div className='h-[calc(100dvh-64px)] w-full'>
          <FmCommonLoadingState />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
          <FmCommonEmptyState
            icon={ShoppingCart}
            title={t('merch.loadFailed')}
            description={error.message}
          />
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
          {/* Category Filter */}
          <div className='flex items-center gap-2'>
            <Filter className='h-4 w-4 text-muted-foreground' />
            <Select
              value={filterCategory}
              onValueChange={(value) => setFilterCategory(value as MerchCategory | 'all')}
            >
              <SelectTrigger className='w-48'>
                <SelectValue placeholder={t('merch.filterByType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>{t('merch.allItems')}</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {MERCH_CATEGORY_LABELS[category] || category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort */}
          <div className='flex items-center gap-2'>
            <ArrowUpDown className='h-4 w-4 text-muted-foreground' />
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className='w-48'>
                <SelectValue placeholder={t('merch.sortBy')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='date'>{t('merch.dateAdded')}</SelectItem>
                <SelectItem value='price-low'>{t('merch.priceLowHigh')}</SelectItem>
                <SelectItem value='price-high'>{t('merch.priceHighLow')}</SelectItem>
                <SelectItem value='name'>{t('merch.nameAZ', 'Name (A-Z)')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Grid */}
        {sortedProducts.length === 0 ? (
          <FmCommonEmptyState
            icon={ShoppingCart}
            title={t('merch.noItems')}
            description={t('merch.noItemsDescription')}
          />
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
            {sortedProducts.map((product) => {
              const stockStatus = getStockStatus(product);
              const isPurchasable = canPurchase(product);

              return (
                <FmImageCard
                  key={product.id}
                  image={getImageUrl(product.image_url)}
                  imageAlt={product.name}
                  title={product.name}
                  badge={product.category ? MERCH_CATEGORY_LABELS[product.category] : undefined}
                  badgeVariant='secondary'
                  showHoverEffect
                >
                  {/* Description */}
                  {product.description && (
                    <p className='text-sm text-muted-foreground line-clamp-2 mb-3'>
                      {product.description}
                    </p>
                  )}

                  {/* Price and Stock */}
                  <div className='flex items-center justify-between mb-3'>
                    <span className='text-2xl font-bold text-foreground'>
                      {formatPrice(product.price_cents)}
                    </span>
                    <StockBadge
                      status={stockStatus}
                      quantity={product.stock_quantity}
                      showQuantity={stockStatus === 'low_stock'}
                    />
                  </div>

                  {/* Add to Cart Button */}
                  <Button
                    onClick={() => handleAddToCart(product)}
                    disabled={!isPurchasable}
                    className='w-full'
                    variant='outline'
                  >
                    <ShoppingCart className='h-4 w-4 mr-2' />
                    {isPurchasable ? t('merch.addToCart') : t('merch.outOfStock')}
                  </Button>
                </FmImageCard>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
