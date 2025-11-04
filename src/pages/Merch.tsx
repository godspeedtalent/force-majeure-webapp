import { ShoppingCart, Filter } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

import { FmCommonEmptyState } from '@/components/common/display/FmCommonEmptyState';
import { FmCommonLoadingState } from '@/components/common/feedback/FmCommonLoadingState';
import { ForceMajeureRootLayout } from '@/components/layout/ForceMajeureRootLayout';
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
import { supabase } from '@/shared/api/supabase/client';

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
      const { data, error } = await supabase
        .from('merch')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching merch:', error);
      toast.error('Failed to load merchandise');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return price % 1 === 0 ? `$${price.toFixed(0)}` : `$${price.toFixed(2)}`;
  };

  const handleAddToCart = (item: MerchItem) => {
    toast.success(`Added ${item.name} to cart!`);
  };

  if (loading) {
    return (
      <ForceMajeureRootLayout>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
          <FmCommonLoadingState message='Loading merchandise...' />
        </div>
      </ForceMajeureRootLayout>
    );
  }

  return (
    <ForceMajeureRootLayout>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in'>
        {/* Header */}
        <div className='text-center mb-12'>
          <h1 className='text-4xl font-canela font-bold text-foreground mb-4'>
            Force Majeure Merchandise
          </h1>
          <p className='text-lg text-muted-foreground max-w-2xl mx-auto'>
            Exclusive prints and stickers from the Force Majeure collection
          </p>
        </div>

        {/* Controls */}
        <div className='flex flex-col sm:flex-row gap-4 mb-8'>
          <div className='flex items-center gap-2'>
            <Filter className='h-4 w-4 text-muted-foreground' />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className='w-48'>
                <SelectValue placeholder='Filter by type' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Items</SelectItem>
                <SelectItem value='Limited Prints'>Limited Prints</SelectItem>
                <SelectItem value='Stickers'>Stickers</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className='w-48'>
              <SelectValue placeholder='Sort by' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='date'>Date Added</SelectItem>
              <SelectItem value='price-low'>Price: Low to High</SelectItem>
              <SelectItem value='price-high'>Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Grid */}
        {filteredItems.length === 0 ? (
          <FmCommonEmptyState
            icon={ShoppingCart}
            title='No items found'
            description='No items found matching your criteria.'
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
                    <Badge variant='destructive'>Out of Stock</Badge>
                  )}
                </div>
                <Button
                  onClick={() => handleAddToCart(item)}
                  disabled={!item.in_stock}
                  className='w-full'
                  variant={item.in_stock ? 'default' : 'secondary'}
                >
                  <ShoppingCart className='h-4 w-4 mr-2' />
                  {item.in_stock ? 'Add to Cart' : 'Out of Stock'}
                </Button>
              </MerchCard>
            ))}
          </div>
        )}
      </div>
    </ForceMajeureRootLayout>
  );
}
