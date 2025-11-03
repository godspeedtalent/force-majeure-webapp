/**
 * FmCitySearchDropdown
 *
 * City search dropdown powered by GeoDB Cities API
 * Allows users to search and select their home city
 */

import { useState, useEffect, useCallback } from 'react';
import { Check, ChevronsUpDown, Loader2, MapPin } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/shadcn/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/shadcn/popover';
import { Button } from '@/components/ui/shadcn/button';
import { cn } from '@/shared/utils/utils';
import { Label } from '@/components/ui/shadcn/label';

interface City {
  id: number;
  name: string;
  region: string;
  country: string;
  displayName: string;
}

interface FmCitySearchDropdownProps {
  value?: string;
  onChange?: (city: string) => void;
  label?: string;
  placeholder?: string;
  description?: string;
  error?: string;
  className?: string;
}

/**
 * Searches for cities using GeoDB Cities API
 * Free tier: 500 requests/day, 10 requests/second
 */
const searchCities = async (query: string): Promise<City[]> => {
  if (!query || query.length < 2) return [];

  try {
    const response = await fetch(
      `https://wft-geo-db.p.rapidapi.com/v1/geo/cities?namePrefix=${encodeURIComponent(query)}&limit=10&minPopulation=10000&sort=-population`,
      {
        headers: {
          'X-RapidAPI-Key': import.meta.env.VITE_RAPIDAPI_KEY || 'demo-key',
          'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com',
        },
      }
    );

    if (!response.ok) {
      console.warn('City search API error:', response.statusText);
      return [];
    }

    const data = await response.json();

    return (data.data || []).map((city: any) => ({
      id: city.id,
      name: city.name,
      region: city.region || '',
      country: city.country,
      displayName: `${city.name}, ${city.region ? city.region + ', ' : ''}${city.country}`,
    }));
  } catch (error) {
    console.error('Error fetching cities:', error);
    return [];
  }
};

export const FmCitySearchDropdown = ({
  value = '',
  onChange,
  label,
  placeholder = 'Search for a city...',
  description,
  error,
  className,
}: FmCitySearchDropdownProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cities, setCities] = useState<City[]>([]);
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

  const handleSelect = useCallback(
    (cityName: string) => {
      onChange?.(cityName);
      setOpen(false);
    },
    [onChange]
  );

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label className='text-sm font-medium text-foreground'>{label}</Label>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            role='combobox'
            aria-expanded={open}
            className={cn(
              'w-full justify-between font-normal',
              !value && 'text-muted-foreground',
              error && 'border-destructive focus-visible:ring-destructive'
            )}
          >
            <div className='flex items-center gap-2 truncate'>
              {value ? (
                <>
                  <MapPin className='h-4 w-4 shrink-0' />
                  <span className='truncate'>{value}</span>
                </>
              ) : (
                <span>{placeholder}</span>
              )}
            </div>
            <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-full p-0' align='start'>
          <Command shouldFilter={false}>
            <CommandInput
              placeholder='Type to search cities...'
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              {isLoading ? (
                <div className='flex items-center justify-center py-6'>
                  <Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
                </div>
              ) : cities.length === 0 && searchQuery.length >= 2 ? (
                <CommandEmpty>No cities found.</CommandEmpty>
              ) : cities.length === 0 ? (
                <CommandEmpty>Start typing to search cities...</CommandEmpty>
              ) : (
                <CommandGroup>
                  {cities.map((city) => (
                    <CommandItem
                      key={city.id}
                      value={city.displayName}
                      onSelect={() => handleSelect(city.displayName)}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          value === city.displayName ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <MapPin className='mr-2 h-3.5 w-3.5 text-muted-foreground' />
                      <span className='truncate'>{city.displayName}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {description && !error && (
        <p className='text-xs text-muted-foreground'>{description}</p>
      )}
      {error && <p className='text-xs text-destructive'>{error}</p>}
    </div>
  );
};
