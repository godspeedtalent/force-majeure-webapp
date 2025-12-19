import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * FmGenreMultiSelect Component
 *
 * Multi-select searchable genre dropdown with badges.
 * Allows selection of up to 5 genres with real-time search.
 */
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X } from 'lucide-react';
import { cn } from '@/shared';
import { searchGenres } from '../services/genreService';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { logger } from '@/shared';
import { Popover, PopoverContent, PopoverTrigger, } from '@/components/common/shadcn/popover';
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
export const FmGenreMultiSelect = ({ selectedGenres, onChange, maxGenres = 5, disabled = false, label, required = false, className, }) => {
    const { t } = useTranslation('common');
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef(null);
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
                const filtered = results.filter(genre => !selectedGenres.some(selected => selected.id === genre.id));
                setOptions(filtered);
            }
            catch (error) {
                logger.error('Failed to search genres', { error: error instanceof Error ? error.message : String(error), query });
                setOptions([]);
            }
            finally {
                setLoading(false);
            }
        }, 300);
        return () => clearTimeout(searchDebounce);
    }, [query, open, selectedGenres]);
    const handleSelect = (genre) => {
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
    const handleRemove = (genreId) => {
        onChange(selectedGenres.filter(g => g.id !== genreId));
    };
    const handleClear = () => {
        onChange([]);
    };
    return (_jsxs("div", { className: cn('space-y-[10px]', className), children: [label && (_jsxs("label", { className: cn('block font-canela text-xs uppercase tracking-wider transition-colors duration-200', isFocused ? 'text-fm-gold' : 'text-muted-foreground'), children: [label, required && _jsx("span", { className: 'text-fm-danger ml-1', children: "*" })] })), selectedGenres.length > 0 && (_jsxs("div", { className: 'flex flex-wrap gap-[10px] p-[15px] bg-black/40 backdrop-blur-sm border border-white/20 rounded-none', children: [selectedGenres.map(genre => (_jsxs("div", { className: 'flex items-center gap-[10px] px-[15px] py-[8px] bg-fm-gold/10 border border-fm-gold/30 rounded-none group hover:bg-fm-gold/20 transition-all duration-200', children: [_jsx("span", { className: 'font-canela text-sm text-fm-gold uppercase tracking-wider', children: genre.name }), _jsx("button", { type: 'button', onClick: () => handleRemove(genre.id), disabled: disabled, className: 'text-fm-gold/70 hover:text-fm-gold transition-colors duration-200', "aria-label": `Remove ${genre.name}`, children: _jsx(X, { className: 'h-3 w-3' }) })] }, genre.id))), selectedGenres.length > 0 && (_jsx("button", { type: 'button', onClick: handleClear, disabled: disabled, className: 'px-[15px] py-[8px] text-xs text-muted-foreground hover:text-foreground border border-white/10 hover:border-white/20 rounded-none transition-all duration-200 font-canela uppercase tracking-wider', children: t('genreMultiSelect.clearAll') }))] })), _jsxs("div", { className: 'flex items-center justify-between text-xs text-muted-foreground font-canela', children: [_jsx("span", { children: t('genreMultiSelect.selectedCount', { count: selectedGenres.length, max: maxGenres }) }), !canAddMore && _jsx("span", { className: 'text-fm-gold', children: t('genreMultiSelect.maximumReached') })] }), canAddMore && (_jsxs(Popover, { open: open, onOpenChange: setOpen, children: [_jsx(PopoverTrigger, { asChild: true, children: _jsxs("button", { type: 'button', disabled: disabled, onFocus: () => setIsFocused(true), onBlur: () => setIsFocused(false), className: cn('w-full flex items-center gap-[10px] px-[15px] py-[12px] font-canela text-sm', 'bg-transparent border rounded-none transition-all duration-200', isFocused
                                ? 'border-b-[3px] border-t-0 border-l-0 border-r-0 border-fm-gold bg-white/5 shadow-[0_4px_16px_rgba(223,186,125,0.3)]'
                                : 'border-white/20 hover:border-fm-gold hover:bg-white/5', disabled && 'opacity-50 cursor-not-allowed'), children: [_jsx(Search, { className: 'h-4 w-4 text-muted-foreground' }), _jsx("span", { className: 'text-muted-foreground', children: open ? t('genreMultiSelect.searchGenres') : t('genreMultiSelect.addGenre') })] }) }), _jsxs(PopoverContent, { className: 'w-[var(--radix-popover-trigger-width)] p-0 bg-black/90 backdrop-blur-xl border-2 border-white/20 rounded-none shadow-2xl', align: 'start', children: [_jsx("div", { className: 'p-[15px] border-b border-white/10', children: _jsxs("div", { className: 'flex items-center gap-[10px]', children: [_jsx(Search, { className: 'h-4 w-4 text-muted-foreground flex-shrink-0' }), _jsx("input", { ref: inputRef, type: 'text', value: query, onChange: e => setQuery(e.target.value), placeholder: t('genreMultiSelect.searchGenres'), className: 'flex-1 bg-transparent border-none outline-none font-canela text-sm text-foreground placeholder:text-muted-foreground', autoFocus: true }), loading && _jsx(FmCommonLoadingSpinner, { size: 'sm' })] }) }), _jsx("div", { className: 'max-h-[300px] overflow-y-auto', children: query.length === 0 ? (_jsx("div", { className: 'p-[20px] text-center', children: _jsx("p", { className: 'font-canela text-sm text-muted-foreground', children: t('genreMultiSelect.startTyping') }) })) : options.length === 0 && !loading ? (_jsx("div", { className: 'p-[20px] text-center', children: _jsx("p", { className: 'font-canela text-sm text-muted-foreground', children: t('genreMultiSelect.noGenresFound', { query }) }) })) : (_jsx("div", { className: 'divide-y divide-white/10', children: options.map(genre => (_jsx("button", { type: 'button', onClick: () => handleSelect(genre), className: 'w-full px-[15px] py-[12px] text-left hover:bg-fm-gold/10 transition-colors duration-200 font-canela text-sm', children: genre.name }, genre.id))) })) })] })] }))] }));
};
