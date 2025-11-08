import * as React from 'react';
import { Search, Plus, X } from 'lucide-react';
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
import { cn } from '@/shared/utils/utils';

export interface SearchDropdownOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface FmCommonSearchDropdownProps {
  onChange: (value: string, label?: string) => void;
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

  React.useEffect(() => {
    if (!open) return;

    const searchDebounce = setTimeout(async () => {
      if (query.length > 0) {
        setLoading(true);
        try {
          const results = await onSearch(query);
          setOptions(results.slice(0, 10));
        } catch (error) {
          console.error('Search error:', error);
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

  const handleSelect = (optionId: string, optionLabel: string) => {
    onChange(optionId, optionLabel);
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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 rounded-none',
            'bg-black/40 border border-white/20',
            'text-white text-left',
            'hover:border-fm-gold/50 transition-colors',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Search className='h-3 w-3 text-white/50 flex-shrink-0' />
          {typeIcon && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className='flex items-center justify-center w-5 h-5 bg-white/10 flex-shrink-0'>
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
          <span className='flex-1 truncate'>
            {selectedLabel || placeholder}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className='w-[400px] p-0 bg-black/90 backdrop-blur-md border border-white/20'
        align='start'
      >
        <div className='p-2 border-b border-white/10 relative'>
          <Input
            ref={inputRef}
            placeholder={placeholder}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
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
                  onClick={() => handleSelect(option.id, option.label)}
                  className='w-full flex items-center gap-3 px-3 py-2 hover:bg-white/10 transition-colors text-left'
                >
                  {option.icon}
                  <span className='text-white'>{option.label}</span>
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
                onClick={() => handleSelect(option.id, option.label)}
                className='w-full flex items-center gap-3 px-3 py-2 hover:bg-white/10 transition-colors text-left'
              >
                {option.icon}
                <span className='text-white'>{option.label}</span>
              </button>
            ))
          )}
        </div>
        {onCreateNew && query.length > 0 && (
          <div className='border-t border-fm-gold'>
            <button
              onClick={handleCreateNew}
              className='w-full flex items-center gap-2 px-3 py-2 hover:bg-fm-gold/10 transition-colors text-fm-gold'
            >
              <Plus className='h-4 w-4' />
              <span>{createNewLabel}</span>
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
