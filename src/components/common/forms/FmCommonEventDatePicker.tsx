import * as React from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/shared';
import { Button } from '@/components/common/shadcn/button';
import { Calendar } from '@/components/common/shadcn/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/common/shadcn/popover';
import { Input } from '@/components/common/shadcn/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/common/shadcn/tooltip';
import { supabase } from '@/shared';
import { useDateTimePicker } from '@/shared';

interface FmCommonEventDatePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  required?: boolean;
  className?: string;
}

interface EventOnDate {
  id: string;
  title: string;
  start_time: string;
}

/**
 * FmCommonEventDatePicker - Enhanced event date/time picker
 *
 * Features:
 * - Shows existing events on calendar dates with gold highlighting
 * - Hover tooltips showing events scheduled on each date
 * - Combined date and time selection
 * - Gold hover effects and design system styling
 */
export function FmCommonEventDatePicker({
  value,
  onChange,
  placeholder,
  disabled = false,
  label,
  required = false,
  className,
}: FmCommonEventDatePickerProps) {
  const { t } = useTranslation('common');
  const [isHovered, setIsHovered] = useState(false);
  const resolvedPlaceholder = placeholder ?? t('datePicker.pickDateTime');
  const {
    tempDate,
    tempTime,
    isOpen,
    setIsOpen,
    handleDateSelect,
    handleDayClick,
    handleTimeChange,
    handleConfirm,
    handleCancel,
  } = useDateTimePicker({ value, onChange });

  const [eventsOnDates, setEventsOnDates] = React.useState<
    Record<string, EventOnDate[]>
  >({});

  // Fetch future events
  React.useEffect(() => {
    const fetchEvents = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('events')
        .select('id, title, start_time')
        .gte('start_time', today.toISOString().split('T')[0])
        .order('start_time', { ascending: true});

      if (!error && data) {
        const grouped: Record<string, EventOnDate[]> = {};
        data.forEach(event => {
          const dateKey = event.start_time?.split('T')[0] || '';
          if (dateKey && !grouped[dateKey]) {
            grouped[dateKey] = [];
          }
          if (dateKey) {
            grouped[dateKey].push({
              id: event.id,
              title: event.title || '',
              start_time: event.start_time || ''
            });
          }
        });
        setEventsOnDates(grouped);
      }
    };

    fetchEvents();
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Custom day renderer to show gold text for dates with events
  const modifiers = {
    hasEvent: (date: Date) => {
      const dateKey = format(date, 'yyyy-MM-dd');
      return !!eventsOnDates[dateKey];
    },
  };

  const modifiersClassNames = {
    hasEvent: 'text-fm-gold font-bold',
  };

  const DayContent = ({ date }: { date: Date }) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const events = eventsOnDates[dateKey];

    if (!events || events.length === 0) {
      return <>{format(date, 'd')}</>;
    }

    return (
      <TooltipProvider>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <span className='cursor-pointer'>{format(date, 'd')}</span>
          </TooltipTrigger>
          <TooltipContent
            side='top'
            className='bg-black/95 border border-fm-gold/30 text-white max-w-xs'
          >
            <div className='space-y-1'>
              <p className='font-semibold text-fm-gold text-xs'>
                {t('datePicker.scheduledEvents', { count: events.length })}
              </p>
              <ul className='space-y-0.5 text-xs'>
                {events.map(event => (
                  <li key={event.id} className='text-white/80'>
                    • {event.title}
                  </li>
                ))}
              </ul>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
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
              'px-4 py-3 rounded-none',
              'bg-black/40 backdrop-blur-sm',
              'border-2 transition-all duration-300',
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
                'mr-3 h-5 w-5 transition-all duration-300',
                isOpen && 'text-fm-gold scale-110',
                isHovered && !isOpen && 'text-fm-gold/80'
              )}
            />
            <span className='flex-1'>
              {value ? format(value, 'PPP p') : resolvedPlaceholder}
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
            selected={tempDate}
            onSelect={handleDateSelect}
            onDayClick={handleDayClick}
            disabled={date => date < today}
            modifiers={modifiers}
            modifiersClassNames={modifiersClassNames}
            components={{
              DayContent: ({ date }) => <DayContent date={date} />,
            }}
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
              day_hidden: 'invisible',
            }}
          />
          <div className='p-4 border-t border-fm-gold/20'>
            <label className='text-xs uppercase tracking-wider text-fm-gold/60 mb-2 block'>
              {t('labels.time')}
            </label>
            <Input
              type='time'
              value={tempTime}
              onChange={e => handleTimeChange(e.target.value)}
              className='bg-black/40 border-white/20 text-white focus:border-fm-gold focus:ring-fm-gold/30'
            />
          </div>
          <div className='flex gap-3 p-4 border-t border-fm-gold/20'>
            <Button
              onClick={handleCancel}
              variant='outline'
              className='flex-1 border-white/20 hover:bg-white/10 hover:border-white/40 text-white rounded-none'
            >
              {t('buttons.cancel')}
            </Button>
            <Button
              onClick={handleConfirm}
              className='flex-1 bg-fm-gold/20 backdrop-blur-sm border-2 border-fm-gold text-fm-gold hover:bg-fm-gold hover:text-black transition-all duration-200 rounded-none'
            >
              {t('buttons.confirm')}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
