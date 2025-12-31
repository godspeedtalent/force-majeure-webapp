import { cn } from '@/shared';
import { FmMobileDataGridFieldProps } from './types';

/**
 * Simple dumb component for rendering a single field (label: value pair) in a mobile card
 */
export function FmMobileDataGridField({
  label,
  value,
  showLabel = true,
  isTitle = false,
  isSubtitle = false,
  className,
}: FmMobileDataGridFieldProps) {
  if (isTitle) {
    return (
      <h3 className={cn('font-semibold text-foreground truncate', className)}>
        {value}
      </h3>
    );
  }

  if (isSubtitle) {
    return (
      <p className={cn('text-sm text-muted-foreground truncate', className)}>
        {value}
      </p>
    );
  }

  return (
    <div className={cn('flex flex-col gap-0.5', className)}>
      {showLabel && (
        <span className='text-xs text-muted-foreground uppercase tracking-wide'>
          {label}
        </span>
      )}
      <span className='text-sm text-foreground truncate'>
        {value ?? '-'}
      </span>
    </div>
  );
}
