import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { FmCommonSearchDropdown, } from './FmCommonSearchDropdown';
import { supabase } from '@/shared';
export function FmEventSearchDropdown({ value, onChange, onCreateNew, placeholder = 'Search for an event...', disabled = false, }) {
    const navigate = useNavigate();
    const [selectedEvent, setSelectedEvent] = React.useState(null);
    React.useEffect(() => {
        if (value) {
            supabase
                .from('events')
                .select('title')
                .eq('id', value)
                .maybeSingle()
                .then(({ data }) => {
                if (data) {
                    setSelectedEvent({ title: data.title || '' });
                }
            });
        }
        else {
            setSelectedEvent(null);
        }
    }, [value]);
    const handleSearch = async (query) => {
        const { data, error } = await supabase
            .from('events')
            .select(`
        id,
        title,
        start_time,
        headliner:headliner_id (
          id,
          name,
          image_url
        ),
        venue:venue_id (
          id,
          name
        )
      `)
            .gte('start_time', new Date().toISOString().split('T')[0])
            .order('start_time', { ascending: true })
            .limit(50);
        if (error || !data)
            return [];
        // Collect all unique undercard IDs across all events
        const allUndercardIds = new Set();
        data.forEach((event) => {
            if (event.undercard_ids && event.undercard_ids.length > 0) {
                event.undercard_ids.forEach((id) => allUndercardIds.add(id));
            }
        });
        // Fetch all undercard artists in a single query
        let undercardMap = new Map();
        if (allUndercardIds.size > 0) {
            const { data: undercards } = await supabase
                .from('artists')
                .select('id, name')
                .in('id', Array.from(allUndercardIds));
            if (undercards) {
                undercards.forEach((artist) => {
                    undercardMap.set(artist.id, artist.name);
                });
            }
        }
        // Map undercard IDs to names for each event
        const eventsWithUndercards = data.map((event) => ({
            ...event,
            undercards: event.undercard_ids
                ? event.undercard_ids
                    .map((id) => ({ name: undercardMap.get(id) }))
                    .filter((uc) => uc.name)
                : [],
        }));
        // Filter results to match search query against multiple fields
        const filtered = eventsWithUndercards.filter((event) => {
            const searchLower = query.toLowerCase();
            const titleMatch = event.title?.toLowerCase().includes(searchLower);
            const headlinerMatch = event.headliner?.name
                ?.toLowerCase()
                .includes(searchLower);
            const venueMatch = event.venue?.name?.toLowerCase().includes(searchLower);
            const undercardMatch = event.undercards?.some((uc) => uc.name?.toLowerCase().includes(searchLower));
            return titleMatch || headlinerMatch || venueMatch || undercardMatch;
        });
        return filtered.slice(0, 10).map((event) => {
            const headlinerImage = event.headliner?.image_url;
            const eventTitle = event.title || 'Untitled Event';
            return {
                id: event.id,
                label: `${eventTitle} - ${new Date(event.start_time).toLocaleDateString()}`,
                icon: headlinerImage ? (_jsx("img", { src: headlinerImage, alt: eventTitle, className: 'h-8 w-8 rounded-full object-cover' })) : (_jsx("div", { className: 'h-8 w-8 rounded-full bg-white/10 flex items-center justify-center', children: _jsx(Calendar, { className: 'h-4 w-4 text-white/50' }) })),
            };
        });
    };
    const handleCreateNew = () => {
        if (onCreateNew) {
            onCreateNew();
        }
        else {
            navigate('/events/create');
        }
    };
    return (_jsx(FmCommonSearchDropdown, { onChange: onChange, onSearch: handleSearch, onCreateNew: handleCreateNew, placeholder: placeholder, createNewLabel: '+ Create New Event', selectedLabel: selectedEvent?.title, disabled: disabled }));
}
