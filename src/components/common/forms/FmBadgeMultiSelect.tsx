/**
 * FmBadgeMultiSelect<T> - Generic Badge Multi-Select Component
 *
 * Generic searchable multi-select with badge display.
 * Base component for both tag selector and genre selector.
 * Uses TypeScript generics to support any data type.
 *
 * @template T - The type of items being selected (must extend BadgeItem)
 *
 * @example
 * ```tsx
 * <FmBadgeMultiSelect<Tag>
 *   selectedItems={selectedTags}
 *   onChange={setSelectedTags}
 *   onSearch={searchTags}
 *   onCreate={createTag}
 *   maxItems={10}
 *   label="Tags"
 * />
 * ```
 */

import { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronDown, Plus } from 'lucide-react';
import { cn } from '@/shared';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/common/shadcn/popover';

// ============================================================================
// Types
// ============================================================================

export interface BadgeItem {
  id: string;
  label: string;
  variant?: 'primary' | 'secondary';
  className?: string;
}

export interface FmBadgeMultiSelectProps<T extends BadgeItem> {
  /** Currently selected items */
  selectedItems: T[];
  /** Callback when selection changes */
  onChange: (items: T[]) => void;
  /** Search function - receives query, returns filtered results */
  onSearch: (query: string, limit: number) => Promise<T[]>;
  /** Optional: Create new item function */
  onCreate?: (name: string) => Promise<T>;
  /** Maximum number of items allowed */
  maxItems?: number;
  /** Disabled state */
  disabled?: boolean;
  /** Label for the field */
  label?: string;
  /** Required field indicator */
  required?: boolean;
  /** Placeholder text when empty */
  placeholder?: string;
  /** Text shown when searching */
  searchPlaceholder?: string;
  /** Text for "Create New" button */
  createNewText?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Generic badge multi-select component
 * Supports any type that extends BadgeItem interface
 */
export function FmBadgeMultiSelect<T extends BadgeItem>({
  selectedItems,
  onChange,
  onSearch,
  onCreate,
  maxItems = 10,
  disabled = false,
  label,
  required = false,
  placeholder = 'Search and add items',
  searchPlaceholder = 'Search...',
  createNewText = '+ Create New',
  className,
}: FmBadgeMultiSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const canAddMore = selectedItems.length < maxItems;

  // Search items when query changes
  useEffect(() => {
    if (!open || query.length === 0) {
      setOptions([]);
      return;
    }

    const searchDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await onSearch(query, 20);
        // Filter out already selected items
        const filtered = results.filter(
          item => !selectedItems.some(selected => selected.id === item.id)
        );
        setOptions(filtered);
      } catch (error) {
        console.error('Search failed:', error);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchDebounce);
  }, [query, open, selectedItems, onSearch]);

  const handleSelect = (item: T) => {
    if (selectedItems.length >= maxItems) {
      return;
    }
    onChange([...selectedItems, item]);
    setQuery('');
    setOptions([]);
    // Keep dropdown open for multiple selections
    if (selectedItems.length + 1 >= maxItems) {
      setOpen(false);
    }
  };

  const handleRemove = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedItems.filter(item => item.id !== itemId));
  };

  const handleCreate = async () => {
    if (!onCreate || !query.trim()) return;

    try {
      const newItem = await onCreate(query.trim());

      // Add the new item to selection if there's room
      if (selectedItems.length < maxItems) {
        onChange([...selectedItems, newItem]);
      }

      // Reset
      setQuery('');
      setOptions([]);

      // Close dropdown if max reached
      if (selectedItems.length + 1 >= maxItems) {
        setOpen(false);
      }
    } catch (error) {
      console.error('Create failed:', error);
    }
  };

  return (
    <div className={cn('space-y-1', className)}>
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
              {/* Selected Item Badges */}
              {selectedItems.map(item => (
                <div
                  key={item.id}
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 text-xs transition-colors',
                    item.variant === 'primary'
                      ? 'bg-fm-gold/20 border border-fm-gold text-fm-gold hover:bg-fm-gold/30'
                      : 'bg-fm-gold/10 border border-fm-gold/30 text-fm-gold hover:bg-fm-gold/20',
                    item.className
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  <span>{item.label}</span>
                  <button
                    type='button'
                    onClick={(e) => handleRemove(item.id, e)}
                    disabled={disabled}
                    className='text-fm-gold/70 hover:text-fm-gold transition-colors'
                    aria-label={`Remove ${item.label}`}
                  >
                    <X className='h-3 w-3' />
                  </button>
                </div>
              ))}
              {/* Placeholder */}
              {canAddMore && selectedItems.length === 0 && (
                <span className='text-muted-foreground'>{placeholder}</span>
              )}
              {!canAddMore && selectedItems.length > 0 && (
                <span className='text-muted-foreground text-xs ml-1'>
                  Maximum reached
                </span>
              )}
            </div>
            <ChevronDown
              className={cn(
                'h-4 w-4 text-muted-foreground transition-transform flex-shrink-0 ml-2',
                open && 'rotate-180'
              )}
            />
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
                placeholder={searchPlaceholder}
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
                  Start typing to search
                </p>
              </div>
            ) : options.length === 0 && !loading ? (
              <div className='p-4 text-center'>
                <p className='text-xs text-muted-foreground'>
                  No results found
                </p>
              </div>
            ) : (
              <div className='py-1'>
                {options.map(item => (
                  <button
                    key={item.id}
                    type='button'
                    onClick={() => handleSelect(item)}
                    className='w-full px-3 py-2 text-left text-sm hover:bg-fm-gold/10 transition-colors duration-200'
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Create New option */}
          {onCreate && (
            <div className='border-t border-white/10'>
              <button
                type='button'
                onClick={handleCreate}
                disabled={!query.trim()}
                className='w-full px-3 py-2.5 text-left text-sm flex items-center gap-2 text-fm-gold hover:bg-fm-gold/10 transition-colors duration-200 disabled:opacity-50'
              >
                <Plus className='h-4 w-4' />
                {createNewText}
              </button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* Label below trigger */}
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
          {selectedItems.length}/{maxItems}
        </span>
      </div>
    </div>
  );
}
