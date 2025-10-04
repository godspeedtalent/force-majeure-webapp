import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LoadingState } from './LoadingState';

interface MessagePanelProps {
  title: string;
  description?: string;
  action?: ReactNode;
  isLoading?: boolean;
  className?: string;
}

export const MessagePanel = ({
  title,
  description,
  action,
  isLoading = false,
  className,
}: MessagePanelProps) => {
  if (isLoading) {
    return <LoadingState centered />;
  }

  return (
    <div className={cn(
      'bg-background/60 backdrop-blur-md border-2 border-border/40 p-12 text-center w-full shadow-2xl',
      'animate-slide-up-fade',
      className
    )}>
      <h1 className="font-display text-5xl md:text-6xl mb-4">
        {title}
      </h1>
      {description && (
        <p className="text-lg text-muted-foreground mb-8">
          {description}
        </p>
      )}
      {action && (
        <div className="space-y-6">
          {action}
        </div>
      )}
    </div>
  );
};
