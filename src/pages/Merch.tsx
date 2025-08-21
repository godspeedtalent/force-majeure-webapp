import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Filter } from 'lucide-react';
import { toast } from 'sonner';

interface MerchItem {
  id: string;
  name: string;
  description: string;
  price: number;
  type: string;
  image_url: string;
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
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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

  const handleAddToCart = (item: MerchItem) => {
    toast.success(`Added ${item.name} to cart!`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <p className="text-muted-foreground">Loading merchandise...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-canela font-bold text-foreground mb-4">
            Force Majeure Merchandise
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Exclusive prints and stickers from the Force Majeure collection
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Items</SelectItem>
                <SelectItem value="Limited Prints">Limited Prints</SelectItem>
                <SelectItem value="Stickers">Stickers</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date Added</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No items found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <Card key={item.id} className="group hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="p-0">
                  <div className="aspect-square bg-muted rounded-t-lg overflow-hidden">
                    <img
                      src={item.image_url || '/placeholder.svg'}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-lg font-medium line-clamp-2">
                      {item.name}
                    </CardTitle>
                    <Badge variant="secondary" className="ml-2 shrink-0">
                      {item.type}
                    </Badge>
                  </div>
                  {item.description && (
                    <CardDescription className="line-clamp-2 mb-3">
                      {item.description}
                    </CardDescription>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-foreground">
                      ${item.price.toFixed(2)}
                    </span>
                    {!item.in_stock && (
                      <Badge variant="destructive">Out of Stock</Badge>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button
                    onClick={() => handleAddToCart(item)}
                    disabled={!item.in_stock}
                    className="w-full"
                    variant={item.in_stock ? "default" : "secondary"}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {item.in_stock ? 'Add to Cart' : 'Out of Stock'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}