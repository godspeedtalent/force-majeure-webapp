import { ReactNode, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings } from 'lucide-react';

import { FmCommonModal } from './FmCommonModal';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonBadgeGroup, FmCommonBadgeItem as BadgeItem } from '@/components/common/display/FmCommonBadgeGroup';
import { DialogTitle } from '@/components/common/shadcn/dialog';
import { Skeleton } from '@/components/common/shadcn/skeleton';
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
  /** Logo/icon URL displayed next to the title */
  logoUrl?: string | null;
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
  logoUrl,
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
  const { t } = useTranslation('common');
  const [isImageLoading, setIsImageLoading] = useState(true);
  const showManage = canManage && onManage;

  // Reset loading state when imageUrl changes
  useEffect(() => {
    if (imageUrl) {
      setIsImageLoading(true);
    }
  }, [imageUrl]);

  // Header row with eyebrow on left and manage button on right
  const headerRow = (eyebrow || showManage) ? (
    <div className='absolute top-4 left-4 right-4 flex items-center justify-between z-10'>
      {eyebrow && (
        <p className='text-[10px] uppercase tracking-[0.35em] text-white/70'>
          {eyebrow}
        </p>
      )}
      {!eyebrow && <div />}
      {showManage && (
        <FmCommonButton
          size='sm'
          variant='default'
          icon={Settings}
          onClick={onManage}
          className='h-7 text-xs mr-8'
        >
          {t('buttons.manage')}
        </FmCommonButton>
      )}
    </div>
  ) : null;

  // Hero layout - full-width image at top
  if (layout === 'hero') {
    return (
      <FmCommonModal
        open={open}
        onOpenChange={onOpenChange}
        title=''
        headerContent={<DialogTitle className='sr-only'>{title}</DialogTitle>}
        className={cn('max-w-3xl max-h-[90vh] p-0 flex flex-col', className)}
      >
        {headerRow}
        {/* Hero Image - fixed height, doesn't scroll */}
        {imageUrl && (
          <div className='w-full h-64 flex-shrink-0 overflow-hidden relative border-b-2 border-fm-gold'>
            {isImageLoading && (
              <Skeleton className='absolute inset-0 w-full h-full rounded-none' />
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={title}
              className={cn(
                'w-full h-full object-cover transition-opacity duration-300',
                isImageLoading ? 'opacity-0' : 'opacity-100'
              )}
              onLoad={() => setIsImageLoading(false)}
            />
          </div>
        )}

        {/* Scrollable content area */}
        <div className='flex-1 overflow-y-auto min-h-0'>
          <div className='p-8 flex flex-col gap-6'>
            {/* Title with optional logo */}
            <div className='flex items-center gap-4'>
              {logoUrl && (
                <div className='flex-shrink-0 w-12 h-12 border-2 border-fm-gold overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(223,186,125,0.4)]'>
                  <img
                    src={logoUrl}
                    alt={`${title} logo`}
                    className='w-full h-full object-cover'
                  />
                </div>
              )}
              <h2 className='text-3xl font-canela font-semibold text-white leading-tight'>
                {title}
              </h2>
            </div>

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
        </div>
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
      {headerRow}
      <div className='flex flex-col gap-8 sm:flex-row sm:items-stretch'>
        <div className='sm:w-60 flex-shrink-0'>
          <div className='space-y-3'>
            {eyebrow && (
              <p className='text-[10px] uppercase tracking-[0.35em] text-white/50'>
                {eyebrow}
              </p>
            )}
            <div className='flex items-center gap-3'>
              {logoUrl && (
                <div className='flex-shrink-0 w-10 h-10 border-2 border-fm-gold overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(223,186,125,0.4)]'>
                  <img
                    src={logoUrl}
                    alt={`${title} logo`}
                    className='w-full h-full object-cover'
                  />
                </div>
              )}
              <h2 className='text-3xl font-canela font-semibold text-white leading-tight'>
                {title}
              </h2>
            </div>
          </div>
          <div className='mt-4 overflow-hidden rounded-none border border-white/15 bg-white/5 shadow-inner relative'>
            {imageUrl ? (
              <>
                {isImageLoading && (
                  <Skeleton className={cn(imageAspectRatio, 'absolute inset-0 w-full rounded-none')} />
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt={title}
                  className={cn(
                    imageAspectRatio,
                    'w-full object-cover transition-opacity duration-300',
                    isImageLoading ? 'opacity-0' : 'opacity-100'
                  )}
                  onLoad={() => setIsImageLoading(false)}
                />
              </>
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
