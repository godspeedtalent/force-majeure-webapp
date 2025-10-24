import { ReactNode, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
      <CollapsibleTrigger className="flex items-center justify-between w-full py-3 px-4 hover:bg-white/5 transition-colors">
        <span className="font-canela text-sm text-white">{title}</span>
        <ChevronDown
          className={cn('h-4 w-4 text-white transition-transform', isOpen && 'rotate-180')}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-4">
        <div className="border-l border-white/20 pl-4 ml-2">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
};
