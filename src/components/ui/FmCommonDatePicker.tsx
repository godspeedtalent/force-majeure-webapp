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
  disablePastDates?: boolean;
}

export function FmCommonDatePicker({
  value,
  onChange,
  placeholder = 'Pick a date and time',
  disabled = false,
  disablePastDates = true,
}: FmCommonDatePickerProps) {
  const [time, setTime] = React.useState('21:00');
  const [tempDate, setTempDate] = React.useState<Date | undefined>(value);
  const [tempTime, setTempTime] = React.useState('21:00');
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    if (value) {
      setTime(format(value, 'HH:mm'));
      setTempDate(value);
      setTempTime(format(value, 'HH:mm'));
    }
  }, [value]);

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
            const lastClick = (window as any).lastCalendarClick || 0;
            if (now - lastClick < 300) {
              handleDateDoubleClick(date);
            }
            (window as any).lastCalendarClick = now;
          }}
          disabled={disablePastDates ? (date) => date < today : undefined}
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
