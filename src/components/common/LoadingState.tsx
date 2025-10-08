import { Loader2 } from 'lucide-react';

import { cn } from '@/shared/utils/utils';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  centered?: boolean;
  className?: string;
}

const sizeMap = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

export const LoadingState = ({
  message,
  size = 'md',
  centered = true,
  className,
}: LoadingStateProps) => {
  const content = (
    <div className={cn('text-center', className)}>
      <Loader2
        className={cn(sizeMap[size], 'animate-spin text-fm-gold mx-auto mb-4')}
      />
      {message && <p className='text-sm text-muted-foreground'>{message}</p>}
    </div>
  );

  if (centered) {
    return (
      <div className='flex items-center justify-center min-h-[200px]'>
        {content}
      </div>
    );
  }

  return content;
};
