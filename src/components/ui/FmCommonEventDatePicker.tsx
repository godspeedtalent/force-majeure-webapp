import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/shared/utils/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/shared/api/supabase/client';

interface FmCommonEventDatePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
}

interface EventOnDate {
  id: string;
  title: string;
  date: string;
}

export function FmCommonEventDatePicker({
  value,
  onChange,
  placeholder = 'Pick a date and time',
  disabled = false,
}: FmCommonEventDatePickerProps) {
  const [time, setTime] = React.useState('21:00');
  const [tempDate, setTempDate] = React.useState<Date | undefined>(value);
  const [tempTime, setTempTime] = React.useState('21:00');
  const [isOpen, setIsOpen] = React.useState(false);
  const [eventsOnDates, setEventsOnDates] = React.useState<Record<string, EventOnDate[]>>({});

  React.useEffect(() => {
    if (value) {
      setTime(format(value, 'HH:mm'));
      setTempDate(value);
      setTempTime(format(value, 'HH:mm'));
    }
  }, [value]);

  // Fetch future events
  React.useEffect(() => {
    const fetchEvents = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('events')
        .select('id, title, date')
        .gte('date', today.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (!error && data) {
        const grouped: Record<string, EventOnDate[]> = {};
        data.forEach((event) => {
          const dateKey = event.date;
          if (!grouped[dateKey]) {
            grouped[dateKey] = [];
          }
          grouped[dateKey].push(event);
        });
        setEventsOnDates(grouped);
      }
    };

    fetchEvents();
  }, []);

  const handleDateSelect = (date: Date | undefined) => {
    setTempDate(date);
  };

  const handleDateDoubleClick = (date: Date | undefined) => {
    if (date) {
      const [hours, minutes] = tempTime.split(':').map(Number);
      const newDate = new Date(date);
      newDate.setHours(hours, minutes);
      onChange(newDate);
      setTime(tempTime);
      setIsOpen(false);
    }
  };

  const handleTimeChange = (newTime: string) => {
    setTempTime(newTime);
  };

  const handleConfirm = () => {
    if (tempDate) {
      const [hours, minutes] = tempTime.split(':').map(Number);
      const newDate = new Date(tempDate);
      newDate.setHours(hours, minutes);
      onChange(newDate);
      setTime(tempTime);
    }
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempDate(value);
    setTempTime(time);
    setIsOpen(false);
  };

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
            <span className="cursor-pointer">{format(date, 'd')}</span>
          </TooltipTrigger>
          <TooltipContent 
            side="top" 
            className="bg-black/95 border border-fm-gold/30 text-white max-w-xs"
          >
            <div className="space-y-1">
              <p className="font-semibold text-fm-gold text-xs">
                {events.length} scheduled event{events.length > 1 ? 's' : ''}
              </p>
              <ul className="space-y-0.5 text-xs">
                {events.map((event) => (
                  <li key={event.id} className="text-white/80">
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
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            'bg-black/40 border-white/20 hover:border-fm-gold/50',
            'text-white hover:bg-black/60 hover:text-white',
            !value && 'text-white/50',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, 'PPP p') : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-black/90 backdrop-blur-md border border-white/20" align="start">
        <Calendar
          mode="single"
          selected={tempDate}
          onSelect={handleDateSelect}
          onDayClick={(date) => {
            const now = Date.now();
            const lastClick = (window as any).lastEventCalendarClick || 0;
            if (now - lastClick < 300) {
              handleDateDoubleClick(date);
            }
            (window as any).lastEventCalendarClick = now;
          }}
          disabled={(date) => date < today}
          modifiers={modifiers}
          modifiersClassNames={modifiersClassNames}
          components={{
            DayContent: ({ date }) => <DayContent date={date} />,
          }}
          initialFocus
          className="pointer-events-auto"
          classNames={{
            day_selected: 'bg-fm-gold text-black hover:bg-fm-gold hover:text-black focus:bg-fm-gold focus:text-black',
          }}
        />
        <div className="p-3 border-t border-white/10">
          <label className="text-sm text-white/70 mb-2 block">Time</label>
          <Input
            type="time"
            value={tempTime}
            onChange={(e) => handleTimeChange(e.target.value)}
            className="bg-black/40 border-white/20 text-white"
          />
        </div>
        <div className="flex gap-2 p-3 border-t border-white/10">
          <Button
            onClick={handleCancel}
            variant="outline"
            className="flex-1 border-white/20 hover:bg-white/10 text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            className="flex-1 bg-fm-gold hover:bg-fm-gold/90 text-black"
          >
            Confirm
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
