/**
 * FmGenreMultiSelect Component
 *
 * Multi-select searchable genre dropdown with compact badges.
 * Styled to match FmCommonSelect pattern with search capability.
 * Includes inline "Create New Genre" option.
 */

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X, ChevronDown, Plus } from 'lucide-react';
import { cn } from '@/shared';
import { searchGenres, createGenre, trackGenreSelection } from '../services/genreService';
import type { Genre } from '../types';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { logger } from '@/shared';
import { toast } from 'sonner';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/common/shadcn/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/common/shadcn/dialog';
import { Button } from '@/components/common/shadcn/button';
import { FmCommonTextField } from '@/components/common/forms';

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
  const { t } = useTranslation('common');
  const { t: tToast } = useTranslation('toasts');
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Create genre modal state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newGenreName, setNewGenreName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

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
        logger.error('Failed to search genres', { error: error instanceof Error ? error.message : String(error), query });
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
    // Track selection for popularity ranking (fire-and-forget)
    trackGenreSelection(genre.id);
    setQuery('');
    setOptions([]);
    // Keep dropdown open for multiple selections
    if (selectedGenres.length + 1 >= maxGenres) {
      setOpen(false);
    }
  };

  const handleRemove = (genreId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedGenres.filter(g => g.id !== genreId));
  };

  const handleOpenCreateDialog = () => {
    // Pre-fill with current search query
    setNewGenreName(query);
    setIsCreateDialogOpen(true);
  };

  const handleCreateGenre = async () => {
    const trimmedName = newGenreName.trim();
    if (!trimmedName) {
      toast.error(tToast('genres.nameRequired'));
      return;
    }

    setIsCreating(true);
    try {
      const newGenre = await createGenre(trimmedName);
      toast.success(tToast('genres.created'));

      // Add the new genre to the selection if there's room
      if (selectedGenres.length < maxGenres) {
        onChange([...selectedGenres, newGenre]);
      }

      // Reset and close
      setNewGenreName('');
      setIsCreateDialogOpen(false);
      setQuery('');
      setOptions([]);

      // Close dropdown if max reached
      if (selectedGenres.length + 1 >= maxGenres) {
        setOpen(false);
      }
    } catch (error) {
      logger.error('Failed to create genre', {
        error: error instanceof Error ? error.message : String(error),
        source: 'FmGenreMultiSelect',
        details: { name: trimmedName },
      });
      toast.error(tToast('genres.createFailed'));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className={cn('space-y-1', className)}>
      {/* Dropdown trigger styled like FmCommonSelect */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type='button'
            disabled={disabled || !canAddMore}
            className={cn(
              'w-full min-h-9 flex items-center justify-between px-3 py-1.5 text-sm',
              'bg-transparent border rounded-none transition-all duration-300',
              open
                ? 'border-fm-gold shadow-[0_0_16px_rgba(207,173,118,0.3)] scale-[1.01]'
                : 'border-white/20 hover:border-white/40',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <div className='flex-1 flex flex-wrap items-center gap-1.5'>
              {/* Selected Genre Badges inside the input */}
              {selectedGenres.map(genre => (
                <div
                  key={genre.id}
                  className='inline-flex items-center gap-1 px-2 py-0.5 bg-fm-gold/10 border border-fm-gold/30 text-fm-gold text-xs hover:bg-fm-gold/20 transition-colors'
                  onClick={(e) => e.stopPropagation()}
                >
                  <span>{genre.name}</span>
                  <button
                    type='button'
                    onClick={(e) => handleRemove(genre.id, e)}
                    disabled={disabled}
                    className='text-fm-gold/70 hover:text-fm-gold transition-colors'
                    aria-label={`Remove ${genre.name}`}
                  >
                    <X className='h-3 w-3' />
                  </button>
                </div>
              ))}
              {/* Placeholder text when there's room for more */}
              {canAddMore && selectedGenres.length === 0 && (
                <span className='text-muted-foreground'>
                  {t('genreMultiSelect.searchAndAddGenres')}
                </span>
              )}
              {!canAddMore && selectedGenres.length > 0 && (
                <span className='text-muted-foreground text-xs ml-1'>
                  {t('genreMultiSelect.maximumReached')}
                </span>
              )}
            </div>
            <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform flex-shrink-0 ml-2', open && 'rotate-180')} />
          </button>
        </PopoverTrigger>

        <PopoverContent
          className='w-[var(--radix-popover-trigger-width)] p-0 bg-black/90 backdrop-blur-xl border border-white/20 rounded-none shadow-2xl'
          align='start'
        >
          {/* Search Input */}
          <div className='p-3 border-b border-white/10'>
            <div className='flex items-center gap-2'>
              <Search className='h-4 w-4 text-muted-foreground flex-shrink-0' />
              <input
                ref={inputRef}
                type='text'
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={t('genreMultiSelect.searchGenres')}
                className='flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground'
                autoFocus
              />
              {loading && <FmCommonLoadingSpinner size='sm' />}
            </div>
          </div>

          {/* Results */}
          <div className='max-h-[200px] overflow-y-auto'>
            {query.length === 0 ? (
              <div className='p-4 text-center'>
                <p className='text-xs text-muted-foreground'>
                  {t('genreMultiSelect.startTyping')}
                </p>
              </div>
            ) : options.length === 0 && !loading ? (
              <div className='p-4 text-center'>
                <p className='text-xs text-muted-foreground'>
                  {t('genreMultiSelect.noGenresFound', { query })}
                </p>
              </div>
            ) : (
              <div className='py-1'>
                {options.map(genre => (
                  <button
                    key={genre.id}
                    type='button'
                    onClick={() => handleSelect(genre)}
                    className='w-full px-3 py-2 text-left text-sm hover:bg-fm-gold/10 transition-colors duration-200'
                  >
                    {genre.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Create New Genre option - always visible at bottom */}
          <div className='border-t border-white/10'>
            <button
              type='button'
              onClick={handleOpenCreateDialog}
              className='w-full px-3 py-2.5 text-left text-sm flex items-center gap-2 text-fm-gold hover:bg-fm-gold/10 transition-colors duration-200'
            >
              <Plus className='h-4 w-4' />
              {t('genreMultiSelect.createNewGenre', '+ Create New Genre')}
            </button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Label below trigger (matching FmCommonSelect pattern) */}
      <div className='flex items-center justify-between'>
        {label && (
          <label
            className={cn(
              'text-xs transition-colors duration-200',
              open ? 'text-fm-gold' : 'text-muted-foreground'
            )}
          >
            {label}
            {required && <span className='text-fm-gold ml-1'>*</span>}
          </label>
        )}
        <span className='text-xs text-muted-foreground'>
          {selectedGenres.length}/{maxGenres}
        </span>
      </div>

      {/* Create Genre Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle>{t('dialogs.createGenre')}</DialogTitle>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <FmCommonTextField
              label={t('labels.genreName')}
              value={newGenreName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNewGenreName(e.target.value)
              }
              placeholder={t('forms.genres.namePlaceholder')}
              required
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setIsCreateDialogOpen(false);
                setNewGenreName('');
              }}
            >
              {t('buttons.cancel')}
            </Button>
            <Button
              variant='outline'
              onClick={handleCreateGenre}
              disabled={isCreating || !newGenreName.trim()}
              className='border-white/20 hover:bg-white/10'
            >
              {isCreating ? t('dialogs.creating') : t('buttons.createGenre')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
