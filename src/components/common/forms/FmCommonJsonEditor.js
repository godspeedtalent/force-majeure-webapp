import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * FmCommonJsonEditor
 *
 * Interactive key-value pair editor for JSON objects.
 * Provides a user-friendly interface for editing JSON data without manual typing.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/shared';
import { FmCommonTextField } from './FmCommonTextField';
import { FmCommonButton } from '../buttons/FmCommonButton';
/**
 * Interactive JSON key-value pair editor
 *
 * @example
 * ```tsx
 * const [socialLinks, setSocialLinks] = useState({});
 *
 * <FmCommonJsonEditor
 *   label="Social Links"
 *   value={socialLinks}
 *   onChange={setSocialLinks}
 *   keyPlaceholder="Platform (e.g., instagram)"
 *   valuePlaceholder="Handle or URL"
 * />
 * ```
 */
export const FmCommonJsonEditor = ({ value, onChange, label, required = false, keyPlaceholder, valuePlaceholder, className, disabled = false, }) => {
    const { t } = useTranslation('common');
    const [isFocused, setIsFocused] = useState(false);
    const resolvedKeyPlaceholder = keyPlaceholder || t('jsonEditor.key');
    const resolvedValuePlaceholder = valuePlaceholder || t('jsonEditor.value');
    // Convert object to array of key-value pairs
    const pairs = Object.entries(value).map(([key, val]) => ({
        key,
        value: val,
    }));
    const handleAdd = () => {
        // Add a new empty pair
        const newKey = `key_${Date.now()}`;
        onChange({ ...value, [newKey]: '' });
    };
    const handleRemove = (keyToRemove) => {
        const newValue = { ...value };
        delete newValue[keyToRemove];
        onChange(newValue);
    };
    const handleKeyChange = (oldKey, newKey) => {
        if (oldKey === newKey)
            return;
        const newValue = { ...value };
        const val = newValue[oldKey];
        delete newValue[oldKey];
        // Only add if new key doesn't exist
        if (!newValue[newKey]) {
            newValue[newKey] = val;
        }
        onChange(newValue);
    };
    const handleValueChange = (key, newValue) => {
        onChange({ ...value, [key]: newValue });
    };
    return (_jsxs("div", { className: cn('space-y-[10px]', className), children: [label && (_jsxs("label", { className: cn('block font-canela text-xs uppercase tracking-wider transition-colors duration-200', isFocused ? 'text-fm-gold' : 'text-muted-foreground'), children: [label, required && _jsx("span", { className: 'text-fm-danger ml-1', children: "*" })] })), _jsx("div", { className: 'space-y-[10px]', children: pairs.length === 0 ? (_jsxs("div", { className: 'text-center py-[40px] border border-white/20 rounded-none bg-black/20', children: [_jsx("p", { className: 'text-sm text-muted-foreground font-canela mb-[20px]', children: t('jsonEditor.noEntriesYet') }), _jsx(FmCommonButton, { type: 'button', variant: 'default', icon: Plus, iconPosition: 'left', onClick: handleAdd, disabled: disabled, size: 'sm', children: t('jsonEditor.addEntry') })] })) : (_jsxs(_Fragment, { children: [pairs.map(({ key, value: val }) => (_jsxs("div", { className: 'flex gap-[10px] items-start p-[15px] bg-black/40 backdrop-blur-sm border border-white/20 rounded-none', onFocus: () => setIsFocused(true), onBlur: () => setIsFocused(false), children: [_jsx("div", { className: 'flex-1', children: _jsx(FmCommonTextField, { value: key, onChange: e => handleKeyChange(key, e.target.value), placeholder: resolvedKeyPlaceholder, disabled: disabled }) }), _jsx("div", { className: 'flex-1', children: _jsx(FmCommonTextField, { value: val, onChange: e => handleValueChange(key, e.target.value), placeholder: resolvedValuePlaceholder, disabled: disabled }) }), _jsx("button", { type: 'button', onClick: () => handleRemove(key), disabled: disabled, className: cn('mt-[2px] p-[8px] text-muted-foreground hover:text-fm-danger transition-colors duration-200', 'border border-white/20 hover:border-fm-danger/50 rounded-none', disabled && 'opacity-50 cursor-not-allowed'), "aria-label": `Remove ${key}`, children: _jsx(Trash2, { className: 'h-4 w-4' }) })] }, key))), _jsx(FmCommonButton, { type: 'button', variant: 'secondary', icon: Plus, iconPosition: 'left', onClick: handleAdd, disabled: disabled, className: 'w-full', children: t('jsonEditor.addEntry') })] })) }), pairs.length > 0 && (_jsx("p", { className: 'text-xs text-muted-foreground font-canela', children: t('jsonEditor.entryCount', { count: pairs.length }) }))] }));
};
