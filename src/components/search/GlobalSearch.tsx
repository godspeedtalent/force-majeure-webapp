import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Search, Calendar, Users as UsersIcon, MapPin } from 'lucide-react';
import { supabase } from '@/shared/api/supabase/client';
import { Input } from '@/components/common/shadcn/input';
import { cn } from '@/shared/utils/utils';
import { logApiError } from '@/shared/utils/apiLogger';

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  type: 'event' | 'artist' | 'venue';
  data?: any;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearch = ({ isOpen, onClose }: GlobalSearchProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<{
    events: SearchResult[];
    artists: SearchResult[];
    venues: SearchResult[];
  }>({
    events: [],
    artists: [],
    venues: [],
  });
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setResults({ events: [], artists: [], venues: [] });
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Perform search
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults({ events: [], artists: [], venues: [] });
      return;
    }

    setIsSearching(true);
    try {
      // Parallel search across all tables
      const [eventsRes, artistsRes, venuesRes] = await Promise.all([
        supabase
          .from('events')
          .select('id, title, date, venues(name)')
          .ilike('title', `%${query}%`)
          .limit(5),
        supabase
          .from('artists')
          .select('id, name')
          .ilike('name', `%${query}%`)
          .limit(5),
        supabase
          .from('venues' as any)
          .select('id, name, cities(name, state)')
          .ilike('name', `%${query}%`)
          .limit(5),
      ]);

      const events: SearchResult[] = (eventsRes.data || []).map(event => ({
        id: event.id,
        title: event.title,
        subtitle: event.date ? new Date(event.date).toLocaleDateString() : undefined,
        type: 'event' as const,
        data: event,
      }));

      const artists: SearchResult[] = (artistsRes.data || []).map(artist => ({
        id: artist.id,
        title: artist.name,
        type: 'artist' as const,
        data: artist,
      }));

      const venues: SearchResult[] = ((venuesRes.data as any) || []).map((venue: any) => ({
        id: venue.id,
        title: venue.name,
        subtitle: venue.cities
          ? `${venue.cities.name}, ${venue.cities.state}`
          : undefined,
        type: 'venue' as const,
        data: venue,
      }));

      setResults({ events, artists, venues });
      setSelectedIndex(0);
    } catch (error) {
      await logApiError({
        endpoint: 'GlobalSearch',
        method: 'SEARCH',
        message: 'Search error',
        details: error,
      });
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, performSearch]);

  // Handle result navigation
  const handleResultClick = useCallback((result: SearchResult) => {
    if (result.type === 'event') {
      navigate(`/event/${result.id}`);
    } else if (result.type === 'artist') {
      // TODO: Navigate to artist page when implemented
      onClose();
    } else if (result.type === 'venue') {
      // TODO: Navigate to venue page when implemented
      onClose();
    }
    onClose();
  }, [navigate, onClose]);

  // Get all results in order
  const allResults = [
    ...results.events,
    ...results.artists,
    ...results.venues,
  ];

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, allResults.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && allResults[selectedIndex]) {
        e.preventDefault();
        handleResultClick(allResults[selectedIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, allResults, handleResultClick, onClose]);

  // Handle click outside
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  }, [onClose]);

  if (!isOpen) return null;

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'event':
        return <Calendar className="h-5 w-5" />;
      case 'artist':
        return <UsersIcon className="h-5 w-5" />;
      case 'venue':
        return <MapPin className="h-5 w-5" />;
    }
  };

  const getTypeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'event':
        return 'Event';
      case 'artist':
        return 'Artist';
      case 'venue':
        return 'Venue';
    }
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={handleOverlayClick}
    >
      <div className="w-full max-w-2xl">
        {/* Search Box */}
        <div className="relative bg-background/95 backdrop-blur-xl border border-border rounded-lg shadow-2xl">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted transition-colors z-10"
            aria-label="Close search"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>

          {/* Search Input */}
          <div className="flex items-center gap-3 p-6 border-b border-border">
            <Search className="h-6 w-6 text-muted-foreground flex-shrink-0" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search events, artists, venues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-lg border-0 focus-visible:ring-0 shadow-none bg-transparent px-0"
            />
          </div>

          {/* Results */}
          {searchQuery && (
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {isSearching ? (
                <div className="py-8 text-center text-muted-foreground">
                  Searching...
                </div>
              ) : allResults.length > 0 ? (
                <div className="space-y-4">
                  {/* Events */}
                  {results.events.length > 0 && (
                    <div>
                      <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Events
                      </div>
                      <div className="space-y-1">
                        {results.events.map((result, index) => (
                          <button
                            key={result.id}
                            onClick={() => handleResultClick(result)}
                            className={cn(
                              'w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-left',
                              index === selectedIndex
                                ? 'bg-fm-gold/10 border border-fm-gold/30'
                                : 'hover:bg-muted border border-transparent'
                            )}
                          >
                            <div className="p-2 rounded-lg bg-fm-gold/10 text-fm-gold">
                              {getIcon(result.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-foreground truncate">
                                {result.title}
                              </div>
                              {result.subtitle && (
                                <div className="text-sm text-muted-foreground">
                                  {result.subtitle}
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground uppercase">
                              {getTypeLabel(result.type)}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Artists */}
                  {results.artists.length > 0 && (
                    <div>
                      <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Artists
                      </div>
                      <div className="space-y-1">
                        {results.artists.map((result, index) => {
                          const globalIndex = results.events.length + index;
                          return (
                            <button
                              key={result.id}
                              onClick={() => handleResultClick(result)}
                              className={cn(
                                'w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-left',
                                globalIndex === selectedIndex
                                  ? 'bg-fm-gold/10 border border-fm-gold/30'
                                  : 'hover:bg-muted border border-transparent'
                              )}
                            >
                              <div className="p-2 rounded-lg bg-fm-gold/10 text-fm-gold">
                                {getIcon(result.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-foreground truncate">
                                  {result.title}
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground uppercase">
                                {getTypeLabel(result.type)}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Venues */}
                  {results.venues.length > 0 && (
                    <div>
                      <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Venues
                      </div>
                      <div className="space-y-1">
                        {results.venues.map((result, index) => {
                          const globalIndex = results.events.length + results.artists.length + index;
                          return (
                            <button
                              key={result.id}
                              onClick={() => handleResultClick(result)}
                              className={cn(
                                'w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-left',
                                globalIndex === selectedIndex
                                  ? 'bg-fm-gold/10 border border-fm-gold/30'
                                  : 'hover:bg-muted border border-transparent'
                              )}
                            >
                              <div className="p-2 rounded-lg bg-fm-gold/10 text-fm-gold">
                                {getIcon(result.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-foreground truncate">
                                  {result.title}
                                </div>
                                {result.subtitle && (
                                  <div className="text-sm text-muted-foreground">
                                    {result.subtitle}
                                  </div>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground uppercase">
                                {getTypeLabel(result.type)}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  No results found
                </div>
              )}
            </div>
          )}

          {/* Help Text */}
          {!searchQuery && (
            <div className="p-6 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Search across all events, artists, and venues
              </p>
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-muted rounded">↑↓</kbd> Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-muted rounded">↵</kbd> Select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-muted rounded">Esc</kbd> Close
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
