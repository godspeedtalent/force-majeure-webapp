import { cn } from '@/shared';
import { FmMobileDataGridFieldProps } from './types';

/**
 * Simple dumb component for rendering a single field (label: value pair) in a mobile card
 *
 * Text handling:
 * - Titles and subtitles: 2-line clamp with ellipsis
 * - Regular fields: wrap text, hyphenate long words if needed
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
      <h3
        className={cn(
          'font-semibold text-foreground',
          'line-clamp-2 break-words hyphens-auto',
          className
        )}
      >
        {value}
      </h3>
    );
  }

  if (isSubtitle) {
    return (
      <p
        className={cn(
          'text-sm text-muted-foreground',
          'line-clamp-2 break-words hyphens-auto',
          className
        )}
      >
        {value}
      </p>
    );
  }

  return (
    <div className={cn('flex flex-col gap-0.5 min-w-0', className)}>
      {showLabel && (
        <span className='text-xs text-muted-foreground uppercase tracking-wide truncate'>
          {label}
        </span>
      )}
      <span className='text-sm text-foreground break-words hyphens-auto line-clamp-3'>
        {value ?? '-'}
      </span>
    </div>
  );
}
