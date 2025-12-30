import { ReactNode } from 'react';
import { Settings } from 'lucide-react';

import { FmCommonModal } from './FmCommonModal';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonBadgeGroup, FmCommonBadgeItem as BadgeItem } from '@/components/common/display/FmCommonBadgeGroup';
import { DialogTitle } from '@/components/common/shadcn/dialog';
import { cn } from '@/shared';

export interface ResourceMetadataItem {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
}

export interface FmResourceDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  imageUrl?: string | null;
  metadata?: ResourceMetadataItem[];
  badges?: BadgeItem[];
  footer?: ReactNode;
  children?: ReactNode;
  className?: string;
  /** Layout variant: 'hero' for full-width hero image, 'side-by-side' for image beside content */
  layout?: 'hero' | 'side-by-side';
  /** Show manage button in header */
  canManage?: boolean;
  /** Callback when manage button is clicked */
  onManage?: () => void;
  /** Image aspect ratio for side-by-side layout */
  imageAspectRatio?: string;
  /** Placeholder gradient when no image */
  imagePlaceholder?: boolean;
  /** Actions to show at the bottom (buttons, links, etc.) */
  actions?: ReactNode;
}

export const FmResourceDetailsModal = ({
  open,
  onOpenChange,
  title,
  eyebrow,
  imageUrl,
  metadata,
  badges,
  footer,
  children,
  className,
  layout = 'hero',
  canManage = false,
  onManage,
  imageAspectRatio = 'aspect-[3/4]',
  imagePlaceholder = true,
  actions,
}: FmResourceDetailsModalProps) => {
  const showManage = canManage && onManage;

  // Manage button styled to sit in top-right, left of the close X button
  const manageButton = showManage ? (
    <FmCommonButton
      size='sm'
      variant='secondary'
      icon={Settings}
      onClick={onManage}
      className='absolute right-12 top-4 bg-white/10 text-white hover:bg-white/20 border border-white/30 px-3 py-1 h-7 text-xs'
    >
      Manage
    </FmCommonButton>
  ) : null;

  // Hero layout - full-width image at top
  if (layout === 'hero') {
    return (
      <FmCommonModal
        open={open}
        onOpenChange={onOpenChange}
        title=''
        headerContent={<DialogTitle className='sr-only'>{title}</DialogTitle>}
        className={cn('max-w-3xl p-0 overflow-hidden', className)}
      >
        {manageButton}
        {/* Hero Image */}
        {imageUrl && (
          <div className='w-full h-64 overflow-hidden relative'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={title}
              className='w-full h-full object-cover'
            />
            <div className='absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent' />
          </div>
        )}

        <div className='p-8 flex flex-col gap-6'>
          {eyebrow && (
            <div className='space-y-3'>
              <p className='text-[10px] uppercase tracking-[0.35em] text-white/50'>
                {eyebrow}
              </p>
              <h2 className='text-3xl font-canela font-semibold text-white leading-tight'>
                {title}
              </h2>
            </div>
          )}

          {metadata && metadata.length > 0 && (
            <div className='flex flex-col gap-2'>
              {metadata.map((item, index) => (
                <div key={`${item.label}-${index}`} className='flex items-start gap-3 text-sm text-white/70'>
                  {item.icon && <span className='flex-shrink-0 mt-0.5 text-fm-gold'>{item.icon}</span>}
                  <span>{item.value}</span>
                </div>
              ))}
            </div>
          )}

          {children && (
            <div className={cn(
              'max-w-none text-sm text-white/80 leading-relaxed whitespace-pre-wrap',
              !children && 'italic text-white/60'
            )}>
              {children}
            </div>
          )}

          {badges && badges.length > 0 && (
            <FmCommonBadgeGroup
              badges={badges}
              badgeClassName='border-fm-gold/60 bg-fm-gold/10 text-fm-gold'
              gap='lg'
            />
          )}

          {actions && (
            <div className='flex flex-wrap gap-3'>
              {actions}
            </div>
          )}
        </div>

        {footer && <div className='px-8 pb-8'>{footer}</div>}
      </FmCommonModal>
    );
  }

  // Side-by-side layout - image on left, content on right
  return (
    <FmCommonModal
      open={open}
      onOpenChange={onOpenChange}
      title=''
      headerContent={<DialogTitle className='sr-only'>{title}</DialogTitle>}
      className={cn('max-w-3xl', className)}
    >
      {manageButton}
      <div className='flex flex-col gap-8 sm:flex-row sm:items-stretch'>
        <div className='sm:w-60 flex-shrink-0'>
          <div className='space-y-3'>
            {eyebrow && (
              <p className='text-[10px] uppercase tracking-[0.35em] text-white/50'>
                {eyebrow}
              </p>
            )}
            <h2 className='text-3xl font-canela font-semibold text-white leading-tight'>
              {title}
            </h2>
          </div>
          <div className='mt-4 overflow-hidden rounded-xl border border-white/15 bg-white/5 shadow-inner'>
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={title}
                className={cn(imageAspectRatio, 'w-full object-cover')}
              />
            ) : imagePlaceholder ? (
              <div className={cn(imageAspectRatio, 'w-full bg-gradient-to-br from-fm-gold/15 via-fm-gold/5 to-transparent')} />
            ) : null}
          </div>
        </div>

        <div className='flex-1 flex flex-col justify-center gap-6 sm:min-h-[320px]'>
          {metadata && metadata.length > 0 && (
            <dl className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              {metadata.map((item, index) => (
                <div key={`${item.label}-${index}`} className='space-y-1'>
                  <dt className='text-xs uppercase tracking-[0.3em] text-white/50'>
                    {item.label}
                  </dt>
                  <dd className='text-sm text-white/90 flex items-center gap-2'>
                    {item.icon}
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          {children && (
            <div className={cn(
              'max-w-none text-sm text-white/80 leading-relaxed whitespace-pre-wrap',
              !children && 'italic text-white/60'
            )}>
              {children}
            </div>
          )}

          {badges && badges.length > 0 && (
            <FmCommonBadgeGroup
              badges={badges}
              className='mt-auto'
              badgeClassName='border-fm-gold/60 bg-fm-gold/10 text-fm-gold'
              gap='lg'
            />
          )}

          {actions && (
            <div className='flex flex-wrap gap-3'>
              {actions}
            </div>
          )}
        </div>
      </div>

      {footer && <div className='mt-6'>{footer}</div>}
    </FmCommonModal>
  );
};
