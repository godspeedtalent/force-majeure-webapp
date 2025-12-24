/**
 * FmCityDropdown
 *
 * Simple dropdown for selecting a city from the local cities table.
 * Use this when the city list is small and static.
 * For larger datasets with search functionality, use FmCitySearchDropdown instead.
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase, logger } from '@/shared';
import { FmCommonSelect, type SelectOption } from './FmCommonSelect';

interface City {
  id: string;
  name: string;
  state: string;
}

interface FmCityDropdownProps {
  value: string | null;
  onChange: (cityId: string) => void;
  label?: string;
  placeholder?: string;
  description?: string;
  error?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  /** Optional filter by state (e.g., 'TX') */
  stateFilter?: string;
  /** Optional filter by specific city names (e.g., ['Austin', 'Houston']) */
  cityNames?: string[];
}

export function FmCityDropdown({
  value,
  onChange,
  label,
  placeholder,
  description,
  error,
  required = false,
  className,
  disabled = false,
  stateFilter,
  cityNames,
}: FmCityDropdownProps) {
  const { t } = useTranslation('common');
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const resolvedPlaceholder = placeholder || t('cityDropdown.selectCity');

  useEffect(() => {
    const fetchCities = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from('cities')
          .select('id, name, state')
          .order('name', { ascending: true });

        if (stateFilter) {
          query = query.eq('state', stateFilter);
        }

        if (cityNames && cityNames.length > 0) {
          query = query.in('name', cityNames);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) {
          logger.error('Error fetching cities', { error: fetchError });
          return;
        }

        setCities(data || []);
      } catch (err) {
        logger.error('Error fetching cities', { error: err });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCities();
  }, [stateFilter, cityNames]);

  const options: SelectOption[] = cities.map(city => ({
    value: city.id,
    label: `${city.name}, ${city.state}`,
  }));

  return (
    <FmCommonSelect
      label={label}
      value={value || ''}
      onChange={onChange}
      options={options}
      placeholder={isLoading ? t('cityDropdown.loadingCities') : resolvedPlaceholder}
      description={description}
      error={error}
      required={required}
      className={className}
      disabled={disabled || isLoading}
    />
  );
}
