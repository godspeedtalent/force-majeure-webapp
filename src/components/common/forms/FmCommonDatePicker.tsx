import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/shared/utils/utils';
import { Button } from '@/components/common/shadcn/button';
import { Calendar } from '@/components/common/shadcn/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/common/shadcn/popover';

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
  placeholder = 'Pick a date',
  disabled = false,
  disablePastDates = true,
}: FmCommonDatePickerProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

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
          {value ? format(value, 'PPP') : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0 bg-black/90 backdrop-blur-md border border-white/20 pointer-events-auto" 
        align="start"
      >
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          disabled={disablePastDates ? (date) => date < today : undefined}
          initialFocus
          className="pointer-events-auto"
          classNames={{
            day_selected: 'bg-fm-gold text-black hover:bg-fm-gold hover:text-black focus:bg-fm-gold focus:text-black',
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
