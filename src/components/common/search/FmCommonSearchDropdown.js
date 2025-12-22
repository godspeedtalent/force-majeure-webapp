import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { logger } from '@/shared';
import { Search, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger, } from '@/components/common/shadcn/popover';
import { Input } from '@/components/common/shadcn/input';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, } from '@/components/common/shadcn/tooltip';
import { cn } from '@/shared';
export function FmCommonSearchDropdown({ onChange, onSearch, onGetRecentOptions, onCreateNew, placeholder, createNewLabel, selectedLabel, disabled = false, typeIcon, typeTooltip, }) {
    const { t } = useTranslation('common');
    const resolvedPlaceholder = placeholder || t('searchDropdown.placeholder');
    const resolvedCreateNewLabel = createNewLabel || t('searchDropdown.createNew');
    const [open, setOpen] = React.useState(false);
    const [query, setQuery] = React.useState('');
    const [options, setOptions] = React.useState([]);
    const [recentOptions, setRecentOptions] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);
    const inputRef = React.useRef(null);
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
        if (!open)
            return;
        const searchDebounce = setTimeout(async () => {
            if (query.length > 0) {
                setLoading(true);
                try {
                    const results = await onSearch(query);
                    setOptions(results.slice(0, 10));
                }
                catch (error) {
                    logger.error('Search error:', { error: error instanceof Error ? error.message : 'Unknown' });
                    setOptions([]);
                }
                finally {
                    setLoading(false);
                }
            }
            else {
                setOptions([]);
            }
        }, 300);
        return () => clearTimeout(searchDebounce);
    }, [query, onSearch, open]);
    const handleSelect = (option) => {
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
    const handleClear = (e) => {
        e.stopPropagation();
        setQuery('');
        inputRef.current?.blur();
        setIsFocused(false);
    };
    const showClearButton = query.length > 0 || isFocused;
    const triggerButton = (_jsxs("button", { type: 'button', className: cn('w-full flex items-center gap-2 pr-3 py-2 rounded-none', 'bg-black/40 border border-white/20', 'text-white text-left font-light', 'hover:border-fm-gold/50 transition-colors', disabled && 'opacity-50 cursor-not-allowed'), children: [typeIcon && (_jsx(TooltipProvider, { children: _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("div", { className: 'flex items-center justify-center h-full border-r border-white/20 px-2 flex-shrink-0', children: typeIcon }) }), typeTooltip && (_jsx(TooltipContent, { children: _jsx("p", { children: typeTooltip }) }))] }) })), _jsx(Search, { className: 'h-3 w-3 text-white/50 flex-shrink-0 ml-3' }), _jsx("span", { className: cn('flex-1 truncate font-light', selectedLabel ? 'text-white' : 'text-white/40 text-sm'), children: selectedLabel || resolvedPlaceholder })] }));
    return (_jsxs(Popover, { open: open, onOpenChange: setOpen, children: [_jsx(PopoverTrigger, { asChild: true, disabled: disabled, children: triggerButton }), _jsxs(PopoverContent, { className: 'w-[400px] p-0 bg-black/90 backdrop-blur-md border border-white/20', align: 'start', onOpenAutoFocus: (e) => {
                    e.preventDefault();
                    setTimeout(() => inputRef.current?.focus(), 0);
                }, children: [_jsxs("div", { className: 'p-2 border-b border-white/10 relative', children: [_jsx(Input, { ref: inputRef, placeholder: resolvedPlaceholder, value: query, onChange: e => setQuery(e.target.value), onFocus: () => setIsFocused(true), onBlur: () => setIsFocused(false), onClick: e => {
                                    e.stopPropagation();
                                    inputRef.current?.focus();
                                }, className: 'bg-black/40 border-white/20 text-white placeholder:text-white/50 pr-8', autoFocus: true }), showClearButton && (_jsx("button", { onClick: handleClear, onMouseDown: e => e.preventDefault(), className: 'absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-fm-gold transition-colors', "aria-label": t('searchDropdown.clearSearch'), children: _jsx(X, { className: 'h-4 w-4' }) }))] }), _jsx("div", { className: 'max-h-[300px] overflow-y-auto', children: loading ? (_jsxs("div", { className: 'p-4 flex flex-col items-center gap-2', children: [_jsx(FmCommonLoadingSpinner, { size: 'md' }), _jsx("span", { className: 'text-white/50 text-sm', children: t('searchDropdown.searching') })] })) : query.length === 0 && recentOptions.length > 0 ? (_jsxs("div", { children: [_jsx("div", { className: 'px-3 py-2 text-xs text-white/50 font-semibold uppercase', children: t('searchDropdown.recent') }), recentOptions.map(option => (_jsxs("button", { onClick: () => handleSelect(option), className: 'w-full flex items-center gap-3 px-3 py-2 hover:bg-white/10 transition-colors text-left', children: [option.icon, _jsx("span", { className: 'text-white font-light', children: option.label })] }, option.id)))] })) : options.length === 0 && query.length > 0 ? (_jsx("div", { className: 'p-4 text-center text-white/50', children: t('empty.noResults') })) : (options.map(option => (_jsxs("button", { onClick: () => handleSelect(option), className: 'w-full flex items-center gap-3 px-3 py-2 hover:bg-white/10 transition-colors text-left', children: [option.icon, _jsx("span", { className: 'text-white font-light', children: option.label })] }, option.id)))) }), onCreateNew && (_jsx("div", { className: 'border-t border-fm-gold', children: _jsx("button", { onClick: handleCreateNew, className: 'w-full flex items-center gap-2 px-3 py-2 hover:bg-fm-gold/10 transition-colors text-fm-gold font-medium text-sm', children: _jsx("span", { children: resolvedCreateNewLabel }) }) }))] })] }));
}
