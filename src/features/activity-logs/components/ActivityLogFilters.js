import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Activity Log Filters Component
 *
 * Sidebar component for filtering activity logs.
 * Includes category checkboxes, date range, and search.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Calendar, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/shared';
import { Button } from '@/components/common/shadcn/button';
import { Input } from '@/components/common/shadcn/input';
import { Calendar as CalendarComponent } from '@/components/common/shadcn/calendar';
import { Popover, PopoverContent, PopoverTrigger, } from '@/components/common/shadcn/popover';
import { FmCommonCheckbox } from '@/components/common/forms/FmCommonCheckbox';
import { CATEGORY_CONFIG, ALL_CATEGORIES, } from '../types';
export function ActivityLogFilters({ filters, onFiltersChange, onClearFilters, }) {
    const { t } = useTranslation('common');
    const [searchValue, setSearchValue] = useState(filters.search || '');
    const handleCategoryToggle = (category) => {
        const currentCategories = filters.categories || [];
        const newCategories = currentCategories.includes(category)
            ? currentCategories.filter(c => c !== category)
            : [...currentCategories, category];
        onFiltersChange({
            ...filters,
            categories: newCategories.length > 0 ? newCategories : undefined,
        });
    };
    const handleSearchSubmit = () => {
        onFiltersChange({
            ...filters,
            search: searchValue || undefined,
        });
    };
    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSearchSubmit();
        }
    };
    const handleDateFromChange = (date) => {
        onFiltersChange({
            ...filters,
            dateFrom: date ? date.toISOString() : undefined,
        });
    };
    const handleDateToChange = (date) => {
        onFiltersChange({
            ...filters,
            dateTo: date ? date.toISOString() : undefined,
        });
    };
    const hasActiveFilters = (filters.categories && filters.categories.length > 0) ||
        filters.dateFrom ||
        filters.dateTo ||
        filters.search;
    return (_jsxs("div", { className: "flex flex-col gap-6 p-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-xs uppercase text-muted-foreground font-medium", children: t('activityLogFilters.search') }), _jsxs("div", { className: "flex gap-2", children: [_jsxs("div", { className: "relative flex-1", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }), _jsx(Input, { value: searchValue, onChange: e => setSearchValue(e.target.value), onKeyDown: handleSearchKeyDown, placeholder: t('activityLogFilters.searchPlaceholder'), className: "pl-9 bg-black/40 border-white/20 focus:border-fm-gold" })] }), _jsx(Button, { variant: "outline", size: "icon", onClick: handleSearchSubmit, className: "border-white/20 hover:border-fm-gold hover:bg-fm-gold/10", children: _jsx(Search, { className: "h-4 w-4" }) })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-xs uppercase text-muted-foreground font-medium", children: t('activityLogFilters.dateRange') }), _jsxs("div", { className: "space-y-2", children: [_jsxs(Popover, { children: [_jsx(PopoverTrigger, { asChild: true, children: _jsxs(Button, { variant: "outline", className: cn('w-full justify-start text-left font-normal', 'bg-black/40 border-white/20 hover:border-fm-gold/50', !filters.dateFrom && 'text-muted-foreground'), children: [_jsx(Calendar, { className: "mr-2 h-4 w-4" }), filters.dateFrom
                                                    ? format(new Date(filters.dateFrom), 'MMM d, yyyy')
                                                    : t('activityLogFilters.fromDate')] }) }), _jsx(PopoverContent, { className: "w-auto p-0 bg-black/90 backdrop-blur-md border border-white/20", align: "start", children: _jsx(CalendarComponent, { mode: "single", selected: filters.dateFrom ? new Date(filters.dateFrom) : undefined, onSelect: handleDateFromChange, initialFocus: true, classNames: {
                                                day_selected: 'bg-fm-gold text-black hover:bg-fm-gold hover:text-black',
                                            } }) })] }), _jsxs(Popover, { children: [_jsx(PopoverTrigger, { asChild: true, children: _jsxs(Button, { variant: "outline", className: cn('w-full justify-start text-left font-normal', 'bg-black/40 border-white/20 hover:border-fm-gold/50', !filters.dateTo && 'text-muted-foreground'), children: [_jsx(Calendar, { className: "mr-2 h-4 w-4" }), filters.dateTo
                                                    ? format(new Date(filters.dateTo), 'MMM d, yyyy')
                                                    : t('activityLogFilters.toDate')] }) }), _jsx(PopoverContent, { className: "w-auto p-0 bg-black/90 backdrop-blur-md border border-white/20", align: "start", children: _jsx(CalendarComponent, { mode: "single", selected: filters.dateTo ? new Date(filters.dateTo) : undefined, onSelect: handleDateToChange, initialFocus: true, classNames: {
                                                day_selected: 'bg-fm-gold text-black hover:bg-fm-gold hover:text-black',
                                            } }) })] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-xs uppercase text-muted-foreground font-medium", children: t('activityLogFilters.categories') }), _jsx("div", { className: "space-y-2", children: ALL_CATEGORIES.map(category => {
                            const config = CATEGORY_CONFIG[category];
                            const isChecked = filters.categories?.includes(category) ?? false;
                            return (_jsxs("label", { className: cn('flex items-center gap-3 p-2 rounded cursor-pointer transition-colors', 'hover:bg-white/5', isChecked && 'bg-white/5'), children: [_jsx(FmCommonCheckbox, { checked: isChecked, onCheckedChange: () => handleCategoryToggle(category) }), _jsx("span", { className: cn('text-sm', config.color), children: config.label })] }, category));
                        }) })] }), hasActiveFilters && (_jsxs(Button, { variant: "outline", onClick: onClearFilters, className: "w-full border-white/20 hover:border-fm-danger hover:bg-fm-danger/10 hover:text-fm-danger", children: [_jsx(X, { className: "mr-2 h-4 w-4" }), t('activityLogFilters.clearFilters')] }))] }));
}
