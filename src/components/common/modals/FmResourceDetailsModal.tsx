import { ReactNode } from 'react';

import { FmCommonModal } from './FmCommonModal';
import { cn } from '@/shared/utils/utils';

interface ResourceMetadataItem {
  label: string;
  value: ReactNode;
}

interface FmResourceDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  imageUrl?: string | null;
  metadata?: ResourceMetadataItem[];
  footer?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export const FmResourceDetailsModal = ({
  open,
  onOpenChange,
  title,
  subtitle,
  eyebrow,
  imageUrl,
  metadata,
  footer,
  children,
  className,
}: FmResourceDetailsModalProps) => {
  return (
    <FmCommonModal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={subtitle}
      className={cn('max-w-3xl', className)}
    >
      {eyebrow && (
        <p className='text-[10px] uppercase tracking-[0.35em] text-white/60 mb-3'>
          {eyebrow}
        </p>
      )}

      {imageUrl && (
        <div className='relative mb-6 overflow-hidden rounded-2xl border border-white/20 bg-white/5'>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={title}
            className='h-56 w-full object-cover'
          />
        </div>
      )}

      {metadata && metadata.length > 0 && (
        <dl className='mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2'>
          {metadata.map((item, index) => (
            <div key={`${item.label}-${index}`} className='space-y-1'>
              <dt className='text-xs uppercase tracking-[0.3em] text-white/50'>
                {item.label}
              </dt>
              <dd className='text-sm text-white/90'>{item.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {children && (
        <div className='prose prose-invert max-w-none text-sm text-white/80'>
          {children}
        </div>
      )}

      {footer && <div className='mt-6'>{footer}</div>}
    </FmCommonModal>
  );
};
