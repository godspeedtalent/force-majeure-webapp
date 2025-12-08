/**
 * FmCommonJsonEditor
 *
 * Interactive key-value pair editor for JSON objects.
 * Provides a user-friendly interface for editing JSON data without manual typing.
 */

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/shared/utils/utils';
import { FmCommonTextField } from './FmCommonTextField';
import { FmCommonButton } from '../buttons/FmCommonButton';

interface FmCommonJsonEditorProps {
  /** Current JSON value as object */
  value: Record<string, string>;
  /** Callback when value changes */
  onChange: (value: Record<string, string>) => void;
  /** Label for the field */
  label?: string;
  /** Required field indicator */
  required?: boolean;
  /** Placeholder for key input */
  keyPlaceholder?: string;
  /** Placeholder for value input */
  valuePlaceholder?: string;
  /** Additional CSS classes */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
}

interface KeyValuePair {
  key: string;
  value: string;
}

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
export const FmCommonJsonEditor = ({
  value,
  onChange,
  label,
  required = false,
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value',
  className,
  disabled = false,
}: FmCommonJsonEditorProps) => {
  const [isFocused, setIsFocused] = useState(false);

  // Convert object to array of key-value pairs
  const pairs: KeyValuePair[] = Object.entries(value).map(([key, val]) => ({
    key,
    value: val,
  }));

  const handleAdd = () => {
    // Add a new empty pair
    const newKey = `key_${Date.now()}`;
    onChange({ ...value, [newKey]: '' });
  };

  const handleRemove = (keyToRemove: string) => {
    const newValue = { ...value };
    delete newValue[keyToRemove];
    onChange(newValue);
  };

  const handleKeyChange = (oldKey: string, newKey: string) => {
    if (oldKey === newKey) return;

    const newValue = { ...value };
    const val = newValue[oldKey];
    delete newValue[oldKey];

    // Only add if new key doesn't exist
    if (!newValue[newKey]) {
      newValue[newKey] = val;
    }

    onChange(newValue);
  };

  const handleValueChange = (key: string, newValue: string) => {
    onChange({ ...value, [key]: newValue });
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

      {/* Key-Value Pairs */}
      <div className='space-y-[10px]'>
        {pairs.length === 0 ? (
          <div className='text-center py-[40px] border border-white/20 rounded-none bg-black/20'>
            <p className='text-sm text-muted-foreground font-canela mb-[20px]'>
              No entries yet.
            </p>
            <FmCommonButton
              type='button'
              variant='default'
              icon={Plus}
              iconPosition='left'
              onClick={handleAdd}
              disabled={disabled}
              size='sm'
            >
              Add Entry
            </FmCommonButton>
          </div>
        ) : (
          <>
            {pairs.map(({ key, value: val }) => (
              <div
                key={key}
                className='flex gap-[10px] items-start p-[15px] bg-black/40 backdrop-blur-sm border border-white/20 rounded-none'
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
              >
                {/* Key Input */}
                <div className='flex-1'>
                  <FmCommonTextField
                    value={key}
                    onChange={e => handleKeyChange(key, e.target.value)}
                    placeholder={keyPlaceholder}
                    disabled={disabled}
                  />
                </div>

                {/* Value Input */}
                <div className='flex-1'>
                  <FmCommonTextField
                    value={val}
                    onChange={e => handleValueChange(key, e.target.value)}
                    placeholder={valuePlaceholder}
                    disabled={disabled}
                  />
                </div>

                {/* Remove Button */}
                <button
                  type='button'
                  onClick={() => handleRemove(key)}
                  disabled={disabled}
                  className={cn(
                    'mt-[2px] p-[8px] text-muted-foreground hover:text-fm-danger transition-colors duration-200',
                    'border border-white/20 hover:border-fm-danger/50 rounded-none',
                    disabled && 'opacity-50 cursor-not-allowed'
                  )}
                  aria-label={`Remove ${key}`}
                >
                  <Trash2 className='h-4 w-4' />
                </button>
              </div>
            ))}

            {/* Add Button */}
            <FmCommonButton
              type='button'
              variant='secondary'
              icon={Plus}
              iconPosition='left'
              onClick={handleAdd}
              disabled={disabled}
              className='w-full'
            >
              Add Entry
            </FmCommonButton>
          </>
        )}
      </div>

      {/* Helper Text */}
      {pairs.length > 0 && (
        <p className='text-xs text-muted-foreground font-canela'>
          {pairs.length} {pairs.length === 1 ? 'entry' : 'entries'}
        </p>
      )}
    </div>
  );
};
