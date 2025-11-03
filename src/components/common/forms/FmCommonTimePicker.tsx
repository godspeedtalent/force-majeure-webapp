import { Clock } from 'lucide-react';
import { cn } from '@/shared/utils/utils';
import { Input } from '@/components/common/shadcn/input';

interface FmCommonTimePickerProps {
  value?: string;
  onChange: (time: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function FmCommonTimePicker({
  value = '21:00',
  onChange,
  placeholder = 'Select time',
  disabled = false,
  className,
}: FmCommonTimePickerProps) {
  return (
    <div className={cn('relative', className)}>
      <Input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={cn(
          'bg-black/40 border-white/20 text-white pl-10',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        placeholder={placeholder}
      />
      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50 pointer-events-none" />
    </div>
  );
}
