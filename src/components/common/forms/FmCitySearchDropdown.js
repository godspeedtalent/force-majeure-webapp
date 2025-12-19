import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * FmCitySearchDropdown
 *
 * City search dropdown powered by GeoDB Cities API
 * Allows users to search and select their home city
 */
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronsUpDown, MapPin } from 'lucide-react';
import { logger } from '@/shared';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, } from '@/components/common/shadcn/command';
import { Popover, PopoverContent, PopoverTrigger, } from '@/components/common/shadcn/popover';
import { Button } from '@/components/common/shadcn/button';
import { cn } from '@/shared';
import { Label } from '@/components/common/shadcn/label';
/**
 * Searches for cities using GeoDB Cities API
 * Free tier: 500 requests/day, 10 requests/second
 */
const searchCities = async (query) => {
    if (!query || query.length < 2)
        return [];
    try {
        const response = await fetch(`https://wft-geo-db.p.rapidapi.com/v1/geo/cities?namePrefix=${encodeURIComponent(query)}&limit=10&minPopulation=10000&sort=-population`, {
            headers: {
                'X-RapidAPI-Key': import.meta.env.VITE_RAPIDAPI_KEY || 'demo-key',
                'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com',
            },
        });
        if (!response.ok) {
            logger.warn('City search API error', { status: response.statusText });
            return [];
        }
        const data = await response.json();
        return (data.data || []).map((city) => ({
            id: city.id,
            name: city.name,
            region: city.region || '',
            country: city.country,
            displayName: `${city.name}, ${city.region ? city.region + ', ' : ''}${city.country}`,
        }));
    }
    catch (error) {
        logger.error('Error fetching cities', { error });
        return [];
    }
};
export const FmCitySearchDropdown = ({ value = '', onChange, label, placeholder, description, error, className, }) => {
    const { t } = useTranslation('common');
    const resolvedPlaceholder = placeholder ?? t('citySearch.searchForCity');
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [cities, setCities] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    // Debounced search
    useEffect(() => {
        if (!searchQuery || searchQuery.length < 2) {
            setCities([]);
            return;
        }
        setIsLoading(true);
        const timeoutId = setTimeout(async () => {
            const results = await searchCities(searchQuery);
            setCities(results);
            setIsLoading(false);
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery]);
    const handleSelect = useCallback((cityName) => {
        onChange?.(cityName);
        setOpen(false);
    }, [onChange]);
    return (_jsxs("div", { className: cn('space-y-2', className), children: [label && (_jsx(Label, { className: 'text-sm font-medium text-foreground', children: label })), _jsxs(Popover, { open: open, onOpenChange: setOpen, children: [_jsx(PopoverTrigger, { asChild: true, children: _jsxs(Button, { variant: 'outline', role: 'combobox', "aria-expanded": open, className: cn('w-full justify-between font-normal', !value && 'text-muted-foreground', error && 'border-destructive focus-visible:ring-destructive'), children: [_jsx("div", { className: 'flex items-center gap-2 truncate', children: value ? (_jsxs(_Fragment, { children: [_jsx(MapPin, { className: 'h-4 w-4 shrink-0' }), _jsx("span", { className: 'truncate', children: value })] })) : (_jsx("span", { children: resolvedPlaceholder })) }), _jsx(ChevronsUpDown, { className: 'ml-2 h-4 w-4 shrink-0 opacity-50' })] }) }), _jsx(PopoverContent, { className: 'w-full p-0', align: 'start', children: _jsxs(Command, { shouldFilter: false, children: [_jsx(CommandInput, { placeholder: t('citySearch.typeToSearch'), value: searchQuery, onValueChange: setSearchQuery }), _jsx(CommandList, { children: isLoading ? (_jsx("div", { className: 'flex items-center justify-center py-6', children: _jsx("div", { className: 'h-4 w-4 animate-spin rounded-full border-2 border-fm-gold border-b-transparent' }) })) : cities.length === 0 && searchQuery.length >= 2 ? (_jsx(CommandEmpty, { children: t('citySearch.noCitiesFound') })) : cities.length === 0 ? (_jsx(CommandEmpty, { children: t('citySearch.startTyping') })) : (_jsx(CommandGroup, { children: cities.map(city => (_jsxs(CommandItem, { value: city.displayName, onSelect: () => handleSelect(city.displayName), children: [_jsx(Check, { className: cn('mr-2 h-4 w-4', value === city.displayName
                                                        ? 'opacity-100'
                                                        : 'opacity-0') }), _jsx(MapPin, { className: 'mr-2 h-3.5 w-3.5 text-muted-foreground' }), _jsx("span", { className: 'truncate', children: city.displayName })] }, city.id))) })) })] }) })] }), description && !error && (_jsx("p", { className: 'text-xs text-muted-foreground', children: description })), error && _jsx("p", { className: 'text-xs text-destructive', children: error })] }));
};
