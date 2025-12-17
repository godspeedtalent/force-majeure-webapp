import { cn } from '@/shared';

interface FmCommonLoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function FmCommonLoadingSpinner({
  size = 'md',
  className,
}: FmCommonLoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-[3px]',
    lg: 'h-8 w-8 border-4',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-b-transparent border-fm-gold',
        sizeClasses[size],
        className
      )}
    />
  );
}
