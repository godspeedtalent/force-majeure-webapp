import * as React from 'react';
import { logger } from '@/shared';
import { Search, X } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/common/shadcn/popover';
import { Input } from '@/components/common/shadcn/input';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/common/shadcn/tooltip';
import { cn } from '@/shared';

export interface SearchDropdownOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
  data?: unknown;
}

interface FmCommonSearchDropdownProps {
  onChange: (value: string, label?: string, data?: unknown) => void;
  onSearch: (query: string) => Promise<SearchDropdownOption[]>;
  onGetRecentOptions?: () => Promise<SearchDropdownOption[]>;
  onCreateNew?: () => void;
  placeholder?: string;
  createNewLabel?: string;
  selectedLabel?: string;
  disabled?: boolean;
  /** Optional icon representing the entity type */
  typeIcon?: React.ReactNode;
  /** Tooltip text for the type icon */
  typeTooltip?: string;
  /** Selected entity ID for context menu actions */
  selectedValue?: string;
  /** Route pattern for editing entity (e.g., '/artists/edit') - ID will be appended */
  editRoute?: string;
  /** Entity type name for context menu (e.g., 'Artist', 'Venue') */
  entityTypeName?: string;
}

export function FmCommonSearchDropdown({
  onChange,
  onSearch,
  onGetRecentOptions,
  onCreateNew,
  placeholder = 'Search...',
  createNewLabel = 'Create New',
  selectedLabel,
  disabled = false,
  typeIcon,
  typeTooltip,
}: FmCommonSearchDropdownProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [options, setOptions] = React.useState<SearchDropdownOption[]>([]);
  const [recentOptions, setRecentOptions] = React.useState<
    SearchDropdownOption[]
  >([]);
  const [loading, setLoading] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Load recent options when dropdown opens
  React.useEffect(() => {
    if (open && onGetRecentOptions && query.length === 0) {
      onGetRecentOptions().then(setRecentOptions);
    }
  }, [open, onGetRecentOptions, query]);

  // Focus input when popover opens
  React.useEffect(() => {
    if (open && inputRef.current) {
      // Use setTimeout to ensure popover is fully rendered
      const timeoutId = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timeoutId);
    }
    return undefined;
  }, [open]);

  React.useEffect(() => {
    if (!open) return;

    const searchDebounce = setTimeout(async () => {
      if (query.length > 0) {
        setLoading(true);
        try {
          const results = await onSearch(query);
          setOptions(results.slice(0, 10));
        } catch (error) {
          logger.error('Search error:', { error: error instanceof Error ? error.message : 'Unknown' });
          setOptions([]);
        } finally {
          setLoading(false);
        }
      } else {
        setOptions([]);
      }
    }, 300);

    return () => clearTimeout(searchDebounce);
  }, [query, onSearch, open]);

  const handleSelect = (option: SearchDropdownOption) => {
    onChange(option.id, option.label, option.data);
    setOpen(false);
    setQuery('');
  };

  const handleCreateNew = () => {
    if (onCreateNew) {
      onCreateNew();
      setOpen(false);
      setQuery('');
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuery('');
    inputRef.current?.blur();
    setIsFocused(false);
  };

  const showClearButton = query.length > 0 || isFocused;

  const triggerButton = (
    <button
      type='button'
      className={cn(
        'w-full flex items-center gap-2 pr-3 py-2 rounded-none',
        'bg-black/40 border border-white/20',
        'text-white text-left font-light',
        'hover:border-fm-gold/50 transition-colors',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {typeIcon && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className='flex items-center justify-center h-full border-r border-white/20 px-2 flex-shrink-0'>
                {typeIcon}
              </div>
            </TooltipTrigger>
            {typeTooltip && (
              <TooltipContent>
                <p>{typeTooltip}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      )}
      <Search className='h-3 w-3 text-white/50 flex-shrink-0 ml-3' />
      <span className={cn(
        'flex-1 truncate font-light',
        selectedLabel ? 'text-white' : 'text-white/40 text-sm'
      )}>
        {selectedLabel || placeholder}
      </span>
    </button>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        {triggerButton}
      </PopoverTrigger>
      <PopoverContent
        className='w-[400px] p-0 bg-black/90 backdrop-blur-md border border-white/20'
        align='start'
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
      >
        <div className='p-2 border-b border-white/10 relative'>
          <Input
            ref={inputRef}
            placeholder={placeholder}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onClick={e => {
              e.stopPropagation();
              inputRef.current?.focus();
            }}
            className='bg-black/40 border-white/20 text-white placeholder:text-white/50 pr-8'
            autoFocus
          />
          {showClearButton && (
            <button
              onClick={handleClear}
              onMouseDown={e => e.preventDefault()} // Prevent blur on click
              className='absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-fm-gold transition-colors'
              aria-label='Clear search'
            >
              <X className='h-4 w-4' />
            </button>
          )}
        </div>
        <div className='max-h-[300px] overflow-y-auto'>
          {loading ? (
            <div className='p-4 flex flex-col items-center gap-2'>
              <FmCommonLoadingSpinner size='md' />
              <span className='text-white/50 text-sm'>Searching...</span>
            </div>
          ) : query.length === 0 && recentOptions.length > 0 ? (
            <div>
              <div className='px-3 py-2 text-xs text-white/50 font-semibold uppercase'>
                Recent
              </div>
              {recentOptions.map(option => (
                <button
                  key={option.id}
                  onClick={() => handleSelect(option)}
                  className='w-full flex items-center gap-3 px-3 py-2 hover:bg-white/10 transition-colors text-left'
                >
                  {option.icon}
                  <span className='text-white font-light'>{option.label}</span>
                </button>
              ))}
            </div>
          ) : options.length === 0 && query.length > 0 ? (
            <div className='p-4 text-center text-white/50'>
              No results found
            </div>
          ) : (
            options.map(option => (
              <button
                key={option.id}
                onClick={() => handleSelect(option)}
                className='w-full flex items-center gap-3 px-3 py-2 hover:bg-white/10 transition-colors text-left'
              >
                {option.icon}
                <span className='text-white font-light'>{option.label}</span>
              </button>
            ))
          )}
        </div>
        {onCreateNew && (
          <div className='border-t border-fm-gold'>
            <button
              onClick={handleCreateNew}
              className='w-full flex items-center gap-2 px-3 py-2 hover:bg-fm-gold/10 transition-colors text-fm-gold font-medium text-sm'
            >
              <span>{createNewLabel}</span>
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
