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
}

export const FmCommonModal = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  className = '',
}: FmCommonModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'bg-black/90 backdrop-blur-md border border-white/20 text-white max-w-2xl',
          className
        )}
      >
        <DialogHeader>
          <DialogTitle className="font-canela text-2xl text-white">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-white/70">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="mt-4">{children}</div>
      </DialogContent>
    </Dialog>
  );
};
