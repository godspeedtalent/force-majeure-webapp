import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Separator } from '@/components/common/shadcn/separator';

interface ComponentGroupProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  id?: string;
}

export function ComponentGroup({
  title,
  children,
  defaultOpen = true,
  id,
}: ComponentGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className='space-y-4' id={id}>
      <div
        className='flex items-center gap-2 cursor-pointer group py-2'
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <ChevronDown className='h-5 w-5 text-fm-gold transition-transform' />
        ) : (
          <ChevronRight className='h-5 w-5 text-fm-gold transition-transform' />
        )}
        <h3 className='text-xl font-canela font-semibold text-foreground group-hover:text-fm-gold transition-colors'>
          {title}
        </h3>
      </div>
      {isOpen && <div className='space-y-4 ml-7'>{children}</div>}
      <Separator className='mt-6' />
    </div>
  );
}
