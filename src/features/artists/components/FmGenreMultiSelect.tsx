/**
 * FmGenreMultiSelect Component
 *
 * Multi-select searchable genre dropdown with badges.
 * Allows selection of up to 5 genres with real-time search.
 */

import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/shared/utils/utils';
import { searchGenres } from '../services/genreService';
import type { Genre } from '../types';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/common/shadcn/popover';

interface FmGenreMultiSelectProps {
  /** Currently selected genres */
  selectedGenres: Genre[];
  /** Callback when selection changes */
  onChange: (genres: Genre[]) => void;
  /** Maximum number of genres allowed */
  maxGenres?: number;
  /** Disabled state */
  disabled?: boolean;
  /** Label for the field */
  label?: string;
  /** Required field indicator */
  required?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Multi-select genre component with search and badge display
 *
 * @example
 * ```tsx
 * <FmGenreMultiSelect
 *   selectedGenres={selectedGenres}
 *   onChange={setSelectedGenres}
 *   maxGenres={5}
 *   label="Genres"
 *   required
 * />
 * ```
 */
export const FmGenreMultiSelect = ({
  selectedGenres,
  onChange,
  maxGenres = 5,
  disabled = false,
  label,
  required = false,
  className,
}: FmGenreMultiSelectProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const canAddMore = selectedGenres.length < maxGenres;

  // Search genres when query changes
  useEffect(() => {
    if (!open || query.length === 0) {
      setOptions([]);
      return;
    }

    const searchDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await searchGenres(query, 20);
        // Filter out already selected genres
        const filtered = results.filter(
          genre => !selectedGenres.some(selected => selected.id === genre.id)
        );
        setOptions(filtered);
      } catch (error) {
        console.error('Failed to search genres:', error);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchDebounce);
  }, [query, open, selectedGenres]);

  const handleSelect = (genre: Genre) => {
    if (selectedGenres.length >= maxGenres) {
      return;
    }
    onChange([...selectedGenres, genre]);
    setQuery('');
    setOptions([]);
    // Keep dropdown open for multiple selections
    if (selectedGenres.length + 1 >= maxGenres) {
      setOpen(false);
    }
  };

  const handleRemove = (genreId: string) => {
    onChange(selectedGenres.filter(g => g.id !== genreId));
  };

  const handleClear = () => {
    onChange([]);
  };

  return (
    <div className={cn('space-y-[10px]', className)}>
      {/* Label */}
      {label && (
        <label
          className={cn(
            'block font-canela text-xs uppercase tracking-wider transition-colors duration-200',
            isFocused ? 'text-fm-gold' : 'text-muted-foreground'
          )}
        >
          {label}
          {required && <span className='text-fm-danger ml-1'>*</span>}
        </label>
      )}

      {/* Selected Genre Badges */}
      {selectedGenres.length > 0 && (
        <div className='flex flex-wrap gap-[10px] p-[15px] bg-black/40 backdrop-blur-sm border border-white/20 rounded-none'>
          {selectedGenres.map(genre => (
            <div
              key={genre.id}
              className='flex items-center gap-[10px] px-[15px] py-[8px] bg-fm-gold/10 border border-fm-gold/30 rounded-none group hover:bg-fm-gold/20 transition-all duration-200'
            >
              <span className='font-canela text-sm text-fm-gold uppercase tracking-wider'>
                {genre.name}
              </span>
              <button
                type='button'
                onClick={() => handleRemove(genre.id)}
                disabled={disabled}
                className='text-fm-gold/70 hover:text-fm-gold transition-colors duration-200'
                aria-label={`Remove ${genre.name}`}
              >
                <X className='h-3 w-3' />
              </button>
            </div>
          ))}
          {selectedGenres.length > 0 && (
            <button
              type='button'
              onClick={handleClear}
              disabled={disabled}
              className='px-[15px] py-[8px] text-xs text-muted-foreground hover:text-foreground border border-white/10 hover:border-white/20 rounded-none transition-all duration-200 font-canela uppercase tracking-wider'
            >
              Clear All
            </button>
          )}
        </div>
      )}

      {/* Genre Count Indicator */}
      <div className='flex items-center justify-between text-xs text-muted-foreground font-canela'>
        <span>
          {selectedGenres.length} / {maxGenres} selected
        </span>
        {!canAddMore && <span className='text-fm-gold'>Maximum reached</span>}
      </div>

      {/* Search Dropdown */}
      {canAddMore && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type='button'
              disabled={disabled}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className={cn(
                'w-full flex items-center gap-[10px] px-[15px] py-[12px] font-canela text-sm',
                'bg-transparent border rounded-none transition-all duration-200',
                isFocused
                  ? 'border-b-[3px] border-t-0 border-l-0 border-r-0 border-fm-gold bg-white/5 shadow-[0_4px_16px_rgba(223,186,125,0.3)]'
                  : 'border-white/20 hover:border-fm-gold hover:bg-white/5',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <Search className='h-4 w-4 text-muted-foreground' />
              <span className='text-muted-foreground'>
                {open ? 'Search genres...' : 'Add genre'}
              </span>
            </button>
          </PopoverTrigger>

          <PopoverContent
            className='w-[var(--radix-popover-trigger-width)] p-0 bg-black/90 backdrop-blur-xl border-2 border-white/20 rounded-none shadow-2xl'
            align='start'
          >
            {/* Search Input */}
            <div className='p-[15px] border-b border-white/10'>
              <div className='flex items-center gap-[10px]'>
                <Search className='h-4 w-4 text-muted-foreground flex-shrink-0' />
                <input
                  ref={inputRef}
                  type='text'
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder='Search genres...'
                  className='flex-1 bg-transparent border-none outline-none font-canela text-sm text-foreground placeholder:text-muted-foreground'
                  autoFocus
                />
                {loading && <FmCommonLoadingSpinner size='sm' />}
              </div>
            </div>

            {/* Results */}
            <div className='max-h-[300px] overflow-y-auto'>
              {query.length === 0 ? (
                <div className='p-[20px] text-center'>
                  <p className='font-canela text-sm text-muted-foreground'>
                    Start typing to search genres
                  </p>
                </div>
              ) : options.length === 0 && !loading ? (
                <div className='p-[20px] text-center'>
                  <p className='font-canela text-sm text-muted-foreground'>
                    No genres found for "{query}"
                  </p>
                </div>
              ) : (
                <div className='divide-y divide-white/10'>
                  {options.map(genre => (
                    <button
                      key={genre.id}
                      type='button'
                      onClick={() => handleSelect(genre)}
                      className='w-full px-[15px] py-[12px] text-left hover:bg-fm-gold/10 transition-colors duration-200 font-canela text-sm'
                    >
                      {genre.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};
