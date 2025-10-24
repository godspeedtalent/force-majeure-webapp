import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/shared/utils/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';

interface FmCommonDatePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function FmCommonDatePicker({
  value,
  onChange,
  placeholder = 'Pick a date and time',
  disabled = false,
}: FmCommonDatePickerProps) {
  const [time, setTime] = React.useState('19:00');

  React.useEffect(() => {
    if (value) {
      setTime(format(value, 'HH:mm'));
    }
  }, [value]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const [hours, minutes] = time.split(':').map(Number);
      date.setHours(hours, minutes);
      onChange(date);
    } else {
      onChange(undefined);
    }
  };

  const handleTimeChange = (newTime: string) => {
    setTime(newTime);
    if (value) {
      const [hours, minutes] = newTime.split(':').map(Number);
      const newDate = new Date(value);
      newDate.setHours(hours, minutes);
      onChange(newDate);
    }
  };

  return (
    <Popover>
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
          selected={value}
          onSelect={handleDateSelect}
          initialFocus
          className="pointer-events-auto"
        />
        <div className="p-3 border-t border-white/10">
          <label className="text-sm text-white/70 mb-2 block">Time</label>
          <Input
            type="time"
            value={time}
            onChange={(e) => handleTimeChange(e.target.value)}
            className="bg-black/40 border-white/20 text-white"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
