import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Building2, Music, MapPin, Calendar, User } from 'lucide-react';
import { Input } from '@/components/common/shadcn/input';
import { supabase } from '@/shared';
import { useDebounce } from '@/shared';
import { handleError } from '@/shared/services/errorHandler';
import { logger } from '@/shared';
/**
 * Inline database navigator search component
 * Designed to be embedded within the Database Manager toolbar
 */
export function DatabaseNavigatorSearch() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState({
        organizations: [],
        users: [],
        artists: [],
        venues: [],
        events: [],
    });
    const debouncedSearchQuery = useDebounce(searchQuery, 1000);
    // Perform search when debounced query changes
    useEffect(() => {
        if (!debouncedSearchQuery || debouncedSearchQuery.trim().length < 2) {
            setResults({
                organizations: [],
                users: [],
                artists: [],
                venues: [],
                events: [],
            });
            return;
        }
        performSearch(debouncedSearchQuery.trim());
    }, [debouncedSearchQuery]);
    const performSearch = async (query) => {
        setIsSearching(true);
        const searchPattern = `%${query}%`;
        try {
            // Search Users (profiles table) - search by display_name, full_name, or email
            const { data: users } = await supabase
                .from('profiles')
                .select('id, user_id, display_name, full_name, avatar_url')
                .or(`display_name.ilike.${searchPattern},full_name.ilike.${searchPattern}`)
                .limit(10);
            // Get emails for matched users from auth.users
            let usersWithEmail = users || [];
            if (users && users.length > 0) {
                const userIds = users.map(u => u.user_id);
                // Also search auth.users by email
                const { data: authUsers } = await supabase.auth.admin.listUsers();
                const emailMatches = authUsers?.users.filter(au => au.email?.toLowerCase().includes(query.toLowerCase())) || [];
                // Merge results
                const allUserIds = new Set([
                    ...userIds,
                    ...emailMatches.map(u => u.id)
                ]);
                usersWithEmail = Array.from(allUserIds).slice(0, 5).map(userId => {
                    const profile = users.find(u => u.user_id === userId);
                    const authUser = authUsers?.users.find(au => au.id === userId);
                    return {
                        id: userId,
                        user_id: userId,
                        display_name: profile?.display_name || null,
                        full_name: profile?.full_name || null,
                        avatar_url: profile?.avatar_url || null,
                        email: authUser?.email,
                    };
                }).filter(u => u.email); // Only include users with email
            }
            // Search Artists
            const { data: artists } = await supabase
                .from('artists')
                .select('id, name, image_url')
                .ilike('name', searchPattern)
                .limit(5);
            // Search events by title, description, venue name, and artist names
            const { data: eventsData } = await supabase
                .from('events')
                .select(`
          id,
          title,
          description,
          start_time,
          hero_image,
          venue:venue_id(name),
          headliner:headliner_id(name)
        `)
                .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
                .limit(50);
            // Filter by venue or artist names
            const filteredEvents = (eventsData || []).filter((event) => {
                const queryLower = query.toLowerCase();
                const titleMatch = event.title?.toLowerCase().includes(queryLower);
                const descMatch = event.description?.toLowerCase().includes(queryLower);
                const venueMatch = event.venue?.name?.toLowerCase().includes(queryLower);
                const headlinerMatch = event.headliner?.name?.toLowerCase().includes(queryLower);
                return titleMatch || descMatch || venueMatch || headlinerMatch;
            }).slice(0, 5);
            // Search Organizations - with type casting for missing table
            let organizations = [];
            try {
                const { data: orgData } = await supabase
                    .from('organizations')
                    .select('id, name, logo_url')
                    .ilike('name', searchPattern)
                    .limit(5);
                organizations = (orgData || []);
            }
            catch (error) {
                logger.warn('Organizations table search failed', { error });
            }
            // Search Venues - with error handling for missing table/columns
            let venues = [];
            try {
                const { data: venueData } = await supabase
                    .from('venues')
                    .select('id, name')
                    .ilike('name', searchPattern)
                    .limit(5);
                venues = (venueData || []);
            }
            catch (error) {
                logger.warn('Venues table search failed', { error });
            }
            setResults({
                organizations,
                users: usersWithEmail,
                artists: artists || [],
                venues,
                events: filteredEvents.map((e) => ({
                    id: e.id,
                    title: e.title || '',
                    date: e.start_time || '',
                    hero_image: e.hero_image,
                    venue_name: e.venue?.name,
                })),
            });
        }
        catch (error) {
            handleError(error, {
                title: 'Search Failed',
                context: `Searching database resources for: ${query}`,
            });
        }
        finally {
            setIsSearching(false);
        }
    };
    const hasResults = useMemo(() => {
        return (results.organizations.length > 0 ||
            results.users.length > 0 ||
            results.artists.length > 0 ||
            results.venues.length > 0 ||
            results.events.length > 0);
    }, [results]);
    const handleNavigate = (resourceType, resourceId) => {
        // Close search results by clearing query
        setSearchQuery('');
        // Navigate based on resource type
        switch (resourceType) {
            case 'organization':
                navigate(`/organization/${resourceId}`);
                break;
            case 'user':
                navigate(`/admin/users/${resourceId}`);
                break;
            case 'artist':
                navigate(`/artists/${resourceId}`);
                break;
            case 'venue':
                navigate(`/venues/${resourceId}`);
                break;
            case 'event':
                navigate(`/event/${resourceId}`);
                break;
        }
    };
    return (_jsxs("div", { className: 'w-full', children: [_jsx("div", { className: 'mb-3', children: _jsx("p", { className: 'text-sm text-muted-foreground', children: "Search across all database resources" }) }), _jsxs("div", { className: 'relative mb-4', children: [_jsx(Search, { className: 'absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' }), _jsx(Input, { type: 'text', placeholder: 'Search users, artists, events...', value: searchQuery, onChange: e => setSearchQuery(e.target.value), className: 'pl-9 pr-4' }), isSearching && (_jsx("div", { className: 'absolute right-3 top-1/2 -translate-y-1/2', children: _jsx("div", { className: 'h-4 w-4 border-2 border-fm-gold border-t-transparent rounded-full animate-spin' }) }))] }), searchQuery.trim().length >= 2 && hasResults && (_jsxs("div", { className: 'border rounded-md max-h-[400px] overflow-y-auto bg-background/50', children: [results.organizations.length > 0 && (_jsxs("div", { className: 'p-2 border-b', children: [_jsx("h3", { className: 'text-xs font-semibold text-muted-foreground uppercase mb-2 px-2', children: "Organizations" }), results.organizations.map(org => (_jsxs("button", { onClick: () => handleNavigate('organization', org.id), className: 'w-full flex items-center gap-3 p-2 rounded hover:bg-muted transition-colors text-left', children: [_jsx("div", { className: 'flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden', children: org.logo_url ? (_jsx("img", { src: org.logo_url, alt: org.name, className: 'w-full h-full object-cover' })) : (_jsx(Building2, { className: 'h-4 w-4 text-muted-foreground' })) }), _jsx("div", { className: 'flex-1 min-w-0', children: _jsx("p", { className: 'text-sm font-medium truncate', children: org.name }) })] }, org.id)))] })), results.users.length > 0 && (_jsxs("div", { className: 'p-2 border-b', children: [_jsx("h3", { className: 'text-xs font-semibold text-muted-foreground uppercase mb-2 px-2', children: "Users" }), results.users.map(user => (_jsxs("button", { onClick: () => handleNavigate('user', user.id), className: 'w-full flex items-center gap-3 p-2 rounded hover:bg-muted transition-colors text-left', children: [_jsx("div", { className: 'flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden', children: user.avatar_url ? (_jsx("img", { src: user.avatar_url, alt: user.display_name || user.full_name || 'User', className: 'w-full h-full object-cover' })) : (_jsx(User, { className: 'h-4 w-4 text-muted-foreground' })) }), _jsxs("div", { className: 'flex-1 min-w-0', children: [_jsx("p", { className: 'text-sm font-medium truncate', children: user.display_name || user.full_name || 'Unknown User' }), user.email && (_jsx("p", { className: 'text-xs text-muted-foreground truncate', children: user.email }))] })] }, user.id)))] })), results.artists.length > 0 && (_jsxs("div", { className: 'p-2 border-b', children: [_jsx("h3", { className: 'text-xs font-semibold text-muted-foreground uppercase mb-2 px-2', children: "Artists" }), results.artists.map(artist => (_jsxs("button", { onClick: () => handleNavigate('artist', artist.id), className: 'w-full flex items-center gap-3 p-2 rounded hover:bg-muted transition-colors text-left', children: [_jsx("div", { className: 'flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden', children: artist.image_url ? (_jsx("img", { src: artist.image_url, alt: artist.name, className: 'w-full h-full object-cover' })) : (_jsx(Music, { className: 'h-4 w-4 text-muted-foreground' })) }), _jsx("div", { className: 'flex-1 min-w-0', children: _jsx("p", { className: 'text-sm font-medium truncate', children: artist.name }) })] }, artist.id)))] })), results.venues.length > 0 && (_jsxs("div", { className: 'p-2 border-b', children: [_jsx("h3", { className: 'text-xs font-semibold text-muted-foreground uppercase mb-2 px-2', children: "Venues" }), results.venues.map(venue => (_jsxs("button", { onClick: () => handleNavigate('venue', venue.id), className: 'w-full flex items-center gap-3 p-2 rounded hover:bg-muted transition-colors text-left', children: [_jsx("div", { className: 'flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden', children: venue.image_url ? (_jsx("img", { src: venue.image_url, alt: venue.name, className: 'w-full h-full object-cover' })) : (_jsx(MapPin, { className: 'h-4 w-4 text-muted-foreground' })) }), _jsx("div", { className: 'flex-1 min-w-0', children: _jsx("p", { className: 'text-sm font-medium truncate', children: venue.name }) })] }, venue.id)))] })), results.events.length > 0 && (_jsxs("div", { className: 'p-2', children: [_jsx("h3", { className: 'text-xs font-semibold text-muted-foreground uppercase mb-2 px-2', children: "Events" }), results.events.map(event => (_jsxs("button", { onClick: () => handleNavigate('event', event.id), className: 'w-full flex items-center gap-3 p-2 rounded hover:bg-muted transition-colors text-left', children: [_jsx("div", { className: 'flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden', children: event.hero_image ? (_jsx("img", { src: event.hero_image, alt: event.title, className: 'w-full h-full object-cover' })) : (_jsx(Calendar, { className: 'h-4 w-4 text-muted-foreground' })) }), _jsxs("div", { className: 'flex-1 min-w-0', children: [_jsx("p", { className: 'text-sm font-medium truncate', children: event.title }), _jsxs("p", { className: 'text-xs text-muted-foreground truncate', children: [new Date(event.date).toLocaleDateString(), " \u2022", ' ', event.venue_name] })] })] }, event.id)))] }))] })), searchQuery.trim().length >= 2 && !hasResults && !isSearching && (_jsx("div", { className: 'border rounded-md p-4 bg-background/50', children: _jsxs("p", { className: 'text-sm text-muted-foreground text-center', children: ["No results found for \"", searchQuery, "\""] }) }))] }));
}
