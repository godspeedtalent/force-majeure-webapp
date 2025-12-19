import { jsx as _jsx } from "react/jsx-runtime";
/**
 * FmCityDropdown
 *
 * Simple dropdown for selecting a city from the local cities table.
 * Use this when the city list is small and static.
 * For larger datasets with search functionality, use FmCitySearchDropdown instead.
 */
import { useEffect, useState } from 'react';
import { supabase, logger } from '@/shared';
import { FmCommonSelect } from './FmCommonSelect';
export function FmCityDropdown({ value, onChange, label, placeholder = 'Select a city', description, error, required = false, className, disabled = false, stateFilter, }) {
    const [cities, setCities] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
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
                const { data, error: fetchError } = await query;
                if (fetchError) {
                    logger.error('Error fetching cities', { error: fetchError });
                    return;
                }
                setCities(data || []);
            }
            catch (err) {
                logger.error('Error fetching cities', { error: err });
            }
            finally {
                setIsLoading(false);
            }
        };
        fetchCities();
    }, [stateFilter]);
    const options = cities.map(city => ({
        value: city.id,
        label: `${city.name}, ${city.state}`,
    }));
    return (_jsx(FmCommonSelect, { label: label, value: value || '', onChange: onChange, options: options, placeholder: isLoading ? 'Loading cities...' : placeholder, description: description, error: error, required: required, className: className, disabled: disabled || isLoading }));
}
