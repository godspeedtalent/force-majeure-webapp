import * as React from 'react';
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
}

interface EventOnDate {
  id: string;
  title: string;
  start_time: string;
}

export function FmCommonEventDatePicker({
  value,
  onChange,
  placeholder,
  disabled = false,
}: FmCommonEventDatePickerProps) {
  const { t } = useTranslation('common');
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
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <Button
          variant='outline'
          className={cn(
            'w-full justify-start text-left font-normal',
            'bg-black/40 border-white/20 hover:border-fm-gold/50',
            'text-white hover:bg-black/60 hover:text-white',
            !value && 'text-white/50',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <CalendarIcon className='mr-2 h-4 w-4' />
          {value ? format(value, 'PPP p') : <span>{resolvedPlaceholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className='w-auto p-0 bg-black/90 backdrop-blur-md border border-white/20 pointer-events-auto'
        align='start'
        sideOffset={4}
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
          className='pointer-events-auto'
          classNames={{
            day_selected:
              'bg-fm-gold text-black hover:bg-fm-gold hover:text-black focus:bg-fm-gold focus:text-black',
          }}
        />
        <div className='p-3 border-t border-white/10'>
          <label className='text-sm text-white/70 mb-2 block'>{t('labels.time')}</label>
          <Input
            type='time'
            value={tempTime}
            onChange={e => handleTimeChange(e.target.value)}
            className='bg-black/40 border-white/20 text-white'
          />
        </div>
        <div className='flex gap-2 p-3 border-t border-white/10'>
          <Button
            onClick={handleCancel}
            variant='outline'
            className='flex-1 border-white/20 hover:bg-white/10 text-white'
          >
            {t('buttons.cancel')}
          </Button>
          <Button
            onClick={handleConfirm}
            className='flex-1 bg-fm-gold/20 backdrop-blur-sm border border-fm-gold text-fm-gold hover:bg-fm-gold hover:text-black transition-all duration-200'
          >
            {t('buttons.confirm')}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
