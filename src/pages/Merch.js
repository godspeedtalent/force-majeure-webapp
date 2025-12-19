import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/common/shadcn/select';
import { MerchCard } from '@/features/merch/components/MerchCard';
export default function Merch() {
    const { t } = useTranslation('pages');
    const [items, setItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [sortBy, setSortBy] = useState('date');
    const [filterType, setFilterType] = useState('all');
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
        }
        else if (sortBy === 'price-low') {
            filtered.sort((a, b) => a.price - b.price);
        }
        else if (sortBy === 'price-high') {
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
        }
        catch (error) {
            logger.error('Error fetching merch:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                source: 'Merch.tsx',
                details: 'fetchMerchItems',
            });
            toast.error(t('merch.loadFailed'));
        }
        finally {
            setLoading(false);
        }
    };
    const formatPrice = (price) => {
        return price % 1 === 0 ? `$${price.toFixed(0)}` : `$${price.toFixed(2)}`;
    };
    const handleAddToCart = (item) => {
        toast.success(t('merch.addedToCart', { name: item.name }));
    };
    if (loading) {
        return (_jsx(Layout, { children: _jsx("div", { className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12', children: _jsx(FmCommonLoadingState, { message: t('merch.loading') }) }) }));
    }
    return (_jsx(Layout, { children: _jsxs("div", { className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in', children: [_jsxs("div", { className: 'text-center mb-12', children: [_jsx("h1", { className: 'text-4xl font-canela text-foreground mb-4', children: t('merch.title') }), _jsx("p", { className: 'text-lg text-muted-foreground max-w-2xl mx-auto', children: t('merch.subtitle') })] }), _jsxs("div", { className: 'flex flex-col sm:flex-row gap-4 mb-8', children: [_jsxs("div", { className: 'flex items-center gap-2', children: [_jsx(Filter, { className: 'h-4 w-4 text-muted-foreground' }), _jsxs(Select, { value: filterType, onValueChange: setFilterType, children: [_jsx(SelectTrigger, { className: 'w-48', children: _jsx(SelectValue, { placeholder: t('merch.filterByType') }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: 'all', children: t('merch.allItems') }), _jsx(SelectItem, { value: 'Limited Prints', children: t('merch.limitedPrints') }), _jsx(SelectItem, { value: 'Stickers', children: t('merch.stickers') })] })] })] }), _jsxs(Select, { value: sortBy, onValueChange: setSortBy, children: [_jsx(SelectTrigger, { className: 'w-48', children: _jsx(SelectValue, { placeholder: t('merch.sortBy') }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: 'date', children: t('merch.dateAdded') }), _jsx(SelectItem, { value: 'price-low', children: t('merch.priceLowHigh') }), _jsx(SelectItem, { value: 'price-high', children: t('merch.priceHighLow') })] })] })] }), filteredItems.length === 0 ? (_jsx(FmCommonEmptyState, { icon: ShoppingCart, title: t('merch.noItems'), description: t('merch.noItemsDescription') })) : (_jsx("div", { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6', children: filteredItems.map(item => (_jsxs(MerchCard, { id: item.id, name: item.name, description: item.description, price: item.price, type: item.type, image_url: item.image_url, in_stock: item.in_stock, children: [item.description && (_jsx("p", { className: 'text-sm text-muted-foreground line-clamp-2 mb-3', children: item.description })), _jsxs("div", { className: 'flex items-center justify-between mb-3', children: [_jsx("span", { className: 'text-2xl font-bold text-foreground', children: formatPrice(item.price) }), !item.in_stock && (_jsx(Badge, { variant: 'destructive', children: t('merch.outOfStock') }))] }), _jsxs(Button, { onClick: () => handleAddToCart(item), disabled: !item.in_stock, className: 'w-full', variant: item.in_stock ? 'default' : 'secondary', children: [_jsx(ShoppingCart, { className: 'h-4 w-4 mr-2' }), item.in_stock ? t('merch.addToCart') : t('merch.outOfStock')] })] }, item.id))) }))] }) }));
}
