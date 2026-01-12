import { useState } from 'react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/shared';
import { Calendar } from '@/components/common/shadcn/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/common/shadcn/popover';

interface FmCommonDatePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  disablePastDates?: boolean;
  label?: string;
  required?: boolean;
  className?: string;
  /** Size variant - affects height to match other form controls */
  size?: 'default' | 'sm';
}

/**
 * FmCommonDatePicker - Enhanced date picker with Force Majeure design system styling
 *
 * Features:
 * - Gold hover effects with glow
 * - Smooth animations and transitions
 * - Focus states with gold accents
 * - Optional label with required indicator
 * - Fully styled calendar dropdown
 * - Size variants for consistent heights with other form controls
 *
 * Usage:
 * ```tsx
 * <FmCommonDatePicker
 *   value={date}
 *   onChange={setDate}
 *   label="Event Date"
 *   required
 *   size="sm" // Use 'sm' for filter bars, 'default' for forms
 * />
 * ```
 */
export function FmCommonDatePicker({
  value,
  onChange,
  placeholder,
  disabled = false,
  disablePastDates = true,
  label,
  required = false,
  className,
  size = 'default',
}: FmCommonDatePickerProps) {
  const { t } = useTranslation('common');
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const resolvedPlaceholder = placeholder ?? t('datePicker.pickDate');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handleSelect = (date: Date | undefined) => {
    onChange(date);
    setIsOpen(false);
  };

  // Size-based classes for consistent heights
  const sizeClasses = {
    default: 'h-12 px-4 py-3',
    sm: 'h-10 px-3 py-2',
  };

  const iconSizeClasses = {
    default: 'h-5 w-5 mr-3',
    sm: 'h-4 w-4 mr-2',
  };

  const textSizeClasses = {
    default: 'text-base',
    sm: 'text-sm',
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className={cn(
          'text-xs uppercase tracking-wider transition-colors duration-200',
          isOpen ? 'text-fm-gold' : 'text-muted-foreground'
        )}>
          {label} {required && <span className='text-destructive'>*</span>}
        </label>
      )}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild disabled={disabled}>
          <button
            type='button'
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={cn(
              'w-full flex items-center justify-start text-left font-canela',
              'rounded-none',
              'bg-black/40 backdrop-blur-sm',
              'border transition-all duration-300',
              sizeClasses[size],
              textSizeClasses[size],
              // Default border
              !isOpen && !isHovered && 'border-white/20',
              // Hover state
              isHovered && !isOpen && [
                'border-fm-gold/60 bg-white/5',
                'shadow-[0_0_16px_rgba(223,186,125,0.2)]',
              ],
              // Open/focused state
              isOpen && [
                'border-t-transparent border-l-transparent border-r-transparent',
                'border-b-fm-gold border-b-[3px]',
                'shadow-[0_4px_16px_rgba(223,186,125,0.3)]',
                'bg-white/5',
              ],
              // Text styling
              value ? 'text-white' : 'text-white/50',
              // Disabled state
              disabled && 'opacity-50 cursor-not-allowed',
              !disabled && 'cursor-pointer'
            )}
          >
            <CalendarIcon
              className={cn(
                'transition-all duration-300',
                iconSizeClasses[size],
                isOpen && 'text-fm-gold scale-110',
                isHovered && !isOpen && 'text-fm-gold/80'
              )}
            />
            <span className='flex-1'>
              {value ? format(value, 'PPP') : resolvedPlaceholder}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          className={cn(
            'w-auto p-0 pointer-events-auto',
            'bg-black/95 backdrop-blur-xl',
            'border-2 border-fm-gold/30',
            'shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_24px_rgba(223,186,125,0.15)]',
            'rounded-none',
            'animate-in fade-in-0 zoom-in-95 duration-200'
          )}
          align='start'
          sideOffset={8}
        >
          <Calendar
            mode='single'
            selected={value}
            onSelect={handleSelect}
            disabled={disablePastDates ? date => date < today : undefined}
            initialFocus
            className='pointer-events-auto p-4'
            classNames={{
              months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
              month: 'space-y-4',
              caption: 'flex justify-center pt-1 relative items-center',
              caption_label: 'text-sm font-medium text-white',
              nav: 'space-x-1 flex items-center',
              nav_button: cn(
                'h-8 w-8 bg-transparent p-0 transition-all duration-200',
                'border border-white/20 rounded-none',
                'hover:bg-fm-gold/20 hover:border-fm-gold/50 hover:text-fm-gold',
                'text-white/70'
              ),
              nav_button_previous: 'absolute left-1',
              nav_button_next: 'absolute right-1',
              table: 'w-full border-collapse space-y-1',
              head_row: 'flex',
              head_cell: 'text-fm-gold/60 w-10 font-normal text-[0.75rem] uppercase tracking-wider',
              row: 'flex w-full mt-2',
              cell: cn(
                'h-10 w-10 text-center text-sm p-0 relative',
                'focus-within:relative focus-within:z-20'
              ),
              day: cn(
                'h-10 w-10 p-0 font-normal transition-all duration-200',
                'text-white/80 hover:text-white',
                'hover:bg-fm-gold/20 hover:shadow-[0_0_12px_rgba(223,186,125,0.3)]',
                'rounded-none border border-transparent',
                'hover:border-fm-gold/40',
                'focus:outline-none focus:ring-2 focus:ring-fm-gold/50',
                'aria-selected:opacity-100'
              ),
              day_selected: cn(
                'bg-fm-gold text-black font-semibold',
                'hover:bg-fm-gold hover:text-black',
                'focus:bg-fm-gold focus:text-black',
                'shadow-[0_0_16px_rgba(223,186,125,0.5)]',
                'border-fm-gold'
              ),
              day_today: cn(
                'border-2 border-fm-gold/50 text-fm-gold font-medium',
                'bg-fm-gold/10'
              ),
              day_outside: 'text-white/30 opacity-50',
              day_disabled: 'text-white/20 opacity-30 cursor-not-allowed hover:bg-transparent hover:border-transparent',
              day_range_middle: 'aria-selected:bg-fm-gold/20 aria-selected:text-white',
              day_hidden: 'invisible',
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
