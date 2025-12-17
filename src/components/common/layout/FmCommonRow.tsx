import { ReactNode } from 'react';

import { cn } from '@/shared';

export interface FmCommonRowProps {
  leading?: ReactNode;
  title: ReactNode;
  titleClassName?: string;
  subtitle?: ReactNode;
  subtitleClassName?: string;
  trailing?: ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export const FmCommonRow = ({
  leading,
  title,
  titleClassName,
  subtitle,
  subtitleClassName,
  trailing,
  onClick,
  className,
  disabled = false,
}: FmCommonRowProps) => {
  const interactive = Boolean(onClick) && !disabled;

  return (
    <button
      type={interactive ? 'button' : 'button'}
      onClick={interactive ? onClick : undefined}
      disabled={disabled}
      className={cn(
        'w-full flex items-center gap-3 rounded-none border border-border/60 bg-background/70 px-4 py-3 text-left transition-colors',
        interactive &&
          'hover:border-fm-gold/80 hover:bg-fm-gold/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-fm-gold/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer',
        disabled && 'opacity-60 cursor-not-allowed',
        !interactive && !disabled && 'cursor-default',
        className
      )}
    >
      {leading && <div className='flex-shrink-0'>{leading}</div>}
      <div className='flex-1 min-w-0 space-y-1'>
        <div className={cn('text-sm font-semibold text-foreground truncate', titleClassName)}>
          {title}
        </div>
        {subtitle && (
          <div className={cn('text-xs text-muted-foreground/80 truncate', subtitleClassName)}>
            {subtitle}
          </div>
        )}
      </div>
      {trailing && <div className='flex-shrink-0'>{trailing}</div>}
    </button>
  );
};
