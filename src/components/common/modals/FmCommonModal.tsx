import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/common/shadcn/dialog';
import { cn } from '@/shared/utils/utils';

interface FmCommonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  headerActions?: React.ReactNode;
  headerContent?: React.ReactNode;
}

export const FmCommonModal = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  className = '',
  headerActions,
  headerContent,
}: FmCommonModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'bg-black/90 backdrop-blur-md border border-white/20 text-white max-w-2xl',
          className
        )}
      >
        {headerContent ? (
          <div className='mb-4'>{headerContent}</div>
        ) : (
          <DialogHeader
            className={cn('space-y-2', headerActions && 'sm:space-y-0')}
          >
            <div
              className={cn(
                'flex flex-col gap-3 pr-10',
                headerActions &&
                  'sm:flex-row sm:items-start sm:justify-between sm:gap-6'
              )}
            >
              <div className='space-y-2'>
                <DialogTitle className='font-canela text-2xl text-white'>
                  {title}
                </DialogTitle>
                {description && (
                  <DialogDescription className='text-white/70'>
                    {description}
                  </DialogDescription>
                )}
              </div>
              {headerActions && (
                <div className='flex items-center justify-end gap-2 sm:min-w-[7rem]'>
                  {headerActions}
                </div>
              )}
            </div>
          </DialogHeader>
        )}
        <div className='mt-4'>{children}</div>
      </DialogContent>
    </Dialog>
  );
};
