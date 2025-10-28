import { useState, forwardRef } from 'react';
import { Input } from '@/components/ui/shadcn/input';
import { Button } from '@/components/ui/shadcn/button';
import { Loader2, ArrowRight } from 'lucide-react';
import { cn } from '@/shared/utils/utils';

interface FmCommonQueryInputProps {
  placeholder?: string;
  onQuery: (value: string) => Promise<void>;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

export const FmCommonQueryInput = forwardRef<HTMLInputElement, FmCommonQueryInputProps>(
  ({ placeholder, onQuery, isLoading = false, disabled = false, className }, ref) => {
    const [value, setValue] = useState('');
    const [isQuerying, setIsQuerying] = useState(false);

    const handleSubmit = async () => {
      if (!value.trim() || isQuerying || disabled) return;

      setIsQuerying(true);
      try {
        await onQuery(value.trim());
      } finally {
        setIsQuerying(false);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    };

    const isProcessing = isLoading || isQuerying;

    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className='relative flex-1'>
          <Input
            ref={ref}
            type='text'
            placeholder={placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            disabled={disabled || isProcessing}
            className={cn(
              'pr-8 uppercase text-xs h-8',
              isProcessing && 'opacity-50'
            )}
          />
          {isProcessing && (
            <div className='absolute right-2 top-1/2 -translate-y-1/2'>
              <Loader2 className='h-3 w-3 animate-spin text-muted-foreground' />
            </div>
          )}
        </div>
        <Button
          size='sm'
          onClick={handleSubmit}
          disabled={!value.trim() || disabled || isProcessing}
          className='h-8 px-3 bg-fm-gold hover:bg-fm-gold/90 text-black font-medium'
        >
          <ArrowRight className='h-3 w-3' />
        </Button>
      </div>
    );
  }
);

FmCommonQueryInput.displayName = 'FmCommonQueryInput';
