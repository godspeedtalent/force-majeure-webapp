import { ReactNode, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/common/shadcn/collapsible';
import { cn } from '@/shared/utils/utils';

interface FmCommonToggleHeaderProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export const FmCommonToggleHeader = ({
  title,
  children,
  defaultOpen = true,
  className = '',
}: FmCommonToggleHeaderProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
      <CollapsibleTrigger className='flex items-center justify-between w-full py-3 hover:bg-white/5 transition-colors group'>
        <span className='font-canela text-sm text-white group-hover:text-fm-gold transition-colors'>
          {title}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-white group-hover:text-fm-gold transition-all duration-300',
            isOpen && 'rotate-180'
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className='data-[state=open]:animate-slide-down data-[state=closed]:animate-slide-up'>
        <div className='border-l border-white/20 pl-4 ml-2 pb-4'>
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
