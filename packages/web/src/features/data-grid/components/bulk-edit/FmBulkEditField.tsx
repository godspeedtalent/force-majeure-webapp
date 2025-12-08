
import { Label } from '@/components/common/shadcn/label';
import { Input } from '@/components/common/shadcn/input';
import { Switch } from '@/components/common/shadcn/switch';
import { Calendar } from '@/components/common/shadcn/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/common/shadcn/popover';
import { Button } from '@/components/common/shadcn/button';
import { format as formatDate } from 'date-fns';
import { CalendarIcon, Check } from 'lucide-react';
import { cn } from '@force-majeure/shared/utils/utils';
import { DataGridColumn } from '../FmDataGrid';

export interface FmBulkEditFieldProps {
  column: DataGridColumn;
  value: any;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  onValueChange: (value: any) => void;
}

export function FmBulkEditField({
  column,
  value,
  enabled,
  onToggle,
  onValueChange,
}: FmBulkEditFieldProps) {
  const renderInput = () => {
    switch (column.type) {
      case 'boolean':
        return (
          <Switch
            checked={value ?? false}
            onCheckedChange={onValueChange}
            disabled={!enabled}
          />
        );

      case 'date':
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant='outline'
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !value && 'text-muted-foreground',
                  !enabled && 'opacity-50'
                )}
                disabled={!enabled}
              >
                <CalendarIcon className='mr-2 h-4 w-4' />
                {value ? formatDate(new Date(value), 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-auto p-0' align='start'>
              <Calendar
                mode='single'
                selected={value ? new Date(value) : undefined}
                onSelect={date => onValueChange(date?.toISOString())}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );

      case 'number':
        return (
          <Input
            type='number'
            value={value ?? ''}
            onChange={e => onValueChange(parseFloat(e.target.value))}
            disabled={!enabled}
            placeholder='Enter number...'
          />
        );

      case 'email':
        return (
          <Input
            type='email'
            value={value ?? ''}
            onChange={e => onValueChange(e.target.value)}
            disabled={!enabled}
            placeholder='Enter email...'
          />
        );

      case 'url':
        return (
          <Input
            type='url'
            value={value ?? ''}
            onChange={e => onValueChange(e.target.value)}
            disabled={!enabled}
            placeholder='Enter URL...'
          />
        );

      default:
        return (
          <Input
            type='text'
            value={value ?? ''}
            onChange={e => onValueChange(e.target.value)}
            disabled={!enabled}
            placeholder='Enter value...'
          />
        );
    }
  };

  return (
    <div
      className={cn(
        'flex items-start gap-4 p-4 rounded-none border transition-colors',
        enabled ? 'bg-fm-gold/5 border-fm-gold/30' : 'bg-muted/20 border-border/50'
      )}
    >
      {/* Toggle */}
      <div className='flex items-center pt-2'>
        <Switch checked={enabled} onCheckedChange={onToggle} />
      </div>

      {/* Field info and input */}
      <div className='flex-1 space-y-2'>
        <div className='flex items-center justify-between'>
          <Label className='text-base font-medium'>{column.label}</Label>
          {column.required && (
            <span className='text-xs text-muted-foreground'>(Required)</span>
          )}
        </div>
        {renderInput()}
      </div>

      {/* Status indicator */}
      {enabled && (
        <div className='pt-2'>
          <Check className='h-5 w-5 text-fm-gold' />
        </div>
      )}
    </div>
  );
}
