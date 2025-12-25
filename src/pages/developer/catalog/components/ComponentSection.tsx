import { useState } from 'react';
import { ChevronDown, ChevronRight, AlertCircle } from 'lucide-react';
import {
  FmCommonCard,
  FmCommonCardContent,
  FmCommonCardDescription,
  FmCommonCardHeader,
  FmCommonCardTitle,
} from '@/components/common/display/FmCommonCard';

interface ComponentSectionProps {
  name: string;
  description: string;
  caveats?: string[];
  children: React.ReactNode;
  defaultOpen?: boolean;
  id?: string;
}

export function ComponentSection({
  name,
  description,
  caveats,
  children,
  defaultOpen = false,
  id,
}: ComponentSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <FmCommonCard className='border-border' id={id}>
      <FmCommonCardHeader
        className='cursor-pointer hover:bg-accent/5 transition-colors'
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className='flex items-start justify-between'>
          <div className='space-y-2 flex-1'>
            <div className='flex items-center gap-2'>
              {isOpen ? (
                <ChevronDown className='h-5 w-5 text-muted-foreground' />
              ) : (
                <ChevronRight className='h-5 w-5 text-muted-foreground' />
              )}
              <FmCommonCardTitle className='font-mono text-lg'>{name}</FmCommonCardTitle>
            </div>
            <FmCommonCardDescription>{description}</FmCommonCardDescription>
            {caveats && caveats.length > 0 && (
              <div className='flex items-start gap-2 text-sm text-yellow-500/80'>
                <AlertCircle className='h-4 w-4 mt-0.5 flex-shrink-0' />
                <div className='space-y-1'>
                  {caveats.map((caveat, idx) => (
                    <p key={idx}>{caveat}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </FmCommonCardHeader>
      {isOpen && <FmCommonCardContent className='pt-6 space-y-6'>{children}</FmCommonCardContent>}
    </FmCommonCard>
  );
}
