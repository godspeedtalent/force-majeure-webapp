import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/common/shadcn/dialog';
import { Separator } from '@/components/common/shadcn/separator';
import { cn } from '@/shared/utils/utils';

interface FormSection {
  title?: string;
  content: React.ReactNode;
}

interface FmCommonFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  sections: FormSection[];
  actions?: React.ReactNode;
  className?: string;
}

export const FmCommonFormModal = ({
  open,
  onOpenChange,
  title,
  description,
  sections,
  actions,
  className = '',
}: FmCommonFormModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'bg-black/90 backdrop-blur-md border border-white/20 text-white max-w-2xl pointer-events-auto',
          className
        )}
      >
        <DialogHeader>
          <DialogTitle className='font-canela text-2xl text-white'>
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className='text-white/70'>
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className='mt-4 space-y-6 pointer-events-auto'>
          {sections.map((section, index) => (
            <React.Fragment key={index}>
              {index > 0 && <Separator className='bg-white/10' />}
              <div className='space-y-3 pointer-events-auto'>
                {section.title && (
                  <h3 className='text-sm font-semibold text-white/90 uppercase tracking-wide'>
                    {section.title}
                  </h3>
                )}
                {section.content}
              </div>
            </React.Fragment>
          ))}
          {actions && (
            <>
              <Separator className='bg-white/10' />
              <div className='pointer-events-auto'>{actions}</div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
