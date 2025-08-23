import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SplitPageLayoutProps {
  left: ReactNode;
  right: ReactNode;
  leftWidthClass?: string;
  rightWidthClass?: string;
  leftDecor?: boolean;
}

const SplitPageLayout = ({ 
  left, 
  right, 
  leftWidthClass = "lg:w-1/2", 
  rightWidthClass = "lg:w-1/2",
  leftDecor = false 
}: SplitPageLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className={cn(
        "w-full relative",
        leftWidthClass,
        leftDecor && "before:absolute before:inset-0 before:bg-topographic-pattern before:opacity-5 before:z-0"
      )}>
        <div className="relative z-10 h-full">
          {left}
        </div>
      </div>
      <div className={cn("w-full", rightWidthClass)}>
        {right}
      </div>
    </div>
  );
};

export default SplitPageLayout;