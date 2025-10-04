import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TwoColumnLayoutProps {
  left: ReactNode;
  right: ReactNode;
  leftDecor?: boolean;
  rightImage?: string;
  border?: boolean;
  className?: string;
}

export const TwoColumnLayout = ({
  left,
  right,
  leftDecor = true,
  rightImage,
  border = true,
  className,
}: TwoColumnLayoutProps) => {
  return (
    <div className={cn('min-h-screen flex', className)}>
      {/* Left Column */}
      <div className={cn(
        'w-1/2 flex items-center justify-center overflow-y-auto relative',
        border && 'border-r border-border'
      )}>
        {leftDecor && (
          <div className="absolute inset-0 bg-topographic opacity-25 bg-repeat bg-center" />
        )}
        <div className="w-full max-w-3xl px-8 py-12 relative z-10">
          {left}
        </div>
      </div>

      {/* Right Column */}
      <div className="w-1/2 bg-muted relative overflow-hidden">
        {rightImage ? (
          <>
            <img 
              src={rightImage} 
              alt="Background" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-background/5 backdrop-blur-[0.5px]" />
          </>
        ) : (
          right
        )}
      </div>
    </div>
  );
};
